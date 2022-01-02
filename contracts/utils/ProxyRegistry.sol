// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

/// @notice A minimal interface describing OpenSea's Wyvern proxy registry.
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

contract OwnableDelegateProxy {}
