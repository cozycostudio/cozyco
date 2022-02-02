// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IERC1155} from "../tokens/ERC1155.sol";

interface ISupplyStore is IERC1155 {
    function getItemMetadataAddress(uint256 sku) external view returns (address);
}
