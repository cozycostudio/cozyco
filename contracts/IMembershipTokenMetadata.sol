// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMembershipTokenMetadata {
    function getURI(uint256 id) external view returns (string memory);
}
