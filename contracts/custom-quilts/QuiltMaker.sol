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
    uint256 public creationCost = 0.08 ether;
    uint256 public memberCreationCost = 0.04 ether;

    mapping(uint256 => uint256[]) private suppliesForQuilt;
    mapping(uint256 => uint256[]) private patchesLayouts;
    mapping(uint256 => uint256[]) private suppliesLayouts;
    mapping(uint256 => uint256) public maxStock;

    error IncorrectPrice();
    error InvalidLayout();

    function createQuilt(
        uint256 size,
        uint256[] memory supplyIds,
        uint256[] memory patchesLayout,
        uint256[] memory suppliesLayout
    ) public payable {
        // Patches are the only supply that need validating, all other supplies are fine
        if (!renderer.validatePatchLayout(size, patchesLayout)) revert InvalidLayout();
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
        suppliesForQuilt[nextTokenId] = supplyIds;
        patchesLayouts[nextTokenId] = patchesLayout;
        suppliesLayouts[nextTokenId] = suppliesLayout;
        nextTokenId += 1;
    }

    function getMaxStock(uint256 w, uint256 h) public view returns (uint256 stock) {
        stock = maxStock[(uint256(uint128(w)) << 128) | uint128(h)];
    }

    function setMaxStock(
        uint256 w,
        uint256 h,
        uint256 stock
    ) public onlyOwner {
        maxStock[(uint256(uint128(w)) << 128) | uint128(h)] = stock;
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

    constructor(
        address supplyStoreAddr,
        address membershipAddr,
        address rendererAddr
    ) ERC721("cozy co. custom quilts", "CCCQ") {
        supplyStore = supplyStoreAddr;
        cozyCoMembership = IERC1155(membershipAddr);
        renderer = IQuiltMakerRenderer(rendererAddr);

        // Set the max stock for each initial size. More sizes can be added later
        // along with increasing the stock amount of each.
        maxStock[(uint256(uint128(2)) << 128) | uint128(2)] = 50;
        maxStock[(uint256(uint128(2)) << 128) | uint128(3)] = 200;
        maxStock[(uint256(uint128(2)) << 128) | uint128(4)] = 200;
        maxStock[(uint256(uint128(4)) << 128) | uint128(2)] = 200;
        maxStock[(uint256(uint128(3)) << 128) | uint128(2)] = 200;
        maxStock[(uint256(uint128(3)) << 128) | uint128(4)] = 800;
        maxStock[(uint256(uint128(3)) << 128) | uint128(3)] = 800;
        maxStock[(uint256(uint128(4)) << 128) | uint128(3)] = 800;
        maxStock[(uint256(uint128(4)) << 128) | uint128(4)] = 800;
        maxStock[(uint256(uint128(3)) << 128) | uint128(5)] = 800;
        maxStock[(uint256(uint128(4)) << 128) | uint128(5)] = 800;
        maxStock[(uint256(uint128(5)) << 128) | uint128(5)] = 800;
        maxStock[(uint256(uint128(5)) << 128) | uint128(4)] = 800;
        maxStock[(uint256(uint128(5)) << 128) | uint128(3)] = 800;
        maxStock[(uint256(uint128(4)) << 128) | uint128(6)] = 200;
        maxStock[(uint256(uint128(5)) << 128) | uint128(6)] = 200;
        maxStock[(uint256(uint128(6)) << 128) | uint128(5)] = 200;
        maxStock[(uint256(uint128(6)) << 128) | uint128(4)] = 200;
        maxStock[(uint256(uint128(6)) << 128) | uint128(6)] = 50;
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
