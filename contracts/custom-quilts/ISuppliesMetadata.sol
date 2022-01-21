// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ISuppliesMetadata {
    function tokenURI(uint256 sku) external view returns (string memory tokenBase64);

    function getCompPart(uint256 sku) external view returns (string memory part);
}
