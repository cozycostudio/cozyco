// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";

// import "hardhat/console.sol";

interface IQuiltMakerRenderer {
    function tokenURI(uint256 tokenId) external view returns (string memory tokenBase64);

    function validatePatchLayout(uint256 size, uint256[] memory patches)
        external
        pure
        returns (bool);
}

contract QuiltMakerRenderer is Ownable, IQuiltMakerRenderer {
    /**
        @notice Validates a layout of patches for a quilt
        @dev Create a bitmap of the patch layout where 1 is occupied space and 0 is free space. While we're looping through all the patches, if the current space is already taken, we flip it back to 0. The desired result the entire bitmap to be 1's. Any 0's indicate an invalid layout.
        @param size A bit-packed number: [quiltWidth, quiltHeight]
        @param patches An array of bit-packed numbers representing patches: [x, y, width, height]
        @return If a layout is valid or not
     */
    function validatePatchLayout(uint256 size, uint256[] memory patches)
        public
        pure
        override
        returns (bool)
    {
        uint256 width = uint128(size);
        uint256 height = uint128(size >> 128);
        uint256 len = width * height;
        uint256 bitmap = 0;
        uint256 validBitmap = 0 | ((1 << len) - 1);

        // Create the actual bitmap from patches
        for (uint256 i = 0; i < patches.length; i++) {
            uint256 x = uint64(patches[i]);
            uint256 y = uint64(patches[i] >> 64);
            uint256 w = uint64(patches[i] >> 128);
            uint256 h = uint64(patches[i] >> 192);

            // Out of bounds so return false early
            if (x + w > width || y + h > height) return false;

            // Convert all patches to be a 1x1 tile on the grid e.g.
            // a 2x2 patch adds 4 bits to the bitmap
            for (uint256 xa = 0; xa < w; xa++) {
                for (uint256 ya = 0; ya < h; ya++) {
                    uint256 bit = x + xa + width * (y + ya);
                    // If a bit is already set at this position, return false early
                    if ((bitmap >> bit) % 2 != 0) return false;
                    bitmap = bitmap | (1 << bit);
                }
            }
        }

        return bitmap == validBitmap;
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
