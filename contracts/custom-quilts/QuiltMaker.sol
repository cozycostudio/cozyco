// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/ERC721.sol";
import {IERC1155, ERC1155TokenReceiver} from "../tokens/ERC1155.sol";
import {IQuiltMakerRenderer} from "./QuiltMakerRenderer.sol";
import "./ISupplyStore.sol";
import "./SupplySKU.sol";

interface IQuiltMaker {
    function getSupplyStoreAddress(uint256 storefrontId)
        external
        view
        returns (ISupplyStore supplyStoreAddress);
}

struct Quilt {
    bytes32 name;
    uint256 size;
    uint256 degradation;
    uint256[] supplySkus;
    uint256[] supplyCoords;
}

contract QuiltMaker is Ownable, ERC721, ERC1155TokenReceiver, IQuiltMaker {
    IERC1155 public cozyCoMembership;
    IQuiltMakerRenderer public renderer;

    uint256 private nextTokenId = 1;
    uint256 public reservationCost = 0.08 ether;
    uint256 public memberReservationCost = 0.04 ether;

    mapping(uint256 => Quilt) public quilts;
    mapping(uint256 => uint256) public maxStock;
    mapping(uint256 => uint256) public soldStock;
    mapping(uint256 => ISupplyStore) public supplyStoreAddresses;

    error IncorrectPrice();
    error InvalidLayout();
    error NotOwner();
    error OutOfStock();

    /// @notice Reserve a quilt with a certain size so you can stitch your supplies on later
    function reserveQuilt(bytes32 name, uint256 size) public payable {
        if (msg.value != reservationCost) revert IncorrectPrice();
        if (soldStock[size] + 1 > maxStock[size]) revert OutOfStock();
        // Mint a quilt reservation token
        _safeMint(_msgSender(), nextTokenId);
        uint256[] memory supplySkus;
        uint256[] memory supplyCoords;
        quilts[nextTokenId] = Quilt(name, size, 0, supplySkus, supplyCoords);
        soldStock[size] += 1;
        nextTokenId += 1;
    }

    /// @notice Transforms a reserved quilt into one with custom supplies
    function createQuilt(
        uint256 tokenId,
        uint256[] memory supplySkus,
        uint256[] memory supplyCoords
    ) public {
        if (ownerOf[tokenId] != _msgSender()) revert NotOwner();
        if (!renderer.validateQuiltLayout(quilts[tokenId].size, supplySkus, supplyCoords))
            revert InvalidLayout();

        // Hold the supplies in this contract
        for (uint256 i = 0; i < supplySkus.length; i++) {
            uint256 itemId = SupplySKU.getItemId(supplySkus[i]);
            IERC1155 supplyStore = supplyStoreAddresses[SupplySKU.getStorefrontId(supplySkus[i])];
            // Check they actually own the item
            if (supplyStore.balanceOf(_msgSender(), itemId) == 0) revert NotAuthorized();
            // Transfer the item
            supplyStore.safeTransferFrom(_msgSender(), address(this), itemId, 1, "");
        }

        quilts[tokenId].supplySkus = supplySkus;
        quilts[tokenId].supplyCoords = supplyCoords;
    }

    function recycleQuilt(
        uint256 tokenId,
        uint256[] memory supplySkus,
        uint256[] memory supplyCoords
    ) public payable {
        // ~ possibly check if msg.sender has built before or has recycling ability ~
        // 1. check if msg.sender owns tokenId
        // 2. check if msg.sender owns supplySkus that are not in quilts[tokenId]
        // 3. check valid layout
        // 4. transfer new tokens to this contract
        // 5. transfer remainder tokens to msg.sender
        // 6. update quilt with new layout and increased degradation
    }

    function unStitchQuilt(uint256 tokenId) public {
        if (ownerOf[tokenId] != _msgSender()) revert NotOwner();

        Quilt storage quilt = quilts[tokenId];

        for (uint256 i = 0; i < quilt.supplySkus.length; i++) {
            uint256 itemId = SupplySKU.getItemId(quilt.supplySkus[i]);
            IERC1155 supplyStore = supplyStoreAddresses[
                SupplySKU.getStorefrontId(quilt.supplySkus[i])
            ];
            // Transfer the supplies back to the owner
            supplyStore.safeTransferFrom(address(this), _msgSender(), itemId, 1, "");
        }

        uint256[] memory supplySkus;
        uint256[] memory supplyCoords;
        quilt.supplySkus = supplySkus;
        quilt.supplyCoords = supplyCoords;
    }

    function setMaxStock(
        uint256 w,
        uint256 h,
        uint256 stock
    ) public onlyOwner {
        maxStock[(uint256(uint128(w)) << 128) | uint128(h)] = stock;
    }

    function setSupplyStoreAddress(uint256 storefrontId, address storefrontAddr) public onlyOwner {
        supplyStoreAddresses[storefrontId] = ISupplyStore(storefrontAddr);
    }

    function getSupplyStoreAddress(uint256 storefrontId)
        public
        view
        override
        returns (ISupplyStore supplyStoreAddress)
    {
        supplyStoreAddress = supplyStoreAddresses[storefrontId];
    }

    function burn(uint256 tokenId) public {
        if (ownerOf[tokenId] != _msgSender()) revert NotOwner();
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        (string memory tokenData, ) = renderer.tokenURI(tokenId, quilts[tokenId]);
        return tokenData;
    }

    function getMaxStockForSize(uint256 w, uint256 h) public view returns (uint256 stock) {
        stock = maxStock[(uint256(uint128(w)) << 128) | uint128(h)];
    }

    function getAvailableStockForSize(uint256 w, uint256 h)
        public
        view
        returns (uint256 available)
    {
        uint256 size = (uint256(uint128(w)) << 128) | uint128(h);
        available = maxStock[size] - soldStock[size];
    }

    function totalSupply() public view returns (uint256 total) {
        total = nextTokenId - 1;
    }

    constructor(address rendererAddr, address membershipAddr)
        ERC721("cozy co. custom quilts", "CCCQ")
    {
        renderer = IQuiltMakerRenderer(rendererAddr);
        cozyCoMembership = IERC1155(membershipAddr);

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
