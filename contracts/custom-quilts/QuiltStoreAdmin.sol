// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../utils/Random.sol";
import "../membership/ICozyCoMembership.sol";
import "./IQuiltStoreStockRoom.sol";
import "./IDataShared.sol";
import "./IDataPatches.sol";

contract QuiltStoreAdmin is Ownable, ReentrancyGuard {
    /**************************************************************************
     * STORAGE
     *************************************************************************/

    /** Proxies **/
    IQuiltStoreStockRoom private stockRoom;
    IQuiltStoreStockRoom private communityStockRoom;
    ICozyCoMembership private cozyCoMembership;
    address private customQuilts;

    /** Opening hours **/
    bool public storeOpenToMembers;
    bool public storeOpenToPublic;

    /** Pricing and sales data **/
    struct TokenSaleData {
        uint256 price;
        uint256 memberPrice;
        uint256 memberSales;
        bool isMemberExclusive;
    }
    mapping(uint256 => TokenSaleData) private tokenSaleData;

    /** Creator payments **/
    struct Collection {
        mapping(address => uint256) creatorShares;
        mapping(address => uint256) creatorReleasedPayments;
        uint256[] tokenIds;
    }
    mapping(uint256 => Collection) private collections;
    uint256 private nextCollectionId = 1;

    // TODO: Handle quilt assembly prices

    /**************************************************************************
     * ERRORS
     *************************************************************************/

    error NotAuthorized();
    error NotOpen();
    error MemberExclusive();
    error InvalidConfiguration();
    error IncorrectPaymentAmount();
    error NotCollaborator();
    error TransferFailed();
    error ZeroBalance();

    /**************************************************************************
     * MODIFIERS
     *************************************************************************/

    modifier onlyOpenToMembers() {
        if (!storeOpenToMembers) revert NotOpen();
        _;
    }

    modifier onlyOpenToPublic() {
        if (!storeOpenToPublic) revert NotOpen();
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

    /**************************************************************************
     * PURCHASING
     *************************************************************************/

    function purchaseTokens(uint256[] memory tokenIds, uint256[] memory amounts)
        public
        payable
        onlyOpenToPublic
        onlyValidTokenIdsAndAmounts(tokenIds, amounts)
    {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += tokenSaleData[tokenIds[i]].price * amounts[i];
            if (tokenSaleData[tokenIds[i]].isMemberExclusive) revert MemberExclusive();
        }
        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        stockRoom.giveStockToCustomer(_msgSender(), tokenIds, amounts);
    }

    function purchaseTokensAsMember(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        public
        payable
        onlyMember(membershipId)
        onlyOpenToMembers
        onlyValidTokenIdsAndAmounts(tokenIds, amounts)
    {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += tokenSaleData[tokenIds[i]].memberPrice * amounts[i];
            tokenSaleData[tokenIds[i]].memberSales += amounts[i];
        }
        if (msg.value != totalPrice) revert IncorrectPaymentAmount();
        stockRoom.giveStockToCustomer(_msgSender(), tokenIds, amounts);
    }

    function openBundles(uint256[] memory tokenIds, uint256[] memory amounts) public {
        stockRoom.openTokenBundles(_msgSender(), tokenIds, amounts);
    }

    /**************************************************************************
     * PRICING
     *************************************************************************/

    function addStock(
        uint256[] memory tokenIds,
        uint256[] memory prices,
        uint256[] memory memberPrices,
        address metadata,
        uint256[] memory quantities,
        uint256[] memory storageIndex
    ) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenSaleData[tokenIds[i]].price = prices[i];
            tokenSaleData[tokenIds[i]].memberPrice = memberPrices[i];
        }
        stockRoom.addStock(tokenIds, metadata, quantities, storageIndex);
    }

    function addBundleStock(
        uint256[] memory tokenIds,
        uint256[] memory prices,
        uint256[] memory memberPrices,
        address metadata,
        uint256[] memory quantities,
        uint256[] memory storageIndex,
        uint256[] memory bundleSizes,
        uint256[][] memory tokenIdsInBundle
    ) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenSaleData[tokenIds[i]].price = prices[i];
            tokenSaleData[tokenIds[i]].memberPrice = memberPrices[i];
        }
        stockRoom.addBundleStock(
            tokenIds,
            metadata,
            quantities,
            storageIndex,
            bundleSizes,
            tokenIdsInBundle
        );
    }

    /**************************************************************************
     * CREATORS
     *************************************************************************/

    /**
     * @dev A collection holds information about creator payments for certain
     * token ids. This function adds that data.
     */
    function addCollectionInfo(
        address[] memory creators,
        uint256[] memory creatorShares,
        uint256[] memory tokenIds
    ) public onlyOwner {
        uint256 totalShares;
        for (uint256 i = 0; i < creators.length; i++) {
            collections[nextCollectionId].creatorShares[creators[i]] = creatorShares[i];
            totalShares += creatorShares[i];
        }
        if (totalShares != 10000) revert InvalidConfiguration();
        collections[nextCollectionId].tokenIds = tokenIds;
        nextCollectionId += 1;
    }

    /**
     * @dev Like `addCollectionInfo` but it overwrites any existing information.
     */
    function dangerouslyUpdateCollectionInfo(
        uint256 collectionId,
        address[] memory creators,
        uint256[] memory creatorShares,
        uint256[] memory tokenIds
    ) public onlyOwner {
        uint256 totalShares;
        for (uint256 i = 0; i < creators.length; i++) {
            collections[collectionId].creatorShares[creators[i]] = creatorShares[i];
            totalShares += creatorShares[i];
        }
        if (totalShares != 10000) revert InvalidConfiguration();
        collections[collectionId].tokenIds = tokenIds;
    }

    /**
     * @dev Gets the pending payment to a collaborator for a collection.
     */
    function pendingPaymentForCollection(uint256 collectionId, address collaborator)
        public
        view
        returns (uint256 pendingPayment)
    {
        if (collections[collectionId].creatorShares[collaborator] == 0) revert NotCollaborator();
        uint256 amount;
        for (uint256 i = 0; i < collections[collectionId].tokenIds.length; i++) {
            uint256 tokenId = collections[collectionId].tokenIds[i];
            uint256 publicSales = stockRoom.tokenUnitsSold(tokenId) -
                tokenSaleData[tokenId].memberSales;
            uint256 totalPaymentForSales = (publicSales * tokenSaleData[tokenId].price) +
                (tokenSaleData[tokenId].memberSales * tokenSaleData[tokenId].memberPrice);
            amount +=
                (totalPaymentForSales * collections[collectionId].creatorShares[collaborator]) /
                10000;
        }
        pendingPayment = amount - collections[collectionId].creatorReleasedPayments[collaborator];
    }

    /**
     * @dev Gets the amount released to a collaborator for a collection.
     */
    function releasedPayments(uint256 collectionId, address collaborator)
        public
        view
        returns (uint256 released)
    {
        released = collections[collectionId].creatorReleasedPayments[collaborator];
    }

    /**
     * @dev Sends a payment to a cozy collaborator for a given collection.
     */
    function collectPaymentFromCollection(uint256 collectionId) public nonReentrant {
        uint256 payment = pendingPaymentForCollection(collectionId, _msgSender());
        if (payment == 0) revert ZeroBalance();
        collections[collectionId].creatorReleasedPayments[_msgSender()] += payment;
        (bool success, ) = _msgSender().call{value: payment}(new bytes(0));
        if (!success) revert TransferFailed();
    }

    /**************************************************************************
     * STORE OPENING HOURS
     *************************************************************************/

    function openStoreForMembers() public onlyOwner {
        storeOpenToMembers = true;
    }

    function openStoreForPublic() public onlyOwner {
        storeOpenToPublic = true;
    }

    function closeStore() public onlyOwner {
        storeOpenToMembers = false;
        storeOpenToPublic = false;
    }

    /**************************************************************************
     * STANDARDS
     *************************************************************************/

    constructor(address stockRoomContract, address membershipContract) Ownable() {
        stockRoom = IQuiltStoreStockRoom(stockRoomContract);
        cozyCoMembership = ICozyCoMembership(membershipContract);
    }
}
