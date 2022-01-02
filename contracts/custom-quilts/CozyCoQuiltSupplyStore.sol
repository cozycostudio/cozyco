// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../membership/ICozyCoMembership.sol";
import "./ISuppliesMetadata.sol";
import "./ISupplyStore.sol";
import "./ICozyCoQuiltSupplyStore.sol";

contract CozyCoQuiltSupplyStore is
    Ownable,
    ERC1155Burnable,
    ReentrancyGuard,
    ISupplyStore,
    ICozyCoQuiltSupplyStore
{
    /**************************************************************************
     * STORAGE
     *************************************************************************/

    /** Proxies **/
    address public quiltMakerAddress;
    ICozyCoMembership private cozyCoMembership;
    mapping(address => bool) private approvedMinterContracts;

    /** Opening hours **/
    bool public storeOpenToMembers;
    bool public storeOpenToPublic;

    /** Tokens **/
    struct Token {
        address metadata;
        uint256 tokenType;
        uint256 price;
        uint256 memberPrice;
        uint256 quantity;
        uint256 metadataTokenAtIndex;
        bool memberExclusive;
    }
    mapping(uint256 => Token) private tokens;

    /** Bundles **/
    struct Bundle {
        uint256 size;
        uint256[] tokenIds;
        uint256[] cumulativeTokenIdWeights;
    }
    mapping(uint256 => Bundle) private bundles;

    /** Stock levels **/
    mapping(uint256 => uint256) private stockSoldToPublic;
    mapping(uint256 => uint256) private stockSoldToMembers;

    /** Creator payments **/
    mapping(address => mapping(uint256 => uint256)) private creatorShares; // creator => tokenId => share
    mapping(address => mapping(uint256 => bool)) private lockTokenForCreatorWithdraw;
    mapping(address => uint256) public releasedCreatorBalances;

    /**************************************************************************
     * ERRORS
     *************************************************************************/

    error InvalidConfiguration();
    error IncorrectPaymentAmount();
    error MemberExclusive();
    error NotAuthorized();
    error NotCollaborator();
    error NotFound();
    error OutOfStock();
    error StoreClosed();
    error TransferFailed();
    error ZeroBalance();

    /**************************************************************************
     * MODIFIERS
     *************************************************************************/

    modifier onlyWhileOpenToMembers() {
        if (!storeOpenToMembers) revert StoreClosed();
        _;
    }

    modifier onlyWhileOpenToPublic() {
        if (!storeOpenToPublic) revert StoreClosed();
        _;
    }

    modifier onlyMember(uint256 membershipId) {
        if (cozyCoMembership.balanceOf(_msgSender(), membershipId) < 1) revert NotAuthorized();
        _;
    }

    modifier onlyValidTokenIdsAndAmounts(uint256[] memory tokenIds, uint256[] memory amounts) {
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();
        _;
    }

    modifier onlyWhileInStock(uint256[] memory tokenIds, uint256[] memory amounts) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (stockSoldToPublic[tokenIds[i]] + amounts[i] > tokens[tokenIds[i]].quantity)
                revert OutOfStock();
        }
        _;
    }

    modifier onlyApprovedMinterContract() {
        if (!approvedMinterContracts[msg.sender]) revert NotAuthorized();
        _;
    }

    /**************************************************************************
     * PURCHASING SUPPLIES
     *************************************************************************/

    function purchaseSupplies(uint256[] memory tokenIds, uint256[] memory amounts)
        public
        payable
        nonReentrant
        onlyWhileOpenToPublic
        onlyValidTokenIdsAndAmounts(tokenIds, amounts)
    {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokens[tokenIds[i]].memberExclusive) revert MemberExclusive();
            totalPrice += tokens[tokenIds[i]].price * amounts[i];
            stockSoldToPublic[tokenIds[i]] += amounts[i];
        }
        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        _mintBatch(_msgSender(), tokenIds, amounts, "");
    }

    function purchaseSuppliesAsMember(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        public
        payable
        onlyMember(membershipId)
        onlyWhileOpenToMembers
        onlyValidTokenIdsAndAmounts(tokenIds, amounts)
    {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += tokens[tokenIds[i]].memberPrice * amounts[i];
            stockSoldToMembers[tokenIds[i]] += amounts[i];
        }
        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        _mintBatch(_msgSender(), tokenIds, amounts, "");
    }

    function purchaseSuppliesFromOtherContract(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        public
        payable
        override
        onlyApprovedMinterContract
        onlyValidTokenIdsAndAmounts(tokenIds, amounts)
    {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += tokens[tokenIds[i]].price * amounts[i];
            stockSoldToPublic[tokenIds[i]] += amounts[i];
        }
        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        _mintBatch(customer, tokenIds, amounts, "");
    }

    /**************************************************************************
     * OPEN BUNDLES
     *************************************************************************/

    function openSuppliesBundles(uint256[] memory tokenIds, uint256[] memory amounts) public {
        // `_burnBatch` checks if the from address has tokens and reverts if not
        // so we don't need to check any balances here which saves some gas
        _burnBatch(_msgSender(), tokenIds, amounts);

        // Work out how many new tokens to mint from the burned bundles
        uint256 toMintCount;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            toMintCount += bundles[tokenIds[i]].size * amounts[i];
        }

        // Get the unbundled tokenIds so we can mint them in a sec
        uint256[] memory unbundledTokenIds = new uint256[](toMintCount);
        uint256[] memory unbundledAmounts = new uint256[](toMintCount);
        uint256 idx;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            for (uint256 j = 0; j < bundles[tokenIds[i]].size * amounts[i]; j++) {
                uint256[] memory randWeights = bundles[tokenIds[i]].cumulativeTokenIdWeights;
                uint256 rng = Random.prng("B", Strings.toString(idx), _msgSender()) %
                    randWeights[randWeights.length - 1];
                uint256 randIdx;
                for (uint256 k = 0; k < randWeights.length; k++) {
                    if (k > rng) {
                        randIdx = k;
                        break;
                    }
                }
                unbundledTokenIds[idx] = bundles[tokenIds[i]].tokenIds[randIdx];
                unbundledAmounts[idx] = 1;
                idx++;
            }
        }

        // Mint, but don't increase stock levels because it will affect purchasing of individual
        // tokens. The stock is checked and we don't want bundles to take away from the fixed
        // amounts in the "stock room".
        _mintBatch(_msgSender(), unbundledTokenIds, unbundledAmounts, "");
    }

    /**************************************************************************
     * STOCK MANAGEMENT
     *************************************************************************/

    function _addToStockRoom(
        uint256 tokenId,
        address metadata,
        uint256 tokenType,
        uint256 price,
        uint256 memberPrice,
        uint256 quantity,
        uint256 metadataTokenAtIndex,
        bool memberExclusive
    ) internal {
        /**
          CUSTOMER GAS SAVING ALERT
          We don't want customers to pay unnecessary gas. This function is more gassy but the
          person calling this (owner) pays more instead of passing that cost on to customers.

          There are two things we do here when the quantity hasn't been set yet.

          1. We set the `stockSoldToPublic` and `stockSoldtoMembers` to one. This is so the
              first customer to purchase the specific token doesn't pay extra gas to set a
              non-zero value. It's cheaper to update `1` to `2` than it is to update `0` to `1`.
        */

        stockSoldToPublic[tokenId] = 1;
        stockSoldToMembers[tokenId] = 1;

        /**
          2. The second is adding three to the stored quantity. This is to include the two
            we just added, and an extra one so we can use a LT check instead of a LTE check when
            seeing if there's still stock left. 
        */

        tokens[tokenId] = Token(
            metadata,
            tokenType,
            price,
            memberPrice,
            quantity + 3,
            metadataTokenAtIndex,
            memberExclusive
        );
    }

    function stockInSupplies(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory tokenTypes,
        uint256[] memory prices,
        uint256[] memory memberPrices,
        uint256[] memory quantities,
        uint256[] memory metadataTokenAtIndexes,
        bool[] memory isMemberExclusives
    ) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _addToStockRoom(
                tokenIds[i],
                metadata,
                tokenTypes[i],
                prices[i],
                memberPrices[i],
                quantities[i],
                metadataTokenAtIndexes[i],
                isMemberExclusives[i]
            );
        }
    }

    function stockInBundledSupplies(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory tokenTypes,
        uint256[] memory prices,
        uint256[] memory memberPrices,
        uint256[] memory quantities,
        uint256[] memory metadataTokenAtIndexes,
        bool[] memory isMemberExclusives,
        uint256[] memory bundleSizes,
        uint256[][] memory tokenIdsInBundle,
        uint256[][] memory cumulativeTokenIdWeights
    ) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _addToStockRoom(
                tokenIds[i],
                metadata,
                tokenTypes[i],
                prices[i],
                memberPrices[i],
                quantities[i],
                metadataTokenAtIndexes[i],
                isMemberExclusives[i]
            );

            if (tokenIdsInBundle[i].length != cumulativeTokenIdWeights[i].length) {
                revert InvalidConfiguration();
            }

            bundles[tokenIds[i]] = Bundle(
                bundleSizes[i],
                tokenIdsInBundle[i],
                cumulativeTokenIdWeights[i]
            );
        }
    }

    function restockSupplies(uint256[] memory tokenIds, uint256[] memory quantities)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokens[tokenIds[i]].quantity += quantities[i];
        }
    }

    // Used as a safety net in case anything goes wrong setting the metadata above
    // function dangerouslySetTokenInfo(
    //     uint256[] memory tokenIds,
    //     address metadata,
    //     uint256[] memory tokenTypes,
    //     uint256[] memory prices,
    //     uint256[] memory memberPrices,
    //     uint256[] memory quantities,
    //     uint256[] memory metadataTokenAtIndexes,
    //     bool[] memory isMemberExclusives
    // ) public onlyOwner {
    //     for (uint256 i = 0; i < tokenIds.length; i++) {
    //         // Do something
    //     }
    // }
    // function dangerouslySetBundleInfo(
    //     uint256[] memory tokenIds,
    //     uint256[] memory bundleSizes,
    //     uint256[][] memory tokenIdsInBundle
    // ) public onlyOwner {
    //     for (uint256 i = 0; i < tokenIds.length; i++) {
    //         // Do something
    //     }
    // }

    /**************************************************************************
     * TOKEN URI
     *************************************************************************/

    function uri(uint256 id) public view virtual override returns (string memory tokenURI) {
        if (tokens[id].metadata == address(0)) revert NotFound();
        tokenURI = ISuppliesMetadata(tokens[id].metadata).tokenURI(
            id,
            tokens[id].metadataTokenAtIndex
        );
    }

    /**************************************************************************
     * GETTERS
     *************************************************************************/

    function getItemMetadataAddress(uint256 tokenId)
        public
        view
        override
        returns (address metadata)
    {
        metadata = tokens[tokenId].metadata;
    }

    function getItemMaxStock(uint256 tokenId) public view override returns (uint256 stock) {
        // Subtract the three we added for gas savings when creating the token
        stock = tokens[tokenId].quantity - 3;
    }

    function getUnitsSold(uint256 tokenId)
        public
        view
        override
        returns (
            uint256 toPublic,
            uint256 toMembers,
            uint256 total
        )
    {
        toPublic = stockSoldToPublic[tokenId];
        toMembers = stockSoldToPublic[tokenId];
        total = toPublic + toMembers;
    }

    /**************************************************************************
     * STORE ADMIN
     *************************************************************************/

    function openToPublic() public onlyOwner {
        storeOpenToPublic = true;
    }

    function openToMembers() public onlyOwner {
        storeOpenToMembers = true;
    }

    function closeStore() public onlyOwner {
        storeOpenToPublic = false;
        storeOpenToMembers = false;
    }

    function setQuiltMakerAddress(address addr) public onlyOwner {
        quiltMakerAddress = addr;
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool isApproved)
    {
        // Approve the admin contract by default
        if (operator == quiltMakerAddress) {
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }

    /**************************************************************************
     * CREATORS
     *************************************************************************/

    function addCreatorPayments(
        address[] memory creators,
        uint256[] memory shares,
        uint256[] memory tokenIds
    ) public onlyOwner {
        uint256 totalShares;
        for (uint256 i = 0; i < creators.length; i++) {
            totalShares += shares[i];
            for (uint256 j = 0; j < tokenIds.length; j++) {
                creatorShares[creators[i]][tokenIds[j]] = shares[i];
            }
        }
        if (totalShares != 10000) revert InvalidConfiguration();
    }

    // Not really meant to be called directly by an end user, but batching by
    // tokenId prevents not being able to access funds if the list of tokenIds
    // gets too long. Because it loops over each tokenId to get the balance, if
    // a creator had a large amount of tokens, this could lock them out.
    // TODO: Explain above better!
    function creatorBatchWithdraw(uint256[] memory tokenIds) public nonReentrant {
        uint256 balance;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            // Skip this iteration if they have no shares for this token
            if (creatorShares[msg.sender][tokenId] == 0) continue;

            // Skip this iteration if they're currently trying to withdraw a balance from this token
            if (lockTokenForCreatorWithdraw[msg.sender][tokenId]) continue;
            // Lock the withdraw state for this token to avoid duplicate payments
            lockTokenForCreatorWithdraw[msg.sender][tokenId] = true;

            // Calculate sales figures for this token and add it to the pending balance
            uint256 totalPaymentForSales = (stockSoldToPublic[tokenId] * tokens[tokenId].price) +
                (stockSoldToMembers[tokenId] * tokens[tokenId].memberPrice);
            balance += (totalPaymentForSales * creatorShares[msg.sender][tokenId]) / 10000;
        }

        if (balance == 0) revert ZeroBalance();

        // Update released payment balance, and unlock for future payments
        releasedCreatorBalances[msg.sender] += balance;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            lockTokenForCreatorWithdraw[msg.sender][tokenIds[i]] = false;
        }

        // Send the payment
        (bool success, ) = msg.sender.call{value: balance}(new bytes(0));
        if (!success) revert TransferFailed();
    }

    /**************************************************************************
     * STANDARDS
     *************************************************************************/

    constructor() ERC1155("") Ownable() {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
