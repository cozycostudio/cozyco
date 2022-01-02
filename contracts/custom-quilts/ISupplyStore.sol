// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ISupplyStore {
    function getItemMetadataAddress(uint256 tokenId) external view returns (address metadata);

    function getItemMaxStock(uint256 tokenId) external view returns (uint256 stock);

    function getUnitsSold(uint256 tokenId)
        external
        view
        returns (
            uint256 toPublic,
            uint256 toMembers,
            uint256 total
        );
}
