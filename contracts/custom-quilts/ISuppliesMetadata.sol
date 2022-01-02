// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ISuppliesMetadata {
    function tokenURI(uint256 tokenId, uint256 atIndex)
        external
        view
        returns (string memory tokenBase64);
}
