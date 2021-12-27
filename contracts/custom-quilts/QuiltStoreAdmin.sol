// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Random.sol";
import "../membership/ICozyCoMembership.sol";
import "./IQuiltStoreStockRoom.sol";
import "./IDataShared.sol";
import "./IDataPatches.sol";

contract QuiltStoreAdmin is Ownable {
    // Sale state
    bool public storeOpenToMembers;
    bool public storeOpenToPublic;

    // Inventory prices
    mapping(uint256 => uint256) private prices;
    // TODO: Handle quilt assembly prices

    // Mapping of membership type to tokenId to discounts BPS
    mapping(uint256 => mapping(uint256 => uint256)) private discounts;
    ICozyCoMembership private cozyCoMembership;
    IQuiltStoreStockRoom private stockRoom;
    address private customQuilts;

    // Creator address to token id to payout percentage
    mapping(address => mapping(uint256 => uint256)) private creatorPercentage;
    mapping(address => uint256[]) private creatorAttributions;

    /**************************************************************************
     * MODIFIERS
     *************************************************************************/

    modifier isStoreOpenToMembers() {
        require(storeOpenToMembers, "store is closed");
        _;
    }

    modifier isStoreOpenToPublic() {
        require(storeOpenToPublic, "store is closed");
        _;
    }

    modifier isCozyCoMember(uint256 membershipId) {
        require(cozyCoMembership.balanceOf(_msgSender(), membershipId) > 0, "not a cozy co member");
        _;
    }

    modifier isValidTokenAmounts(uint256[] memory tokenIds, uint256[] memory amounts) {
        require(tokenIds.length == amounts.length, "incorrect amounts");
        _;
    }

    modifier isCorrectPublicTokenPayment(uint256[] memory tokenIds, uint256[] memory amounts) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += prices[tokenIds[i]] * amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        _;
    }

    modifier isCorrectMemberTokenPayment(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += getTokenPriceForMember(tokenIds[i], membershipId) * amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        _;
    }

    function setPrices(uint256[] memory tokenIds, uint256[] memory _prices) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            prices[tokenIds[i]] = _prices[i];
        }
    }

    /**************************************************************************
     * PURCHASING
     *************************************************************************/

    function purchaseTokens(uint256[] memory tokenIds, uint256[] memory amounts)
        public
        payable
        isStoreOpenToPublic
        isValidTokenAmounts(tokenIds, amounts)
        isCorrectPublicTokenPayment(tokenIds, amounts)
    {
        stockRoom.giveStockToCustomer(_msgSender(), tokenIds, amounts);
    }

    function purchaseTokensAsMember(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        public
        payable
        isCozyCoMember(membershipId)
        isStoreOpenToMembers
        isValidTokenAmounts(tokenIds, amounts)
        isCorrectMemberTokenPayment(membershipId, tokenIds, amounts)
    {
        stockRoom.giveStockToCustomer(_msgSender(), tokenIds, amounts);
    }

    function openBundles(uint256[] memory tokenIds, uint256[] memory amounts) public {
        stockRoom.openTokenBundles(_msgSender(), tokenIds, amounts);
    }

    /**************************************************************************
     * DISCOUNTS
     *************************************************************************/

    /**************************************************************************
     * DISCOUNTS
     *************************************************************************/

    function setMemberDiscounts(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory discountBasisPoints
    ) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            discounts[membershipId][tokenIds[i]] = discountBasisPoints[i];
        }
    }

    function getTokenPriceForMember(uint256 tokenId, uint256 membershipId)
        public
        view
        returns (uint256 memberPrice)
    {
        if (discounts[membershipId][tokenId] == 0) return prices[tokenId];
        return prices[tokenId] - ((prices[tokenId] * discounts[membershipId][tokenId]) / 10000);
    }

    /**************************************************************************
     * STORE OPENING HOURS
     *************************************************************************/

    function setMemberOpenState(bool isOpen) public onlyOwner {
        storeOpenToMembers = isOpen;
    }

    function setPublicOpenState(bool isOpen) public onlyOwner {
        storeOpenToPublic = isOpen;
    }

    /**************************************************************************
     * CREATORS
     *************************************************************************/

    function attributeTokensToCreator(uint256[] memory tokenIds, address creator) public onlyOwner {
        creatorAttributions[creator] = tokenIds;
    }

    function getCreatorSalesBalance(address creator) public view returns (uint256 balance) {
        for (uint256 i = 0; i < creatorAttributions[creator].length; i++) {
            uint256 tokenId = creatorAttributions[creator][i];
            uint256 sales = stockRoom.getTokenSoldAmount(tokenId);
            // Price is the creator share of the total token price
            uint256 price = (prices[tokenId] * creatorPercentage[creator][tokenId]) / 10000;
            balance += sales * price;
        }
    }

    function creatorPayment() public {
        require(payable(_msgSender()).send(getCreatorSalesBalance(_msgSender())), "payment failed");
    }

    /**************************************************************************
     * STANDARDS
     *************************************************************************/

    constructor(address stockRoomContract, address membershipContract) Ownable() {
        stockRoom = IQuiltStoreStockRoom(stockRoomContract);
        cozyCoMembership = ICozyCoMembership(membershipContract);
    }
}
