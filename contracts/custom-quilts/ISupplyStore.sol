// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ISupplyStore {
    function getItemMetadataAddress(uint256 sku) external view returns (address);
}
