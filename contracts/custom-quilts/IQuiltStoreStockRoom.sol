// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

interface IQuiltStoreStockRoom {
    function giveStockToCustomer(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external;

    function openTokenBundles(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external;

    function addStock(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory quantities,
        uint256[] memory storageIndex
    ) external;

    function addBundleStock(
        uint256[] memory tokenIds,
        address metadata,
        uint256[] memory quantities,
        uint256[] memory storageIndex,
        uint256[] memory bundleSizes,
        uint256[][] memory tokenIdsInBundle
    ) external;

    function restockTokens(uint256[] memory tokenIds, uint256[] memory quantities) external;

    function getTokenMetadataAddress(uint256 tokenId) external view returns (address metadata);

    function tokenUnitsSold(uint256 tokenId) external view returns (uint256 unitsSold);
}
