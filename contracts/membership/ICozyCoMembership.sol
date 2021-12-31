// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ICozyCoMembership {
    function balanceOf(address account, uint256 id)
        external
        view
        returns (uint256);
}
