// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IQuiltMakerMetadata {
    function tokenURI(uint256 tokenId) external view returns (string memory tokenBase64);
}
