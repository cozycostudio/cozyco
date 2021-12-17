// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Base64.sol";
import "./IMembershipMetadata.sol";

contract QuiltPackRenderer is Ownable, ERC1155Burnable {
    struct Patch {
        uint256 collectionId;
        uint256 id;
        uint256 quantity;
        uint256[2] size;
        string svgPart;
    }

    mapping(uint256 => Patch) private patches;
    mapping(uint256 => string) private collectionNames;

    modifier collectionExists(uint256 collectionId) {
        require(
            bytes(collectionNames[collectionId]).length != 0,
            "404 collection"
        );
        _;
    }

    function setPatchesForSale(
        uint256 collectionId,
        uint256[] calldata ids,
        uint256[] calldata quantities,
        uint256[2][] calldata sizes,
        string[] calldata svgParts
    ) public onlyOwner collectionExists(collectionId) {
        // We should really check all arrays are the same length here,
        // but since it's onlyOwner, it's probably ok
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            patches[id] = Patch(
                collectionId,
                id,
                quantities[id],
                sizes[id],
                svgParts[id]
            );
        }
    }

    function setPatchForSale(
        uint256 collectionId,
        uint256 id,
        uint256 quantity,
        uint256[2] calldata size,
        string calldata svgPart
    ) public onlyOwner collectionExists(collectionId) {
        patches[id] = Patch(collectionId, id, quantity, size, svgPart);
    }

    function setCollection(uint256 collectionId, string calldata name)
        public
        onlyOwner
    {
        collectionNames[collectionId] = name;
    }

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
