//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./OGQuiltGenerator.sol";
import {ICozyCoQuiltSupplyStore} from "./CozyCoQuiltSupplyStore.sol";

contract OGPatches {
    address public cozyCoQuiltSupplyStore;
    IQuiltGenerator public ogQuiltGenerator;

    mapping(uint256 => bool) public claimedQuilts;
    // map of patchIds to supplyStoreTokenIds

    error AlreadyClaimed();

    // function claimPatches(uint256 tokenId) public {
    //     if (claimedQuilts[tokenId]) revert AlreadyClaimed();
    //     Quilt memory quilt = ogQuiltGenerator.getQuiltData(tokenId);
    //     // ICozyCoQuiltSupplyStore(cozyCoQuiltSupplyStore).purchaseSuppliesFromOtherContract(msg.sender, tokenIds, amounts);
    // }
}
