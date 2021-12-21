// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Base64.sol";
import "./IPatchesData.sol";

contract PatchesStorefront is Ownable, ERC1155Burnable {
    struct Patch {
        address metadata;
        uint256 price;
        uint256 maxQuantity;
        uint256 partIndex;
    }

    mapping(uint256 => Patch) private patches;
    mapping(uint256 => uint256) private patchPurchasedQuantities;
    uint256 public totalPatches;

    /**************************************************************************
     * PURCHASING
     *************************************************************************/

    function purchasePatches(
        uint256[] memory patchIds,
        uint256[] memory amounts
    ) public payable {
        require(patchIds.length == amounts.length, "400");
        uint256 totalPrice;
        // Check if all patches are in-stock and add up prices
        for (uint256 i = 0; i < patchIds.length; i++) {
            require(
                patchPurchasedQuantities[patchIds[i]] + amounts[i] <=
                    patches[patchIds[i]].maxQuantity,
                "out of stock"
            );
            totalPrice += patches[patchIds[i]].price * amounts[i];
        }
        require(msg.value == totalPrice, "incorrect price");
        // Mint them
        _mintBatch(_msgSender(), patchIds, amounts, "");
        // Update purchased amounts
        for (uint256 i = 0; i < patchIds.length; i++) {
            patchPurchasedQuantities[patchIds[i]] += amounts[i];
        }
    }

    /**************************************************************************
     * CREATION OF PATCHES
     *************************************************************************/

    function addPatches(
        address metadata,
        uint256[] memory quantities,
        uint256[] memory prices,
        uint256 startingPatchPartIndex
    ) public onlyOwner {
        require(quantities.length == prices.length, "400");
        for (uint256 i = 0; i < quantities.length; i++) {
            uint256 tokenId = totalPatches + i + 1;
            patches[tokenId] = Patch(
                metadata,
                prices[i],
                quantities[i],
                startingPatchPartIndex + i
            );
        }
        totalPatches += quantities.length;
    }

    /**************************************************************************
     * TOKEN URI
     *************************************************************************/

    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(patches[id].metadata != address(0), "404");
        return IPatchesData(patches[id].metadata).tokenURI(id);
    }

    /**************************************************************************
     * GETTERS
     *************************************************************************/

    function getPatchMetadataAddress(uint256 patchId)
        public
        view
        returns (address)
    {
        return patches[patchId].metadata;
    }

    function getPatchMaxQuantity(uint256 patchId)
        public
        view
        returns (uint256)
    {
        return patches[patchId].maxQuantity;
    }

    function getPatchPartIndex(uint256 patchId) public view returns (uint256) {
        return patches[patchId].partIndex;
    }

    /**************************************************************************
     * STANDARDS
     *************************************************************************/

    constructor() ERC1155("") Ownable() {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
