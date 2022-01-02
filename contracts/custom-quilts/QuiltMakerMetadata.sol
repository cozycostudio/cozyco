// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "./IQuiltMakerMetadata.sol";

contract QuiltMakerMetadata is Ownable, IQuiltMakerMetadata {
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
