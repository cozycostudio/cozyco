// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../membership/ICozyCoMembership.sol";
import "./IQuiltStoreStockRoom.sol";
import "./IDataShared.sol";
import "./IDataPatches.sol";

contract QuiltStoreStockRoom is Ownable, ERC1155Burnable, IQuiltStoreStockRoom {
    address public storeAdmin;

    // Tokens are patches or backgrounds that can be purchased to make a custom quilt
    mapping(uint256 => address) private tokenMetadata;
    mapping(uint256 => uint256) private tokenStorageIndex;
    mapping(uint256 => uint256) private tokenQuantities;

    // Token bundles are packs of multiple tokens
    mapping(uint256 => uint256) private tokenBundleSizes;
    mapping(uint256 => uint256[]) private tokenBundleTokenIds;

    // Keep track of purchased stock for each token
    mapping(uint256 => uint256) private stockSold;

    /**************************************************************************
     * MODIFIERS
     *************************************************************************/

    modifier isAdmin() {
        require(msg.sender == storeAdmin, "not admin");
        _;
    }

    modifier validAmounts(uint256[] memory tokenIds, uint256[] memory amounts) {
        require(tokenIds.length == amounts.length, "400");
        _;
    }

    modifier hasAvailableTokenStock(uint256[] memory tokenIds, uint256[] memory amounts) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                stockSold[tokenIds[i]] + amounts[i] < tokenQuantities[tokenIds[i]],
                "out of stock"
            );
        }
        _;
    }

    /**************************************************************************
     * GIVING STOCK TO STOREFRONT
     *************************************************************************/

    function giveStockToCustomer(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        public
        override
        isAdmin
        validAmounts(tokenIds, amounts)
        hasAvailableTokenStock(tokenIds, amounts)
    {
        _mintBatch(customer, tokenIds, amounts, "");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            stockSold[tokenIds[i]] += amounts[i];
        }
    }

    /**************************************************************************
     * OPEN BUNDLES
     *************************************************************************/

    function openTokenBundles(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public override {
        // Burning checks if the from address has tokens and reverts if not,
        // so we don't need to check any balances
        _burnBatch(customer, tokenIds, amounts);

        uint256 toMintCount;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            toMintCount += tokenBundleSizes[tokenIds[i]] * amounts[i];
        }

        uint256[] memory unbundledTokenIds = new uint256[](toMintCount);
        uint256[] memory unbundledAmounts = new uint256[](toMintCount);
        uint256 idx;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            for (uint256 j = 0; j < tokenBundleSizes[tokenIds[i]] * amounts[i]; j++) {
                uint256 rand = Random.prng("p", Strings.toString(idx), customer) %
                    tokenBundleTokenIds[tokenIds[i]].length;
                unbundledTokenIds[idx] = tokenBundleTokenIds[tokenIds[i]][rand];
                unbundledAmounts[idx] = 1;
                idx++;
            }
        }

        // Don't increase stock levels when minting new ones because it will affect
        // purchasing of individual tokens... it's ok if opening bundles adds to supply
        _mintBatch(customer, unbundledTokenIds, unbundledAmounts, "");
    }

    /**************************************************************************
     * STOCK MANAGEMENT
     *************************************************************************/

    function _addBaseTokenData(
        uint256 tokenId,
        address metadata,
        uint256 quantity,
        uint256 storageIndex
    ) internal {
        tokenMetadata[tokenId] = metadata;
        tokenStorageIndex[tokenId] = storageIndex;

        /*
         * CUSTOMER GAS SAVING ALERT
         * We don't want customers to pay unnecessary gas. This function is more gassy
         * but we pay the extra as admins instead of passing that cost on to customers.
         *
         * There are two things we do here when the quantity hasn't been set yet.
         *
         * 1. We set the `stockSold` to one. This is so the first customer to purchase the
         *    specific token doesn't pay extra gas to set a non-zero value. It's cheaper to
         *    update `1` to `2` than it is to update `0` to `1`.
         *
         * 2. The second is adding two to the stored quantity. This is to include the one
         *    we just added to the `stockSold`, and an extra one so we can use a LT check
         *    instead of a LTE check when seeing if there's still stock left.
         */
        stockSold[tokenId] = 1;
        tokenQuantities[tokenId] = quantity + 2;
    }

    function addStock(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory quantities,
        uint256[] memory storageIndex
    ) public override isAdmin {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _addBaseTokenData(tokenIds[i], metadata, quantities[i], storageIndex[i]);
        }
    }

    function addBundleStock(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory quantities,
        uint256[] memory storageIndex,
        uint256[] memory bundleSizes,
        uint256[][] memory tokenIdsInBundle
    ) public override isAdmin {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _addBaseTokenData(tokenIds[i], metadata, quantities[i], storageIndex[i]);
            tokenBundleSizes[tokenIds[i]] = bundleSizes[i];
            tokenBundleTokenIds[tokenIds[i]] = tokenIdsInBundle[i];
        }
    }

    function restockTokens(uint256[] memory tokenIds, uint256[] memory quantities)
        public
        override
        isAdmin
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenQuantities[tokenIds[i]] += quantities[i];
        }
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

    function getTokenQuantity(uint256 tokenId) public view returns (uint256 quantity) {
        // Subtract the two we added for gas savings when creating the token
        quantity = tokenQuantities[tokenId] - 2;
    }

    function getActualTokenQuantity(uint256 tokenId) internal view returns (uint256 quantity) {
        quantity = tokenQuantities[tokenId];
    }

    function tokenUnitsSold(uint256 tokenId) public view override returns (uint256 unitSold) {
        unitSold = stockSold[tokenId];
    }

    /**************************************************************************
     * STORE ADMIN
     *************************************************************************/

    function setStoreAdmin(address admin) public onlyOwner {
        storeAdmin = admin;
    }

    function isApprovedForAll(address account, address operator)
        public
        view
        virtual
        override
        returns (bool isApproved)
    {
        // Approve the admin contract by default
        if (operator == storeAdmin) {
            return true;
        }
        return super.isApprovedForAll(account, operator);
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
