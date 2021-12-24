// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDataCustomQuilts {
    function tokenURI(uint256 tokenId, string[] memory patchParts)
        external
        view
        returns (string memory tokenBase64);
}
