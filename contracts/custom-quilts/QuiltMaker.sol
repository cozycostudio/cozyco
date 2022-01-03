// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1155, ERC1155TokenReceiver} from "../tokens/ERC1155/ERC1155.sol";
import {IQuiltMakerRenderer} from "./QuiltMakerRenderer.sol";

contract QuiltMaker is Ownable, ERC721, ERC1155TokenReceiver {
    IERC1155 private cozyCoMembership;
    address public supplyStore;
    IQuiltMakerRenderer public renderer;

    uint256 private nextTokenId = 1;
    uint256 public creationCost = 0.025 ether;
    mapping(uint256 => uint256[]) private suppliesForQuilt;
    mapping(uint256 => uint256[4][]) private suppliesLayout; // [x, y, w, h]

    error IncorrectPrice();
    error InvalidLayout();

    function createQuilt(
        uint256[2] memory size,
        uint256[4][] memory patches,
        uint256[4][] memory supplyLayouts
    ) public payable {
        // Check if the patch layout is valid for a quilt
        if (renderer.validatePatchLayout(size, patches)) revert InvalidLayout();

        if (msg.value != creationCost) revert IncorrectPrice();
        // TODO: add membership discounts

        // TODO: check if sender owns tokenIds

        // Hold the supplies in this contract
        // uint256[] memory transferAmounts = new uint256[](supplyIds.length);
        // for (uint256 i = 0; i < supplyIds.length; i++) {
        //     transferAmounts[i] = 1;
        // }
        // IERC1155(supplyStore).safeBatchTransferFrom(
        //     _msgSender(),
        //     address(this),
        //     supplyIds,
        //     transferAmounts,
        //     ""
        // );

        // Mint the quilt
        _safeMint(_msgSender(), nextTokenId);
        // suppliesForQuilt[nextTokenId] = supplyIds;
        suppliesLayout[nextTokenId] = supplyLayouts;
        nextTokenId += 1;
    }

    // function recycleQuilt(uint256 tokenId, uint256[] memory newPatchIds)
    //     public
    //     payable
    // {
    //     // 1. check if msg.sender owns tokenId
    //     // 2. check if msg.sender owns newPatchIds that are not in suppliesForQuilt
    //     // 3. check valid layout
    //     // 4. transfer new tokens to this contract
    //     // 5. transfer remainder tokens to msg.sender
    //     // 6. set new layout in suppliesForQuilt
    // }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        return string(abi.encodePacked(tokenId));
    }

    function totalSupply() public view returns (uint256 total) {
        total = nextTokenId - 1;
    }

    constructor(address supplyStoreAddr, address membershipAddr)
        ERC721("cozy co. custom quilts", "CCCQ")
    {
        supplyStore = supplyStoreAddr;
        cozyCoMembership = IERC1155(membershipAddr);
        // renderer = IQuiltMakerRenderer(rendererAddr);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return ERC1155TokenReceiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return ERC1155TokenReceiver.onERC1155BatchReceived.selector;
    }
}

// uint256 public constant MAX_SUPPLY_2x2 = 50;
// uint256 public constant MAX_SUPPLY_2x3 = 200;
// uint256 public constant MAX_SUPPLY_2x4 = 200;
// uint256 public constant MAX_SUPPLY_4x2 = 200;
// uint256 public constant MAX_SUPPLY_3x2 = 200;
// uint256 public constant MAX_SUPPLY_3x4 = 800;
// uint256 public constant MAX_SUPPLY_3x3 = 800;
// uint256 public constant MAX_SUPPLY_4x3 = 800;
// uint256 public constant MAX_SUPPLY_4x4 = 800;
// uint256 public constant MAX_SUPPLY_3x5 = 400;
// uint256 public constant MAX_SUPPLY_4x5 = 400;
// uint256 public constant MAX_SUPPLY_5x5 = 400;
// uint256 public constant MAX_SUPPLY_5x4 = 400;
// uint256 public constant MAX_SUPPLY_5x3 = 400;
// uint256 public constant MAX_SUPPLY_4x6 = 200;
// uint256 public constant MAX_SUPPLY_5x6 = 200;
// uint256 public constant MAX_SUPPLY_6x5 = 200;
// uint256 public constant MAX_SUPPLY_6x4 = 200;
// uint256 public constant MAX_SUPPLY_6x6 = 50;
