// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IDataPatches {
    function patchSize(uint256 index) external view returns (uint8 w, uint8 h);

    function patchPart(uint256 index) external view returns (string memory part);

    function patchParts(uint256[] memory indexes) external view returns (string[] memory parts);

    function tokenImage(uint256 index) external view returns (string memory imageBase64);

    function tokenImages(uint256[] memory indexes)
        external
        view
        returns (string[] memory imagesBase64);
}
