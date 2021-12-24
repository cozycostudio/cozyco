// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "./IDataShared.sol";

contract PatchesBlankBundlesData is Ownable, IDataShared {
    string public constant ARTIST = "Quilt Stitcher";
    string public constant COLLECTION = "Blanks";

    mapping(uint256 => string) public tokenNames;
    mapping(uint256 => string) public tokenImages;

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

    function tokenURI(uint256 index)
        public
        view
        override
        returns (string memory tokenBase64)
    {
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"',
                        tokenNames[index],
                        '","description":"A bundle of blank patches. Who knows what is inside?!","image": "',
                        tokenImages[index],
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
