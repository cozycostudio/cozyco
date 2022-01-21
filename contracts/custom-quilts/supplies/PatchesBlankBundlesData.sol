// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "../../utils/Base64.sol";
import {Random} from "../../utils/Random.sol";
import {ISuppliesMetadata} from "../ISuppliesMetadata.sol";

contract PatchesBlankBundlesData is Ownable, ISuppliesMetadata {
    string public constant ARTIST = "Quilt Stitcher";
    string public constant COLLECTION = "Blanks";

    mapping(uint256 => string) public tokenNames;
    mapping(uint256 => string) public tokenImages;

    function getArtist() public pure returns (string memory artist) {
        artist = ARTIST;
    }

    function getCollection() public pure returns (string memory collection) {
        collection = COLLECTION;
    }

    function getCompPart(uint256 index) public pure override returns (string memory part) {
        return "";
    }

    function setTokenData(
        uint256[] memory indexes,
        string[] memory names,
        string[] memory images
    ) public onlyOwner {
        for (uint256 i = 0; i < indexes.length; i++) {
            tokenNames[indexes[i]] = names[i];
            tokenImages[indexes[i]] = images[i];
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory tokenBase64) {
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"',
                        // tokenNames[index],
                        '","description":"A bundle of blank patches. Who knows what is inside?!","image": "',
                        // tokenImages[index],
                        '","attributes":[{"trait_type":"Type","value":"Bundle","trait_type":"Artist","value":"',
                        ARTIST,
                        '"},{"trait_type":"Collection","value":"',
                        COLLECTION,
                        '"}]}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    constructor() Ownable() {}
}
