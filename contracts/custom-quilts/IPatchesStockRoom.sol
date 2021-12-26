// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface IPatchesStockRoom {
    function getTokenMetadataAddress(uint256 tokenId) external view returns (address metadata);

    function getTokenSVGParts(uint256[] memory tokenIds)
        external
        view
        returns (string[] memory parts);
}
