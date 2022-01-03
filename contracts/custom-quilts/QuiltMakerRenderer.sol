// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "hardhat/console.sol";

interface IQuiltMakerRenderer {
    function tokenURI(uint256 tokenId) external view returns (string memory tokenBase64);

    function validatePatchLayout(uint256[2] memory size, uint256[4][] memory patches)
        external
        pure
        returns (bool isValid);
}

contract QuiltMakerRenderer is Ownable, IQuiltMakerRenderer {
    /**
        @notice Validates a layout of patches for a quilt
        @dev Create a bitmap of the patch layout where 1 is occupied space and 0 is free space. While we're looping through all the patches, if the current space is already taken, we flip it back to 0. The desired result the entire bitmap to be 1's. Any 0's indicate an invalid layout.
        @param size An array like [quiltWidth, quiltHeight]
        @param patches An array of patches like [x, y, width, height]
        @return isValid If a layout is valid or not
     */
    function validatePatchLayout(uint256[2] memory size, uint256[4][] memory patches)
        public
        pure
        override
        returns (bool isValid)
    {
        uint256 len = size[0] * size[1];
        uint256 bitmap = 0;
        uint256 validBitmap = 0 | ((1 << len) - 1);

        // Create the actual bitmap from patches
        for (uint256 i = 0; i < patches.length; i++) {
            // Out of bounds so return false early
            if (patches[i][0] + patches[i][2] > size[0] || patches[i][1] + patches[i][3] > size[1])
                return false;

            // Convert all patches to be a 1x1 tile on the grid e.g.
            // a 2x2 patch adds 4 bits to the bitmap
            for (uint256 xa = 0; xa < patches[i][2]; xa++) {
                for (uint256 ya = 0; ya < patches[i][3]; ya++) {
                    uint256 bit = patches[i][0] + xa + size[0] * (patches[i][1] + ya);
                    // If a bit is already set at this position, return false early
                    if ((bitmap >> bit) % 2 != 0) return false;
                    bitmap = bitmap | (1 << bit);
                }
            }
        }

        isValid = bitmap == validBitmap;
    }

    function tokenImage(uint256 index) public pure returns (string memory imageBase64) {
        return string(abi.encodePacked("data:image/svg+xml;base64,", index));
    }

    function tokenURI(uint256 tokenId) public pure override returns (string memory tokenBase64) {
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Blank patch #","description":"A blank patch, perfect for filling in the gaps in a custom quilt.","image": "',
                        tokenImage(tokenId),
                        '","attributes":[]}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    constructor() Ownable() {}
}
