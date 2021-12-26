// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../membership/ICozyCoMembership.sol";
import "./IPatchesStockRoom.sol";
import "./IDataQuiltAssembly.sol";
import "hardhat/console.sol";

contract QuiltAssembly is Ownable, ERC721, IERC1155Receiver {
    uint256 public constant MAX_SUPPLY_2x2 = 50;
    uint256 public constant MAX_SUPPLY_2x3 = 200;
    uint256 public constant MAX_SUPPLY_2x4 = 200;
    uint256 public constant MAX_SUPPLY_4x2 = 200;
    uint256 public constant MAX_SUPPLY_3x2 = 200;
    uint256 public constant MAX_SUPPLY_3x4 = 800;
    uint256 public constant MAX_SUPPLY_3x3 = 800;
    uint256 public constant MAX_SUPPLY_4x3 = 800;
    uint256 public constant MAX_SUPPLY_4x4 = 800;
    uint256 public constant MAX_SUPPLY_3x5 = 400;
    uint256 public constant MAX_SUPPLY_4x5 = 400;
    uint256 public constant MAX_SUPPLY_5x5 = 400;
    uint256 public constant MAX_SUPPLY_5x4 = 400;
    uint256 public constant MAX_SUPPLY_5x3 = 400;
    uint256 public constant MAX_SUPPLY_4x6 = 200;
    uint256 public constant MAX_SUPPLY_5x6 = 200;
    uint256 public constant MAX_SUPPLY_6x5 = 200;
    uint256 public constant MAX_SUPPLY_6x4 = 200;
    uint256 public constant MAX_SUPPLY_6x6 = 50;

    ICozyCoMembership private cozyCoMembership;
    address public patchesStorefront;
    IDataQuiltAssembly public metadata;

    uint256 public totalSupply;
    uint256 public creationCost = 0.025 ether;
    mapping(uint256 => uint256[]) private tokenIdToPatchIds;

    function createQuilt(uint256[] memory patchIds) public payable {
        require(msg.value == creationCost, "incorrect eth amount");
        // TODO: check if sender owns patchIds
        // TODO: add membership discounts

        // transfer patches to this contract
        uint256[] memory transferAmounts = new uint256[](patchIds.length);
        for (uint256 i = 0; i < patchIds.length; i++) {
            transferAmounts[i] = 1;
        }
        IERC1155(patchesStorefront).safeBatchTransferFrom(
            _msgSender(),
            address(this),
            patchIds,
            transferAmounts,
            ""
        );

        // mint the quilt
        uint256 tokenId = totalSupply + 1;
        _safeMint(_msgSender(), tokenId);
        tokenIdToPatchIds[tokenId] = patchIds;
        totalSupply = tokenId;
    }

    // function restitchPatches(uint256 tokenId, uint256[] memory newPatchIds)
    //     public
    //     payable
    // {
    //     // 1. check if msg.sender owns tokenId
    //     // 2. check if msg.sender owns newPatchIds that are not in tokenIdToPatchIds
    //     // 3. check valid layout
    //     // 4. transfer new tokens to this contract
    //     // 5. transfer remainder tokens to msg.sender
    //     // 6. set new layout in tokenIdToPatchIds
    // }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        string[] memory svgParts = IPatchesStockRoom(patchesStorefront).getTokenSVGParts(
            tokenIdToPatchIds[tokenId]
        );
        for (uint256 i = 0; i < svgParts.length; i++) {
            console.log("part: %s", svgParts[i]);
        }
        return "yo";
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    constructor(address membershipAddress, address patchesStorefrontAddress)
        ERC721("cozy co. custom quilts", "CCCQ")
    {
        cozyCoMembership = ICozyCoMembership(membershipAddress);
        patchesStorefront = patchesStorefrontAddress;
    }
}
