// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

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

    function getTokenMetadataAddress(uint256 tokenId) external view returns (address metadata);

    function getTokenSoldAmount(uint256 tokenId) external view returns (uint256 unitsSold);
}
