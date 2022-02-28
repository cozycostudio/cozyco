// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./IQuilts.sol";

interface IQuiltsApi {
    function getQuilt(uint256 quiltId) external view returns (IQuilts.Quilt memory);

    function getQuiltSVG(uint256 quiltId) external view returns (string memory);

    function getQuiltSVG(IQuilts.Quilt memory) external view returns (string memory);

    function getPatchSVG(uint8 patch) external view returns (string memory);

    function getPatchSVG(uint8 patch, uint8 theme) external view returns (string memory);
}
