//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./OGQuiltGenerator.sol";
import {ICozyCoQuiltSupplyStore} from "../CozyCoQuiltSupplyStore.sol";

contract OGPatches {
    ICozyCoQuiltSupplyStore public cozyCoQuiltSupplyStore;
    IQuiltGenerator public ogQuiltGenerator;

    /// @dev Quilt tokenId => has claimed patches for quilt
    mapping(uint256 => bool) public claimedQuilts;

    error AlreadyClaimed();

    // function claimPatches(uint256 tokenId) public {
    //     if (claimedQuilts[tokenId]) revert AlreadyClaimed();
    //     Quilt memory quilt = ogQuiltGenerator.getQuiltData(tokenId);
    //     cozyCoQuiltSupplyStore.purchaseSuppliesFromOtherContract(msg.sender, tokenIds, amounts);
    // }
}
