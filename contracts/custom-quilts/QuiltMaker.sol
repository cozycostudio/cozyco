// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC721} from "../tokens/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1155, ERC1155TokenReceiver} from "../tokens/ERC1155.sol";
import {IQuiltMakerRenderer} from "./QuiltMakerRenderer.sol";
import "./SupplySKU.sol";

contract QuiltMaker is Ownable, ERC721, ERC1155TokenReceiver {
    IERC1155 private cozyCoMembership;
    address public supplyStore;
    IQuiltMakerRenderer public renderer;

    uint256 private nextTokenId = 1;
    uint256 public creationCost = 0.08 ether;
    uint256 public memberCreationCost = 0.04 ether;

    struct Quilt {
        uint256 degradation;
        uint256[] supplies;
        uint256[] layout;
    }
    mapping(uint256 => Quilt) public quilts;

    mapping(uint256 => uint256) public maxStock;

    error IncorrectPrice();
    error InvalidLayout();

    function createQuilt(
        uint256 size,
        uint256[] memory supplySkus,
        uint256[] memory supplyCoords
    ) public payable {
        if (!renderer.validatePatchLayout(size, supplySkus, supplyCoords)) revert InvalidLayout();
        if (msg.value != creationCost) revert IncorrectPrice();
        // TODO: add membership discounts

        // Hold the supplies in this contract
        uint256[] memory transferAmounts = new uint256[](supplySkus.length);
        for (uint256 i = 0; i < supplySkus.length; i++) {
            uint256 id = SupplySKU.getItemId(supplySkus[i]);
            // Check they actually own the patches
            if (IERC1155(supplyStore).balanceOf(_msgSender(), id) == 0) revert NotAuthorized();
            transferAmounts[i] = 1;
        }

        IERC1155(supplyStore).safeBatchTransferFrom(
            _msgSender(),
            address(this),
            supplySkus,
            transferAmounts,
            ""
        );

        // Mint the quilt
        _safeMint(_msgSender(), nextTokenId);
        quilts[nextTokenId] = Quilt(0, supplySkus, supplyCoords);
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
    //     // 6. set new layout
    // }

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

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        // renderer.tokenURI(tokenId, supplies, coords, degradation);
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
