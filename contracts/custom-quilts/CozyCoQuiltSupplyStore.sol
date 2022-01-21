// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC1155, IERC1155} from "../tokens/ERC1155.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../utils/Strings.sol";
import "./SupplySKU.sol";
import "./ISuppliesMetadata.sol";
import "./ISupplyStore.sol";

interface ICozyCoQuiltSupplyStore is ISupplyStore {
    function purchaseSuppliesFromOtherContract(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bool skipStockCheck
    ) external payable;
}

contract CozyCoQuiltSupplyStore is Ownable, ERC1155, ReentrancyGuard, ICozyCoQuiltSupplyStore {
    /**************************************************************************
     * STORAGE
     *************************************************************************/

    /** Counters **/
    uint256 private nextItemId = 1;

    /** Opening hours **/
    bool public storeOpenToPublic;
    bool public storeOpenToMembers;

    /** Related contracts **/
    address[] private creatorAddresses;
    address[] private metadataAddresses;
    address public quiltMakerAddress;
    IERC1155 private cozyCoMembership;
    mapping(address => bool) private approvedMinterContracts;

    /** Tokens **/
    struct Token {
        uint256 sku;
        uint256 price;
        uint256 memberPrice;
        uint256 quantity;
        bool memberExclusive;
    }
    mapping(uint256 => Token) private tokens;

    /** Bundles **/
    struct Bundle {
        uint256 size;
        uint256[] tokenIds;
        uint256[] rngWeights;
    }
    mapping(uint256 => Bundle) private bundles;

    /** Stock levels **/
    mapping(uint256 => uint256) private stockSoldToPublic;
    mapping(uint256 => uint256) private stockSoldToMembers;

    /** Creator payments **/
    mapping(address => uint256) public creatorBalances;
    mapping(address => uint256) public creatorShares;
    event CreatorPaid(address indexed creator, uint256 indexed amount);

    /**************************************************************************
     * ERRORS
     *************************************************************************/

    error InvalidConfiguration();
    error IncorrectPaymentAmount();
    error MemberExclusive();
    error NotCollaborator();
    error NotFound();
    error OutOfStock();
    error StoreClosed();
    error TransferFailed();
    error ZeroBalance();

    /**************************************************************************
     * PURCHASING SUPPLIES
     *************************************************************************/

    function _stockCheck(uint256 tokenId, uint256 amount) internal view {
        if (
            stockSoldToPublic[tokenId] + stockSoldToMembers[tokenId] + amount >
            tokens[tokenId].quantity
        ) revert OutOfStock();
    }

    function _updateCreatorBalances(uint256 tokenId, uint256 salePrice) internal {
        uint256 creatorId = SupplySKU.getCreatorId(tokens[tokenId].sku);
        address creator = creatorAddresses[creatorId];
        if (creator == owner()) {
            creatorBalances[creator] += salePrice;
        } else {
            uint256 pendingPayment = (salePrice * creatorShares[creator]) / 10_000;
            creatorBalances[creator] += pendingPayment;
            creatorBalances[owner()] += salePrice - pendingPayment;
        }
    }

    function purchaseSupplies(uint256[] calldata tokenIds, uint256[] calldata amounts)
        public
        payable
    {
        if (!storeOpenToPublic) revert StoreClosed();
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();

        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokens[tokenIds[i]].memberExclusive) revert MemberExclusive();

            _stockCheck(tokenIds[i], amounts[i]);
            stockSoldToPublic[tokenIds[i]] += amounts[i];

            uint256 price = tokens[tokenIds[i]].price * amounts[i];
            totalPrice += price;
            _updateCreatorBalances(tokenIds[i], price);

            // Since we're already looping over IDs to do checks etc, we also `_mint` in the same loop.
            // This is basically the same as `_mintBatch` but avoids another loop outside of this one.
            _mint(_msgSender(), tokenIds[i], amounts[i], "");

            unchecked {
                i++;
            }
        }

        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
    }

    function purchaseSuppliesAsMember(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public payable {
        if (!storeOpenToMembers) revert StoreClosed();
        if (cozyCoMembership.balanceOf(_msgSender(), membershipId) == 0) revert NotAuthorized();
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();

        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; ) {
            _stockCheck(tokenIds[i], amounts[i]);
            stockSoldToMembers[tokenIds[i]] += amounts[i];

            uint256 price = tokens[tokenIds[i]].memberPrice * amounts[i];
            totalPrice += price;
            _updateCreatorBalances(tokenIds[i], price);

            // Since we're already looping over IDs to do checks etc, we also `_mint` in the same loop.
            // This is basically the same as `_mintBatch` but avoids another loop outside of this one.
            _mint(_msgSender(), tokenIds[i], amounts[i], "");

            unchecked {
                i++;
            }
        }

        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
    }

    function purchaseSuppliesFromOtherContract(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bool skipStockCheck
    ) public payable override {
        if (!approvedMinterContracts[msg.sender]) revert NotAuthorized();
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();

        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (!skipStockCheck) {
                _stockCheck(tokenIds[i], amounts[i]);
                stockSoldToPublic[tokenIds[i]] += amounts[i];
            }

            uint256 price = tokens[tokenIds[i]].price * amounts[i];
            totalPrice += price;
            _updateCreatorBalances(tokenIds[i], price);

            // Since we're already looping over IDs to do checks etc, we also `_mint` in the same loop.
            // This is basically the same as `_mintBatch` but avoids another loop outside of this one.
            _mint(customer, tokenIds[i], amounts[i], "");

            unchecked {
                i++;
            }
        }

        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
    }

    /**************************************************************************
     * OPEN BUNDLES
     *************************************************************************/

    function openSuppliesBundle(uint256 tokenId) public nonReentrant {
        if (_balances[_msgSender()][tokenId] == 0) revert ZeroBalance();
        Bundle memory bundle = bundles[tokenId];

        // Burn the bundle
        _burn(_msgSender(), tokenId, 1);

        // Mint each token in the bundle
        for (uint256 i = 0; i < bundle.size; ) {
            uint256[] memory randWeights = bundle.rngWeights;

            // Pick a random number to compare against
            // uint256 rng = Random.prng("B", Strings.uintToString(idx), _msgSender()) %
            //     randWeights[randWeights.length - 1];
            uint256 rng = Random.keyPrefix("B", Strings.uintToString(i)) %
                randWeights[randWeights.length - 1];

            // Determine a random tokenId from the bundle tokenIds
            uint256 randTokenId;
            for (uint256 j = 0; j < randWeights.length; ) {
                if (randWeights[j] > rng) {
                    randTokenId = j;
                    break;
                }
                unchecked {
                    j++;
                }
            }

            _mint(_msgSender(), bundle.tokenIds[randTokenId], 1, "");

            unchecked {
                i++;
            }
        }
    }

    function openSuppliesBundleBatch(uint256 tokenId) public nonReentrant {
        if (_balances[_msgSender()][tokenId] == 0) revert ZeroBalance();
        Bundle memory bundle = bundles[tokenId];

        // Burn the bundle
        _burn(_msgSender(), tokenId, 1);

        // Get the unbundled tokenIds so we can mint them in a sec
        uint256[] memory unbundledTokenIds = new uint256[](bundle.size);
        uint256[] memory unbundledAmounts = new uint256[](bundle.size);
        for (uint256 i = 0; i < bundle.size; ) {
            uint256[] memory randWeights = bundle.rngWeights;

            // Pick a random number to compare against
            // uint256 rng = Random.prng("B", Strings.uintToString(idx), _msgSender()) %
            //     randWeights[randWeights.length - 1];
            uint256 rng = Random.keyPrefix("B", Strings.uintToString(i)) %
                randWeights[randWeights.length - 1];

            // Determine a random tokenId from the bundle tokenIds
            uint256 randTokenId;
            for (uint256 j = 0; j < randWeights.length; ) {
                if (randWeights[j] > rng) {
                    randTokenId = j;
                    break;
                }
                unchecked {
                    j++;
                }
            }
            unbundledTokenIds[i] = bundle.tokenIds[randTokenId];
            unbundledAmounts[i] = 1;
            unchecked {
                i++;
            }
        }

        // Mint, but don't increase stock levels because it will affect purchasing of individual
        // tokens. The stock is checked and we don't want bundles to take away from the fixed
        // amounts in the "stock room".
        _mintBatch(_msgSender(), unbundledTokenIds, unbundledAmounts, "");
    }

    function openSuppliesBundles(uint256[] memory tokenIds, uint256[] memory amounts)
        public
        nonReentrant
    {
        // Work out how many new tokens to mint from the burned bundles, and burn the bundles
        uint256 toMintCount;
        for (uint256 i = 0; i < tokenIds.length; ) {
            if (_balances[_msgSender()][tokenIds[i]] == 0) revert ZeroBalance();
            toMintCount += bundles[tokenIds[i]].size * amounts[i];
            _burn(_msgSender(), tokenIds[i], amounts[i]);
            unchecked {
                i++;
            }
        }

        // Get the unbundled tokenIds so we can mint them in a sec
        uint256[] memory unbundledTokenIds = new uint256[](toMintCount);
        uint256[] memory unbundledAmounts = new uint256[](toMintCount);
        uint256 idx;
        for (uint256 i = 0; i < tokenIds.length; ) {
            Bundle memory bundle = bundles[tokenIds[i]];
            for (uint256 j = 0; j < bundle.size * amounts[i]; ) {
                uint256[] memory randWeights = bundle.rngWeights;
                // uint256 rng = Random.prng("B", Strings.uintToString(idx), _msgSender()) %
                //     randWeights[randWeights.length - 1];
                uint256 rng = Random.keyPrefix("B", Strings.uintToString(idx)) %
                    randWeights[randWeights.length - 1];
                uint256 randIdx;
                for (uint256 k = 0; k < randWeights.length; ) {
                    if (randWeights[k] > rng) {
                        randIdx = k;
                        break;
                    }
                    unchecked {
                        k++;
                    }
                }
                unbundledTokenIds[idx] = bundle.tokenIds[randIdx];
                unbundledAmounts[idx] = 1;
                unchecked {
                    j++;
                    idx++;
                }
            }
            unchecked {
                i++;
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
        uint256 creatorId,
        uint256 itemId,
        uint256 itemType,
        uint256 itemWidth,
        uint256 itemHeight,
        uint256 rendererItemIndex,
        uint256 rendererAddrIndex,
        uint256 price,
        uint256 memberPrice,
        uint256 quantity,
        bool memberExclusive
    ) internal {
        uint256 sku = SupplySKU.encodeSKU(
            1, // storefrontId
            creatorId,
            itemId,
            itemType,
            itemWidth,
            itemHeight,
            rendererItemIndex,
            rendererAddrIndex
        );

        /**
          CUSTOMER GAS SAVING ALERT
          We don't want customers to pay unnecessary gas. This function is more gassy but the
          person calling this (owner) pays more instead of passing that cost on to customers.

          There are two things we do here when the quantity hasn't been set yet.

          1. We set the `stockSoldToPublic` and `stockSoldtoMembers` to one. This is so the
              first customer to purchase the specific token doesn't pay extra gas to set a
              non-zero value. It's cheaper to update `1` to `2` than it is to update `0` to `1`.
        */

        stockSoldToPublic[itemId] = 1;
        stockSoldToMembers[itemId] = 1;

        /**
          2. The second is adding two to the stored quantity. This is to include the two
            we just added so we can use a GT check instead of a GTE check when
            seeing if there's still stock left. 
        */

        tokens[itemId] = Token(sku, price, memberPrice, quantity + 2, memberExclusive);
    }

    function _stockInSupplies(
        uint256[] memory itemTypes,
        uint256[] memory itemWidths,
        uint256[] memory itemHeights,
        uint256[] memory rendererItemIndexes,
        uint256[] memory prices,
        uint256[] memory memberPrices,
        uint256[] memory quantities,
        bool[] memory memberExclusives,
        address creator,
        address renderer
    ) public onlyOwner {
        // We don't care about adding duplicate addresses since we encode
        // the index into the SKU. We then grab the address by index when
        // incrementing the creator balance on every sale.
        creatorAddresses.push(creator);

        // Same with renderer addresses if we ever use the same renderer
        metadataAddresses.push(renderer);

        for (uint256 i = 0; i < itemTypes.length; ) {
            _addToStockRoom(
                creatorAddresses.length - 1,
                nextItemId + i,
                itemTypes[i],
                itemWidths[i],
                itemHeights[i],
                rendererItemIndexes[i],
                metadataAddresses.length - 1,
                prices[i],
                memberPrices[i],
                quantities[i],
                memberExclusives[i]
            );

            unchecked {
                i++;
            }
        }

        nextItemId += itemTypes.length;
    }

    function stockInSuppliesBundle(
        Token memory token,
        Bundle memory bundle,
        uint256 rendererItemIndex,
        address creator,
        address renderer
    ) public onlyOwner {
        // We don't care about adding duplicate addresses since we encode
        // the index into the SKU. We then grab the address by index when
        // incrementing the creator balance on every sale.
        creatorAddresses.push(creator);

        // Same with renderer addresses if we ever use the same renderer
        metadataAddresses.push(renderer);

        _addToStockRoom(
            creatorAddresses.length - 1,
            nextItemId,
            0,
            0,
            0,
            rendererItemIndex,
            metadataAddresses.length - 1,
            token.price,
            token.memberPrice,
            token.quantity,
            token.memberExclusive
        );

        bundles[nextItemId] = bundle;
        nextItemId += 1;
    }

    function restockSupplies(uint256[] memory tokenIds, uint256[] memory quantities)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < tokenIds.length; ) {
            tokens[tokenIds[i]].quantity += quantities[i];
            unchecked {
                i++;
            }
        }
    }

    /**************************************************************************
     * TOKEN URI
     *************************************************************************/

    function uri(uint256 tokenId) public view virtual override returns (string memory tokenURI) {
        Token memory token = tokens[tokenId];
        if (token.sku == 0) revert NotFound();
        tokenURI = ISuppliesMetadata(metadataAddresses[SupplySKU.getMetadataAddrIndex(token.sku)])
            .tokenURI(token.sku);
    }

    /**************************************************************************
     * GETTERS
     *************************************************************************/

    function getItemMetadataAddress(uint256 sku) public view override returns (address) {
        return metadataAddresses[SupplySKU.getMetadataAddrIndex(sku)];
    }

    function getItemMaxStock(uint256 tokenId) public view returns (uint256 stock) {
        // Subtract the two we added for gas savings when creating the token
        stock = tokens[tokenId].quantity - 2;
    }

    function getUnitsSold(uint256 tokenId)
        public
        view
        returns (
            uint256 toPublic,
            uint256 toMembers,
            uint256 total
        )
    {
        // Subtract the amounts we added for gas savings when creating the token
        toPublic = stockSoldToPublic[tokenId] - 1;
        toMembers = stockSoldToMembers[tokenId] - 1;
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
        if (operator == quiltMakerAddress) return true;
        return super.isApprovedForAll(owner, operator);
    }

    /**************************************************************************
     * CREATORS
     *************************************************************************/

    function addCreatorPaymentShare(address creator, uint256 share) public onlyOwner {
        if (share > 10_000) revert InvalidConfiguration();
        creatorShares[creator] = share;
    }

    function creatorWithdraw() public nonReentrant {
        uint256 balance = creatorBalances[msg.sender];
        if (balance == 0) revert ZeroBalance();
        creatorBalances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}(new bytes(0));
        if (!success) revert TransferFailed();
        emit CreatorPaid(msg.sender, balance);
    }

    /**************************************************************************
     * SET UP SHOP
     *************************************************************************/

    constructor(address membershipAddr) ERC1155() Ownable() {
        cozyCoMembership = IERC1155(membershipAddr);
    }
}
