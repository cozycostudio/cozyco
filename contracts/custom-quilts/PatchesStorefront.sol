// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../membership/ICozyCoMembership.sol";
import "./IPatchesStorefront.sol";
import "./IPatchesData.sol";

contract PatchesStorefront is Ownable, ERC1155Burnable, IPatchesStorefront {
    // Sale state
    bool public storeOpenToMembers;
    bool public storeOpenToPublic;

    // Tokens are patches that can be purchased to make a custom quilt
    struct Token {
        uint256 price;
        uint256 maxQuantity;
    }
    mapping(uint256 => Token) private tokens;

    // TokenBundles are packs of multiple patches
    struct TokenBundle {
        uint256 price;
        uint256 maxQuantity;
        uint256 packSize;
        uint256[] tokenIds;
    }
    mapping(uint256 => TokenBundle) private tokenBundles;

    // Store metadata addresses for each token
    mapping(uint256 => address) private tokenMetadata;
    mapping(uint256 => uint256) private tokenStorageIndex;

    // Keep track of purchased stock for each token and token pack
    mapping(uint256 => uint256) private stockLevels;

    // Mapping of membership type to tokenId/tokenBundleId to discount BPS
    mapping(uint256 => mapping(uint256 => uint256))
        private membershipDiscountBPS;
    ICozyCoMembership private cozyCoMembership;
    address private customQuilts;

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
        require(
            cozyCoMembership.balanceOf(_msgSender(), membershipId) > 0,
            "not a cozy co member"
        );
        _;
    }

    modifier hasAvailableTokenStock(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                stockLevels[tokenIds[i]] + amounts[i] <=
                    tokens[tokenIds[i]].maxQuantity,
                "out of stock"
            );
        }
        _;
    }

    modifier hasAvailableTokenBundleStock(
        uint256[] memory tokenBundleIds,
        uint256[] memory amounts
    ) {
        for (uint256 i = 0; i < tokenBundleIds.length; i++) {
            require(
                stockLevels[tokenBundleIds[i]] + amounts[i] <=
                    tokenBundles[tokenBundleIds[i]].maxQuantity,
                "out of stock"
            );
        }
        _;
    }

    modifier validTokens(uint256[] memory tokenIds) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenMetadata[tokenIds[i]] != address(0), "not valid");
        }
        _;
    }

    modifier isCorrectMemberTokenPayment(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice +=
                getTokenPriceForMember(tokenIds[i], membershipId) *
                amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        _;
    }

    modifier isCorrectMemberTokenBundlePayment(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice +=
                getTokenPriceForMember(tokenIds[i], membershipId) *
                amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        _;
    }

    modifier isCorrectPublicTokenPayment(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalPrice += tokens[tokenIds[i]].price * amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        _;
    }

    modifier isCorrectPublicTokenBundlePayment(
        uint256[] memory tokenBundleIds,
        uint256[] memory amounts
    ) {
        uint256 totalPrice;
        for (uint256 i = 0; i < tokenBundleIds.length; i++) {
            totalPrice += tokenBundles[tokenBundleIds[i]].price * amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        _;
    }

    modifier validAmounts(uint256[] memory tokenIds, uint256[] memory amounts) {
        require(tokenIds.length == amounts.length, "400");
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

    function purchaseTokenBundles(
        uint256[] memory tokenBundleIds,
        uint256[] memory amounts
    )
        public
        payable
        isStoreOpenToPublic
        validTokens(tokenBundleIds)
        validAmounts(tokenBundleIds, amounts)
        hasAvailableTokenBundleStock(tokenBundleIds, amounts)
        isCorrectPublicTokenBundlePayment(tokenBundleIds, amounts)
    {
        _mintBatch(_msgSender(), tokenBundleIds, amounts, "");
        for (uint256 i = 0; i < tokenBundleIds.length; i++) {
            stockLevels[tokenBundleIds[i]] += amounts[i];
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

    function memberPurchaseTokenBundles(
        uint256 membershipId,
        uint256[] memory tokenBundleIds,
        uint256[] memory amounts
    )
        public
        payable
        isCozyCoMember(membershipId)
        isStoreOpenToMembers
        validTokens(tokenBundleIds)
        validAmounts(tokenBundleIds, amounts)
        hasAvailableTokenBundleStock(tokenBundleIds, amounts)
        isCorrectMemberTokenBundlePayment(membershipId, tokenBundleIds, amounts)
    {
        require(tokenBundleIds.length == amounts.length, "400");
        _mintBatch(_msgSender(), tokenBundleIds, amounts, "");
        for (uint256 i = 0; i < tokenBundleIds.length; i++) {
            stockLevels[tokenBundleIds[i]] += amounts[i];
        }
    }

    /**************************************************************************
     * PACK OPENING
     *************************************************************************/

    function openTokenBundles(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public {
        uint256 toMintCount;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                balanceOf(_msgSender(), tokenIds[i]) >= amounts[i],
                "not enough packs"
            );
            toMintCount += tokenBundles[tokenIds[i]].packSize * amounts[i];
        }

        uint256[] memory toMint = new uint256[](toMintCount);
        uint256[] memory mintAmounts = new uint256[](toMintCount);
        uint256 mintIdx;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            TokenBundle memory tokenBundle = tokenBundles[tokenIds[i]];

            for (uint256 j = 0; j < tokenBundle.packSize * amounts[i]; j++) {
                uint256 rand = Random.prng(
                    "p",
                    Strings.toString(mintIdx),
                    _msgSender()
                ) % tokenBundle.tokenIds.length;
                toMint[mintIdx] = tokenBundle.tokenIds[rand];
                mintAmounts[mintIdx] = 1;
                mintIdx++;
            }
        }
        _burnBatch(_msgSender(), tokenIds, amounts);
        _mintBatch(_msgSender(), toMint, mintAmounts, "");
        // don't increase stock levels when minting new ones because it will affect
        // purchasing of individual packs
    }

    /**************************************************************************
     * CREATION OF STOCK & DISCOUNTS
     *************************************************************************/

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
            tokens[tokenIds[i]] = Token(prices[i], quantities[i]);
            tokenMetadata[tokenIds[i]] = metadata;
            tokenStorageIndex[tokenIds[i]] = storageIndex[i];
        }
    }

    function setTokenBundles(
        uint256[] memory tokenBundleIds,
        address metadata,
        uint256[] memory storageIndex,
        uint256[] memory prices,
        uint256[] memory packSizes,
        uint256[] memory quantities,
        uint256[][] memory tokenIdsInPack
    ) public onlyOwner {
        require(tokenBundleIds.length == quantities.length, "400");
        require(quantities.length == prices.length, "400");
        for (uint256 i = 0; i < tokenBundleIds.length; i++) {
            tokenBundles[tokenBundleIds[i]] = TokenBundle(
                prices[i],
                quantities[i],
                packSizes[i],
                tokenIdsInPack[i]
            );
            tokenMetadata[tokenBundleIds[i]] = metadata;
            tokenStorageIndex[tokenBundleIds[i]] = storageIndex[i];
        }
    }

    function setMemberDiscounts(
        uint256 membershipId,
        uint256[] memory tokenIds,
        uint256[] memory discountBasisPoints
    ) public onlyOwner {
        require(tokenIds.length == discountBasisPoints.length, "400");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            membershipDiscountBPS[membershipId][
                tokenIds[i]
            ] = discountBasisPoints[i];
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

    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory tokenURI)
    {
        require(tokenMetadata[id] != address(0), "404");
        tokenURI = IPatchesData(tokenMetadata[id]).tokenURI(
            tokenStorageIndex[id]
        );
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

    function getTokenPrice(uint256 tokenId)
        public
        view
        returns (uint256 price)
    {
        price = tokens[tokenId].price;
    }

    function getTokenPriceForMember(uint256 tokenId, uint256 membershipId)
        public
        view
        returns (uint256 memberPrice)
    {
        if (membershipDiscountBPS[membershipId][tokenId] == 0) {
            return tokens[tokenId].price;
        }
        return
            tokens[tokenId].price -
            ((tokens[tokenId].price *
                membershipDiscountBPS[membershipId][tokenId]) / 10000);
    }

    function getTokenMaxQuantity(uint256 tokenId)
        public
        view
        returns (uint256 maxQuantity)
    {
        maxQuantity = tokens[tokenId].maxQuantity;
    }

    function getTokenBundleMetadataAddress(uint256 tokenBundleId)
        public
        view
        returns (address metadata)
    {
        metadata = tokenMetadata[tokenBundleId];
    }

    function getTokenBundlePrice(uint256 tokenBundleId)
        public
        view
        returns (uint256 price)
    {
        price = tokenBundles[tokenBundleId].price;
    }

    function getTokenBundlePriceForMember(
        uint256 tokenBundleId,
        uint256 membershipId
    ) public view returns (uint256 memberPrice) {
        if (membershipDiscountBPS[membershipId][tokenBundleId] == 0) {
            return tokenBundles[tokenBundleId].price;
        }
        return
            tokenBundles[tokenBundleId].price -
            ((tokenBundles[tokenBundleId].price *
                membershipDiscountBPS[membershipId][tokenBundleId]) / 10000);
    }

    function getTokenBundleMaxQuantity(uint256 tokenBundleId)
        public
        view
        returns (uint256 maxQuantity)
    {
        maxQuantity = tokenBundles[tokenBundleId].maxQuantity;
    }

    function getTokenBundleSize(uint256 tokenBundleId)
        public
        view
        returns (uint256 packSize)
    {
        packSize = tokenBundles[tokenBundleId].packSize;
    }

    function getTokenMembershipDiscountBPS(
        uint256 tokenId,
        uint256 membershipId
    ) public view returns (uint256 discountBPS) {
        discountBPS = membershipDiscountBPS[membershipId][tokenId];
    }

    function getTokenSVGParts(uint256[] memory tokenIds)
        public
        view
        override
        returns (string[] memory parts)
    {
        string[] memory svgParts = new string[](tokenIds.length);
        svgParts[0] = "foo";
        svgParts[1] = "bar";
        svgParts[2] = "baz";
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
