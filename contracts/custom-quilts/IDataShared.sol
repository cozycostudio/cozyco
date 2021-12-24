// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDataShared {
    function getArtist() external pure returns (string memory artist);

    function getCollection() external pure returns (string memory collection);

    function tokenURI(uint256 index)
        external
        view
        returns (string memory tokenBase64);
}
