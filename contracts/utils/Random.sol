// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

library Random {
    function seeded(string memory seed, string memory key)
        internal
        pure
        returns (uint256)
    {
        return uint256(keccak256(abi.encodePacked(key, seed)));
    }
}
