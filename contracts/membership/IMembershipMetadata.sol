// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IMembershipMetadata {
    function getURI(uint256 id) external view returns (string memory);
}
