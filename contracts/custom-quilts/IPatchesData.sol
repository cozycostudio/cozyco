// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IPatchesData {
    function getSize(uint256 index) external view returns (uint8 w, uint8 h);

    function getSVGPart(uint256 index)
        external
        view
        returns (string memory part);

    function getSVGParts(uint256[] memory indexes)
        external
        view
        returns (string[] memory parts);

    function tokenImage(uint256 index)
        external
        view
        returns (string memory imageBase64);

    function tokenURI(uint256 index)
        external
        view
        returns (string memory tokenBase64);
}
