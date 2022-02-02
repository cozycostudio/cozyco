// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC1155, IERC1155} from "../tokens/ERC1155.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../utils/Strings.sol";
import "./SupplySKU.sol";
import "./ISupplyMetadata.sol";
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

    /** Storefront **/
    uint256 public constant STOREFRONT_ID = 1;

    /** Counters **/
    uint256 public nextItemId = 1;

    /** Opening hours **/
    bool public storeOpenToPublic;
    bool public storeOpenToMembers;

    /** Related contracts **/
    address[] public creatorAddresses;
    address[] public metadataAddresses;
    address public quiltMakerAddress;
    IERC1155 public cozyCoMembership;
    mapping(address => bool) public approvedMinterContracts;

    /** Tokens **/
    struct Token {
        uint256 sku;
        uint64 price;
        uint64 memberPrice;
        uint32 quantity;
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
    mapping(uint256 => uint256) private tokenUnitsSold;

    /** Creator payments **/
    mapping(address => uint256) public creatorBalances;
    mapping(address => uint256) public creatorShares;

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
        if (tokenUnitsSold[tokenId] + amount > tokens[tokenId].quantity) revert OutOfStock();
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
        nonReentrant
    {
        if (!storeOpenToPublic) revert StoreClosed();
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();

        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; ) {
            Token memory token = tokens[tokenIds[i]];
            if (token.memberExclusive) revert MemberExclusive();

            _stockCheck(tokenIds[i], amounts[i]);
            tokenUnitsSold[tokenIds[i]] += amounts[i];

            uint256 price = token.price * amounts[i];
            totalPrice = totalPrice + price;
            _updateCreatorBalances(tokenIds[i], price);

            unchecked {
                i++;
            }
        }

        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        _mintBatch(_msgSender(), tokenIds, amounts, "");
    }

    function purchaseSuppliesAsMember(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public payable nonReentrant {
        if (!storeOpenToMembers) revert StoreClosed();
        if (cozyCoMembership.balanceOf(_msgSender(), membershipId) == 0) revert NotAuthorized();
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();

        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; ) {
            _stockCheck(tokenIds[i], amounts[i]);
            tokenUnitsSold[tokenIds[i]] += amounts[i];

            uint256 price = tokens[tokenIds[i]].memberPrice * amounts[i];
            totalPrice += price;
            _updateCreatorBalances(tokenIds[i], price);

            unchecked {
                i++;
            }
        }

        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        _mintBatch(_msgSender(), tokenIds, amounts, "");
    }

    function purchaseSuppliesFromOtherContract(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bool skipStockCheck
    ) public payable override nonReentrant {
        if (!approvedMinterContracts[msg.sender]) revert NotAuthorized();
        if (tokenIds.length != amounts.length) revert InvalidConfiguration();

        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; ) {
            if (!skipStockCheck) {
                _stockCheck(tokenIds[i], amounts[i]);
                tokenUnitsSold[tokenIds[i]] += amounts[i];
            }

            uint256 price = tokens[tokenIds[i]].price * amounts[i];
            totalPrice += price;
            _updateCreatorBalances(tokenIds[i], price);

            unchecked {
                i++;
            }
        }

        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        _mintBatch(customer, tokenIds, amounts, "");
    }

    /**************************************************************************
     * OPEN BUNDLES
     *************************************************************************/

    function openSupplyBundle(uint256 tokenId) public nonReentrant {
        if (_balances[_msgSender()][tokenId] == 0) revert ZeroBalance();
        Bundle storage bundle = bundles[tokenId];

        // Burn the bundle
        _burn(_msgSender(), tokenId, 1);

        // Mint each token in the bundle
        for (uint256 i = 0; i < bundle.size; ) {
            // Pick a random number to compare against
            // uint256 rng = Random.prng("B", Strings.uintToString(i), _msgSender()) %
            //     bundle.rngWeights[bundle.rngWeights.length - 1];
            uint256 rng = Random.keyPrefix("B", Strings.uintToString(i)) %
                bundle.rngWeights[bundle.rngWeights.length - 1];

            // Determine a random tokenId from the bundle tokenIds
            uint256 randTokenId;
            for (uint256 j = 0; j < bundle.rngWeights.length; ) {
                if (bundle.rngWeights[j] > rng) {
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

    function openSupplyBundleBatch(uint256 tokenId) public nonReentrant {
        if (_balances[_msgSender()][tokenId] == 0) revert ZeroBalance();
        Bundle storage bundle = bundles[tokenId];

        // Burn the bundle
        _burn(_msgSender(), tokenId, 1);

        // Get the unbundled tokenIds so we can mint them in a sec
        uint256[] memory unbundledTokenIds = new uint256[](bundle.size);
        uint256[] memory unbundledAmounts = new uint256[](bundle.size);
        for (uint256 i = 0; i < bundle.size; ) {
            // Pick a random number to compare against
            uint256 rng = Random.prng("B", Strings.uintToString(i), _msgSender()) %
                bundle.rngWeights[bundle.rngWeights.length - 1];

            // Determine a random tokenId from the bundle tokenIds
            uint256 randTokenId;
            for (uint256 j = 0; j < bundle.rngWeights.length; ) {
                if (bundle.rngWeights[j] > rng) {
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

    /**************************************************************************
     * STOCK MANAGEMENT
     *************************************************************************/

    function _addToStockRoom(
        uint256 creatorId,
        uint256 itemId,
        uint256 itemType,
        uint256 itemWidth,
        uint256 itemHeight,
        uint256 metadataPartNumber,
        uint256 metadataAddrIndex,
        uint256 price,
        uint256 memberPrice,
        uint256 quantity,
        bool memberExclusive
    ) internal {
        uint256 sku = SupplySKU.encodeSKU(
            STOREFRONT_ID,
            creatorId,
            itemId,
            itemType,
            itemWidth,
            itemHeight,
            metadataPartNumber,
            metadataAddrIndex
        );

        /**
          CUSTOMER GAS SAVING ALERT
          We don't want customers to pay unnecessary gas. This function is more gassy but the
          person calling this (owner) pays more instead of passing that cost on to customers.

          There are two things we do here when the quantity hasn't been set yet.

          1. We set the `tokenUnitsSold` to one. This is so the first customer to purchase the
             specific token doesn't pay extra gas to set a non-zero value. It's cheaper to
             update `1` to `2` than it is to update `0` to `1`.
        */

        tokenUnitsSold[itemId] = 1;

        /**
          2. The second is adding one to the stored quantity. This is to include the one
             we just added so we can use a GT check instead of a GTE check when
             seeing if there's still stock left.
        */

        tokens[itemId] = Token(
            sku,
            uint64(price),
            uint64(memberPrice),
            uint32(quantity + 1),
            memberExclusive
        );
    }

    function stockInSupplies(
        uint256[] memory itemTypes,
        uint256[] memory itemWidths,
        uint256[] memory itemHeights,
        uint256[] memory metadataPartNumbers,
        uint256[] memory prices,
        uint256[] memory memberPrices,
        uint256[] memory quantities,
        bool[] memory memberExclusives,
        address creator,
        address metadata
    ) public onlyOwner {
        // We don't care about adding duplicate addresses since we encode
        // the index into the SKU. We then grab the address by index when
        // incrementing the creator balance on every sale.
        creatorAddresses.push(creator);

        // Same with metadata addresses if we ever use the same renderer
        metadataAddresses.push(metadata);

        for (uint256 i = 0; i < itemTypes.length; ) {
            _addToStockRoom(
                creatorAddresses.length - 1,
                nextItemId + i,
                itemTypes[i],
                itemWidths[i],
                itemHeights[i],
                metadataPartNumbers[i],
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
        uint256 metadataPartNumber,
        uint256 price,
        uint256 memberPrice,
        uint256 quantity,
        bool memberExclusive,
        Bundle memory bundle,
        address creator,
        address metadata
    ) public onlyOwner {
        // We don't care about adding duplicate addresses since we encode
        // the index into the SKU. We then grab the address by index when
        // incrementing the creator balance on every sale.
        creatorAddresses.push(creator);

        // Same with metadata addresses if we ever use the same renderer
        metadataAddresses.push(metadata);

        _addToStockRoom(
            creatorAddresses.length - 1,
            nextItemId,
            0,
            0,
            0,
            metadataPartNumber,
            metadataAddresses.length - 1,
            price,
            memberPrice,
            quantity,
            memberExclusive
        );

        bundles[nextItemId] = bundle;
        nextItemId += 1;
    }

    function restockSupplies(uint256[] memory tokenIds, uint256[] memory quantities)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < tokenIds.length; ) {
            tokens[tokenIds[i]].quantity += uint32(quantities[i]);
            unchecked {
                i++;
            }
        }
    }

    /**************************************************************************
     * TOKEN URI
     *************************************************************************/

    function uri(uint256 tokenId) public view virtual override returns (string memory tokenURI) {
        Token storage token = tokens[tokenId];
        if (token.sku == 0) revert NotFound();
        tokenURI = ISupplyMetadata(metadataAddresses[SupplySKU.getMetadataAddrIndex(token.sku)])
            .tokenURIForSKU(token.sku);
    }

    /**************************************************************************
     * GETTERS
     *************************************************************************/

    function getItemMetadataAddress(uint256 sku) public view override returns (address metadata) {
        metadata = metadataAddresses[SupplySKU.getMetadataAddrIndex(sku)];
    }

    function getItemMaxStock(uint256 itemId) public view returns (uint256 stock) {
        // Subtract the extra 1 we added for gas savings when creating the token
        stock = tokens[itemId].quantity - 1;
    }

    function getItemUnitsSold(uint256 itemId) public view returns (uint256 unitsSold) {
        // Subtract the extra 1 we added for gas savings when creating the token
        unitsSold = tokenUnitsSold[itemId] - 1;
    }

    function getItemTokenData(uint256 itemId) public view returns (Token memory token) {
        token = tokens[itemId];
    }

    function getBundleTokenData(uint256 bundleId) public view returns (Bundle memory bundle) {
        bundle = bundles[bundleId];
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
        override(ERC1155, IERC1155)
        returns (bool isApproved)
    {
        // Approve the quilt maker contract by default
        if (quiltMakerAddress != address(0) && operator == quiltMakerAddress) return true;
        // TODO: Add OS gas free listing
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
    }

    /**************************************************************************
     * SET UP SHOP
     *************************************************************************/

    constructor(address membershipAddr, address quiltMakerAddr) ERC1155() Ownable() {
        cozyCoMembership = IERC1155(membershipAddr);
        quiltMakerAddress = quiltMakerAddr;
    }
}
