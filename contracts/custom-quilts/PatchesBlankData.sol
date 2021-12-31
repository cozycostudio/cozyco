// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "./IDataShared.sol";
import "./IDataPatches.sol";
import "./PatchesBlankStorage.sol";

contract PatchesBlankData is
    Ownable,
    PatchesBlankStorage,
    IDataShared,
    IDataPatches
{
    string public constant ARTIST = "Quilt Stitcher";
    string public constant COLLECTION = "Blanks";

    function getArtist() public pure override returns (string memory artist) {
        artist = ARTIST;
    }

    function getCollection()
        public
        pure
        override
        returns (string memory collection)
    {
        collection = COLLECTION;
    }

    function patchSize(uint256 index)
        public
        pure
        override
        returns (uint8 w, uint8 h)
    {
        if (index < 16) {
            return (1, 1);
        } else if (index < 24) {
            return (2, 1);
        } else if (index < 32) {
            return (1, 2);
        } else {
            return (2, 2);
        }
    }

    function patchPart(uint256 index)
        public
        view
        override
        returns (string memory part)
    {
        return svgParts[index];
    }

    function patchParts(uint256[] memory indexes)
        public
        view
        override
        returns (string[] memory parts)
    {
        for (uint256 i = 0; i < indexes.length; i++) {
            parts[i] = svgParts[indexes[i]];
        }
        return parts;
    }

    function tokenImage(uint256 index)
        public
        view
        override
        returns (string memory imageBase64)
    {
        (uint8 patchW, uint8 patchH) = patchSize(index);
        uint256 w = patchW * 64;
        uint256 h = patchH * 64;
        uint256 x = (200 - w) / 2;
        uint256 y = (200 - h) / 2;

        string memory background = [
            "#FBF4F0",
            "#FFEDED",
            "#FFD8CC",
            "#E6EDFF",
            "#9CE2DF"
        ][Random.keyPrefix("bg", Strings.toString(index)) % 5];

        string memory svg = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="',
                        background,
                        '"/><g transform="translate(',
                        Strings.toString(x),
                        ",",
                        Strings.toString(y),
                        ')">',
                        svgParts[index],
                        '<rect width="',
                        Strings.toString(w),
                        '" height="',
                        Strings.toString(h),
                        '" x="0" y="0" fill="none" stroke="black" stroke-width="4" stroke-dasharray="4 4" stroke-dashoffset="2" /></g></svg>'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:image/svg+xml;base64,", svg));
    }

    function tokenImages(uint256[] memory indexes)
        public
        view
        override
        returns (string[] memory imagesBase64)
    {
        for (uint256 i = 0; i < indexes.length; i++) {
            imagesBase64[i] = tokenImage(i);
        }
    }

    function tokenURI(uint256 index)
        public
        view
        override
        returns (string memory tokenBase64)
    {
        string memory patchNumber = Strings.toString(index + 1);
        (uint8 w, uint8 h) = patchSize(index);
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Blank patch #',
                        patchNumber,
                        '","description":"A blank patch, perfect for filling in the gaps in a custom quilt.","image": "',
                        tokenImage(index),
                        '","attributes":[{"trait_type":"Type","value":"Single patch","trait_type":"Artist","value":"',
                        ARTIST,
                        '"},{"trait_type":"Collection","value":"',
                        COLLECTION,
                        '"},{"trait_type":"Size","value":"',
                        Strings.toString(w),
                        "x",
                        Strings.toString(h),
                        '"}]}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    constructor() Ownable() {}
}
