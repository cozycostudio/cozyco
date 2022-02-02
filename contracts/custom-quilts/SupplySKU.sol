// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

struct DecodedSKU {
    uint256 storefrontId;
    uint256 creatorId;
    uint256 itemId;
    uint256 itemType;
    uint256 itemWidth;
    uint256 itemHeight;
    uint256 metadataPartNumber;
    uint256 metadataAddrIndex;
}

library SupplySKU {
    function encodeSKU(
        uint256 storefrontId,
        uint256 creatorId,
        uint256 itemId,
        uint256 itemType,
        uint256 itemWidth,
        uint256 itemHeight,
        uint256 metadataPartNumber,
        uint256 metadataAddrIndex
    ) internal pure returns (uint256 sku) {
        sku = sku | (storefrontId << 0);
        sku = sku | (creatorId << 16);
        sku = sku | (itemId << 32);
        sku = sku | (itemType << 96);
        sku = sku | (itemWidth << 128);
        sku = sku | (itemHeight << 160);
        sku = sku | (metadataPartNumber << 192);
        sku = sku | (metadataAddrIndex << 224);
    }

    function decodeSKU(uint256 sku)
        internal
        pure
        returns (
            uint256 storefrontId,
            uint256 creatorId,
            uint256 itemId,
            uint256 itemType,
            uint256 itemWidth,
            uint256 itemHeight,
            uint256 metadataPartNumber,
            uint256 metadataAddrIndex
        )
    {
        storefrontId = uint16(sku >> 0);
        creatorId = uint16(sku >> 16);
        itemId = uint64(sku >> 32);
        itemType = uint32(sku >> 96);
        itemWidth = uint32(sku >> 128);
        itemHeight = uint32(sku >> 160);
        metadataPartNumber = uint32(sku >> 192);
        metadataAddrIndex = uint32(sku >> 224);
    }

    function decodeSKUToStruct(uint256 sku) internal pure returns (DecodedSKU memory decodedSKU) {
        decodedSKU.storefrontId = uint16(sku >> 0);
        decodedSKU.creatorId = uint16(sku >> 16);
        decodedSKU.itemId = uint64(sku >> 32);
        decodedSKU.itemType = uint32(sku >> 96);
        decodedSKU.itemWidth = uint32(sku >> 128);
        decodedSKU.itemHeight = uint32(sku >> 160);
        decodedSKU.metadataPartNumber = uint32(sku >> 192);
        decodedSKU.metadataAddrIndex = uint32(sku >> 224);
    }

    function getStorefrontId(uint256 sku) internal pure returns (uint256 storefrontId) {
        storefrontId = uint16(sku >> 0);
    }

    function getCreatorId(uint256 sku) internal pure returns (uint256 creatorId) {
        creatorId = uint16(sku >> 16);
    }

    function getItemId(uint256 sku) internal pure returns (uint256 itemId) {
        itemId = uint64(sku >> 32);
    }

    function getItemType(uint256 sku) internal pure returns (uint256 itemType) {
        itemType = uint32(sku >> 96);
    }

    function getItemSize(uint256 sku) internal pure returns (uint256 w, uint256 h) {
        w = uint32(sku >> 128);
        h = uint32(sku >> 160);
    }

    function getMetadataPartNumber(uint256 sku) internal pure returns (uint256 metadataPartNumber) {
        metadataPartNumber = uint32(sku >> 192);
    }

    function getMetadataAddrIndex(uint256 sku) internal pure returns (uint256 metadataAddrIndex) {
        metadataAddrIndex = uint32(sku >> 224);
    }
}
