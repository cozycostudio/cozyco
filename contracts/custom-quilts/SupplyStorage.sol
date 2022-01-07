// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC1155, IERC1155} from "../tokens/ERC1155/ERC1155.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Base64.sol";
import "../utils/Random.sol";
import "../utils/Strings.sol";
import "./ISuppliesMetadata.sol";

contract SupplyStorage is Ownable, ERC1155, ReentrancyGuard {
    /**************************************************************************
     * STORAGE
     *************************************************************************/

    /** Related contracts **/
    mapping(uint256 => address) public itemRenderers;

    /** Supplies **/
    struct Collection {
        address renderer;
        string name;
        string creator;
    }

    struct Item {
        uint256 collectionId;
        // [uint128(type), uint64(width), uint64(height)]
        uint256 typeAndDimensions;
    }

    mapping(uint256 => Collection) private collections;
    mapping(uint256 => Item) private items;

    /** Collections **/
    uint256 private nextCollectionId = 1;

    /**************************************************************************
     * ERRORS
     *************************************************************************/

    error InvalidConfiguration();
    error IncorrectPaymentAmount();
    error MemberExclusive();
    error NotAuthorized();
    error NotCollaborator();
    error NotFound();
    error OutOfStock();
    error StoreClosed();
    error TransferFailed();
    error ZeroBalance();

    /**************************************************************************
     * STORE ITEMS
     *************************************************************************/

    function stockInNewCollection(
        address renderer,
        uint256[] memory supplies,
        string memory collectionName,
        string memory creator
    ) public onlyOwner {
        for (uint256 i = 0; i < supplies.length; i++) {
            items[nextCollectionId + i] = Item(nextCollectionId, supplies[i]);
        }
        collections[nextCollectionId] = Collection(renderer, collectionName, creator);
        nextCollectionId++;
    }

    // function addItemsToCollection

    /**************************************************************************
     * GETTERS
     *************************************************************************/

    function getRendererForItem(uint256 itemId) public view returns (address renderer) {
        renderer = collections[items[itemId].collectionId].renderer;
    }

    function getItemType(uint256 itemId) public view returns (uint256 itemType) {
        itemType = uint128(items[itemId].typeAndDimensions);
    }

    function getItemDimensions(uint256 itemId) public view returns (uint256 itemDimensions) {
        itemDimensions = uint128(items[itemId].typeAndDimensions >> 128);
    }

    function getItemPart(uint256 itemId) public view returns (string memory itemPart) {}

    function getTokenImage(uint256 itemId) public view returns (string memory tokenImage) {}

    function getCollectionName(uint256 collectionId)
        public
        view
        returns (string memory collectionName)
    {
        collectionName = collections[collectionId].name;
    }

    function getCollectionNameByItem(uint256 itemId)
        public
        view
        returns (string memory collectionName)
    {
        collectionName = collections[items[itemId].collectionId].name;
    }

    function getCollectionCreator(uint256 collectionId)
        public
        view
        returns (string memory collectionCreator)
    {
        collectionCreator = collections[collectionId].name;
    }

    function getCollectionCreatorByItem(uint256 itemId)
        public
        view
        returns (string memory collectionCreator)
    {
        collectionCreator = collections[items[itemId].collectionId].creator;
    }

    /**************************************************************************
     * TOKEN URI
     *************************************************************************/

    function uri(uint256 id) public view virtual override returns (string memory tokenURI) {
        address renderer = getRendererForItem(id);
        if (renderer == address(0)) revert NotFound();
        tokenURI = ISuppliesMetadata(renderer).tokenURI(id, id);
    }

    /**************************************************************************
     * STANDARDS
     *************************************************************************/

    constructor() ERC1155() Ownable() {}
}
