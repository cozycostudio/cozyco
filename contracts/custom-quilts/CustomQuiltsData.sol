// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../utils/Base64.sol";
import "./IDataCustomQuilts.sol";
import "./IPatchesStorefront.sol";

contract CustomQuiltsData is Ownable, IDataCustomQuilts {
    function tokenImage(uint256 index)
        public
        pure
        returns (string memory imageBase64)
    {
        return string(abi.encodePacked("data:image/svg+xml;base64,"));
    }

    function tokenURI(uint256 tokenId, string[] memory patchParts)
        public
        view
        override
        returns (string memory tokenBase64)
    {
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
