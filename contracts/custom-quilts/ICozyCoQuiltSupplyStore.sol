// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ICozyCoQuiltSupplyStore {
    function purchaseSuppliesFromOtherContract(
        address customer,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external payable;
}
