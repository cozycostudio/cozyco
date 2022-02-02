// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ISupplyMetadata {
    function tokenURIForSKU(uint256 sku) external view returns (string memory tokenBase64);

    function getSupplySVGPart(uint256 partNumber) external view returns (string memory part);
}
