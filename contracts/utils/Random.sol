// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

library Random {
    function seeded(string memory seed) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed)));
    }

    function keyPrefix(string memory key, string memory seed)
        internal
        pure
        returns (uint256)
    {
        return seeded(string(abi.encodePacked(key, seed)));
    }

    function prng(
        string memory key,
        string memory seed,
        address sender
    ) internal view returns (uint256) {
        return
            seeded(
                string(
                    abi.encodePacked(
                        key,
                        seed,
                        blockhash(block.number - 1),
                        sender
                    )
                )
            );
    }
}
