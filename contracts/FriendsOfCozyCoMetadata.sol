//SPDX-License-Identifier: Unlicense
/// @title: Friends of Cozy Co. metadata
/// @author: samking.eth

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Base64.sol";
import "./IFriendTokenTypeMetadata.sol";

contract FriendsOfCozyCoMetadata is Ownable, IFriendTokenTypeMetadata {
    string public name;
    string public description;
    string public imageURI;
    string public animationURI;

    constructor(
        string memory _name,
        string memory _desc,
        string memory _imageURI
    ) Ownable() {
        name = _name;
        description = _desc;
        imageURI = _imageURI;
    }

    function setName(string memory _name) public onlyOwner {
        name = _name;
    }

    function setDescription(string memory _desc) public onlyOwner {
        description = _desc;
    }

    function setImageURI(string memory _imageURI) public onlyOwner {
        imageURI = _imageURI;
    }

    function setAnimationURI(string memory _animationURI) public onlyOwner {
        animationURI = _animationURI;
    }

    function getURI(uint256) public view override returns (string memory) {
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        name,
                        '", "description": "',
                        description,
                        '", "image": "',
                        imageURI,
                        bytes(animationURI).length > 0
                            ? string(
                                abi.encodePacked(
                                    '", "animation_url": "',
                                    animationURI
                                )
                            )
                            : "",
                        '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
