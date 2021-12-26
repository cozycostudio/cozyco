// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../membership/ICozyCoMembership.sol";
import "./IPatchesStockRoom.sol";
import "./IDataShared.sol";
import "./IDataPatches.sol";

contract PatchesStockRoom is Ownable, ERC1155Burnable, IPatchesStockRoom {
    // Sale state
    bool public storeOpenToMembers;
    bool public storeOpenToPublic;

    // Tokens are patches that can be purchased to make a custom quilt
    mapping(uint256 => address) private tokenMetadata;
    mapping(uint256 => uint256) private tokenStorageIndex;
    mapping(uint256 => uint256) private tokenPrices;
    mapping(uint256 => uint256) private tokenMaxQuantities;

    // Token bundles are packs of multiple tokens
    mapping(uint256 => uint256) private tokenBundleSizes;
    mapping(uint256 => uint256[]) private tokenBundleTokenIds;

    // Keep track of purchased stock for each token and token pack
    mapping(uint256 => uint256) private stockLevels;

    // Mapping of membership type to tokenId/tokenBundleId to discount BPS
    mapping(uint256 => mapping(uint256 => uint256)) private membershipDiscountBPS;
    ICozyCoMembership private cozyCoMembership;
    address private customQuilts;

    // Creator address to token id to payout percentage
    mapping(address => mapping(uint256 => uint256)) private creatorPayouts;

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

    modifier validTokens(uint256[] memory tokenIds) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenMetadata[tokenIds[i]] != address(0), "not valid");
        }
        _;
    }

    modifier validAmounts(uint256[] memory tokenIds, uint256[] memory amounts) {
        require(tokenIds.length == amounts.length, "400");
        _;
    }

    modifier hasAvailableTokenStock(uint256[] memory tokenIds, uint256[] memory amounts) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                stockLevels[tokenIds[i]] + amounts[i] < tokenMaxQuantities[tokenIds[i]],
                "out of stock"
            );
        }
        _;
    }

    modifier isCorrectPublicTokenPayment(uint256[] memory tokenIds, uint256[] memory amounts) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += tokenPrices[tokenIds[i]] * amounts[i];
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

    /**************************************************************************
     * PURCHASING
     *************************************************************************/

    function purchaseTokens(uint256[] memory tokenIds, uint256[] memory amounts)
        public
        payable
        isStoreOpenToPublic
        validTokens(tokenIds)
        validAmounts(tokenIds, amounts)
        hasAvailableTokenStock(tokenIds, amounts)
        isCorrectPublicTokenPayment(tokenIds, amounts)
    {
        _mintBatch(_msgSender(), tokenIds, amounts, "");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            stockLevels[tokenIds[i]] += amounts[i];
        }
    }

    function memberPurchaseTokens(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        public
        payable
        isCozyCoMember(membershipId)
        isStoreOpenToMembers
        validTokens(tokenIds)
        validAmounts(tokenIds, amounts)
        hasAvailableTokenStock(tokenIds, amounts)
        isCorrectMemberTokenPayment(membershipId, tokenIds, amounts)
    {
        _mintBatch(_msgSender(), tokenIds, amounts, "");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            stockLevels[tokenIds[i]] += amounts[i];
        }
    }

    /**************************************************************************
     * PACK OPENING
     *************************************************************************/

    function openTokenBundles(uint256[] memory tokenIds, uint256[] memory amounts) public {
        uint256 toMintCount;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(balanceOf(_msgSender(), tokenIds[i]) >= amounts[i], "not enough packs");
            toMintCount += tokenBundleSizes[tokenIds[i]] * amounts[i];
        }

        uint256[] memory toMint = new uint256[](toMintCount);
        uint256[] memory mintAmounts = new uint256[](toMintCount);
        uint256 mintIdx;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            for (uint256 j = 0; j < tokenBundleSizes[tokenIds[i]] * amounts[i]; j++) {
                uint256 rand = Random.prng("p", Strings.toString(mintIdx), _msgSender()) %
                    tokenBundleTokenIds[tokenIds[i]].length;
                toMint[mintIdx] = tokenBundleTokenIds[tokenIds[i]][rand];
                mintAmounts[mintIdx] = 1;
                mintIdx++;
            }
        }
        _burnBatch(_msgSender(), tokenIds, amounts);
        // don't increase stock levels when minting new ones because it will affect
        // purchasing of individual packs... it's ok if opening packs adds to supply
        _mintBatch(_msgSender(), toMint, mintAmounts, "");
    }

    /**************************************************************************
     * CREATION OF STOCK
     *************************************************************************/

    function _setBaseTokenData(
        uint256 tokenId,
        address metadata,
        uint256 price,
        uint256 quantity,
        uint256 storageIndex
    ) internal {
        tokenMetadata[tokenId] = metadata;
        tokenPrices[tokenId] = price;
        tokenMaxQuantities[tokenId] = quantity;
        tokenStorageIndex[tokenId] = storageIndex;
    }

    function setTokens(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory storageIndex,
        uint256[] memory prices,
        uint256[] memory quantities
    ) public onlyOwner {
        require(tokenIds.length == prices.length, "400");
        require(prices.length == quantities.length, "400");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _setBaseTokenData(tokenIds[i], metadata, prices[i], quantities[i], storageIndex[i]);
        }
    }

    function setTokenBundles(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory storageIndex,
        uint256[] memory prices,
        uint256[] memory bundleSizes,
        uint256[] memory quantities,
        uint256[][] memory tokenIdsInBundle
    ) public onlyOwner {
        require(tokenIds.length == quantities.length, "400");
        require(quantities.length == prices.length, "400");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _setBaseTokenData(tokenIds[i], metadata, prices[i], quantities[i], storageIndex[i]);
            tokenBundleSizes[tokenIds[i]] = bundleSizes[i];
            tokenBundleTokenIds[tokenIds[i]] = tokenIdsInBundle[i];
        }
    }

    /**************************************************************************
     * DISCOUNTS
     *************************************************************************/

    function setMemberDiscounts(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory discountBasisPoints
    ) public onlyOwner {
        require(tokenIds.length == discountBasisPoints.length, "400");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            membershipDiscountBPS[membershipId][tokenIds[i]] = discountBasisPoints[i];
        }
    }

    /**************************************************************************
     * STORE MANAGEMENT
     *************************************************************************/

    function setMemberOpenState(bool isOpen) public onlyOwner {
        storeOpenToMembers = isOpen;
    }

    function setPublicOpenState(bool isOpen) public onlyOwner {
        storeOpenToPublic = isOpen;
    }

    /**************************************************************************
     * TOKEN URI
     *************************************************************************/

    function uri(uint256 id) public view virtual override returns (string memory tokenURI) {
        require(tokenMetadata[id] != address(0), "404");
        tokenURI = IDataShared(tokenMetadata[id]).tokenURI(tokenStorageIndex[id]);
    }

    /**************************************************************************
     * GETTERS
     *************************************************************************/

    function getTokenMetadataAddress(uint256 tokenId)
        public
        view
        override
        returns (address metadata)
    {
        metadata = tokenMetadata[tokenId];
    }

    function getTokenPrice(uint256 tokenId) public view returns (uint256 price) {
        price = tokenPrices[tokenId];
    }

    function getTokenPriceForMember(uint256 tokenId, uint256 membershipId)
        public
        view
        returns (uint256 memberPrice)
    {
        if (membershipDiscountBPS[membershipId][tokenId] == 0) {
            return tokenPrices[tokenId];
        }
        return
            tokenPrices[tokenId] -
            ((tokenPrices[tokenId] * membershipDiscountBPS[membershipId][tokenId]) / 10000);
    }

    function getTokenMaxQuantity(uint256 tokenId) public view returns (uint256 maxQuantity) {
        maxQuantity = tokenMaxQuantities[tokenId];
    }

    function getTokenBundleSize(uint256 tokenId) public view returns (uint256 bundleSize) {
        bundleSize = tokenBundleSizes[tokenId];
    }

    function getTokenBundleTokenIds(uint256 tokenId)
        public
        view
        returns (uint256[] memory tokenIds)
    {
        tokenIds = tokenBundleTokenIds[tokenId];
    }

    function getTokenMembershipDiscountBPS(uint256 tokenId, uint256 membershipId)
        public
        view
        returns (uint256 discountBPS)
    {
        discountBPS = membershipDiscountBPS[membershipId][tokenId];
    }

    function getTokenSVGParts(uint256[] memory tokenIds)
        public
        view
        override
        returns (string[] memory parts)
    {
        string[] memory svgParts = new string[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            svgParts[i] = IDataPatches(tokenMetadata[tokenIds[i]]).patchPart(
                tokenStorageIndex[tokenIds[i]]
            );
        }
        parts = svgParts;
    }

    /**************************************************************************
     * CUSTOM QUILTS
     *************************************************************************/

    function setCustomQuiltsAddress(address addr) public onlyOwner {
        customQuilts = addr;
    }

    function isApprovedForAll(address account, address operator)
        public
        view
        virtual
        override
        returns (bool isApproved)
    {
        // Approve the quilts contract by default
        if (operator == customQuilts) {
            return true;
        }
        super.isApprovedForAll(account, operator);
    }

    /**************************************************************************
     * STANDARDS
     *************************************************************************/

    constructor(address membershipContract) ERC1155("") Ownable() {
        cozyCoMembership = ICozyCoMembership(membershipContract);
    }

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
