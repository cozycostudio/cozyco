// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/DynamicBuffer.sol";
import "../utils/Strings.sol";
import "../utils/Base64.sol";
import {Quilt, IQuiltMaker} from "./QuiltMaker.sol";
import "./ISupplyMetadata.sol";
import "./ISupplyStore.sol";
import "./SupplySKU.sol";

interface IQuiltMakerRenderer {
    function tokenURI(uint256 tokenId, Quilt memory quilt)
        external
        view
        returns (string memory tokenBase64, uint256 gasUsed);

    function validateQuiltLayout(
        uint256 size,
        uint256[] memory supplySkus,
        uint256[] memory supplyCoords
    ) external pure returns (bool);
}

contract QuiltMakerRenderer is Ownable, IQuiltMakerRenderer {
    using DynamicBuffer for bytes;

    uint256 private constant CANVAS_SIZE = 448;
    uint256 private constant BASE_PATCH_SIZE = 64;

    IQuiltMaker private quiltMaker;

    /**
        @notice Validates a layout of skus for a quilt
        @dev Create a bitmap of the patch layout where 1 is occupied space and 0 is free space. While we're looping through all the skus, if the current space is already taken, we flip it back to 0. The desired result the entire bitmap to be 1's. Any 0's indicate an invalid layout.
        @param size A bit-packed number: [quiltWidth, quiltHeight]
        @param supplySkus An array of bit-packed numbers representing skus
        @param supplyCoords An array of bit-packed numbers representing [x, y];
        @return If a layout is valid or not
     */
    function validateQuiltLayout(
        uint256 size,
        uint256[] memory supplySkus,
        uint256[] memory supplyCoords
    ) public pure override returns (bool) {
        uint256 width = uint128(size);
        uint256 height = uint128(size >> 128);
        uint256 len = width * height;
        uint256 bitmap = 0;
        uint256 validBitmap = 0 | ((1 << len) - 1);

        // Create the actual bitmap from patches
        for (uint256 i = 0; i < len; i++) {
            (, , , , uint256 w, uint256 h, , ) = SupplySKU.decodeSKU(supplySkus[i]);
            uint256 x = uint64(supplyCoords[i]);
            uint256 y = uint64(supplyCoords[i] >> 128);

            // Out of bounds so return false early
            if (x + w > width || y + h > height) return false;

            // Convert all patches to be a 1x1 tile on the grid e.g.
            // a 2x2 patch adds 4 bits to the bitmap
            for (uint256 xa = 0; xa < w; xa++) {
                for (uint256 ya = 0; ya < h; ya++) {
                    uint256 bit = x + xa + width * (y + ya);
                    // If a bit is already set at this position, return false early
                    if ((bitmap >> bit) % 2 != 0) return false;
                    bitmap = bitmap | (1 << bit);
                }
            }
        }

        return bitmap == validBitmap;
    }

    function _getSupplySVGPart(uint256 sku) internal view returns (string memory part) {
        ISupplyStore supplyStore = quiltMaker.getSupplyStoreAddress(SupplySKU.getStorefrontId(sku));
        address metadata = supplyStore.getItemMetadataAddress(sku);
        part = ISupplyMetadata(metadata).getSupplySVGPart(SupplySKU.getMetadataPartNumber(sku));
    }

    function _renderSupply(uint256 sku, uint256 coords)
        internal
        view
        returns (string memory renderedSupply)
    {
        uint256 x = uint64(coords);
        uint256 y = uint64(coords >> 128);
        string memory part = _getSupplySVGPart(sku);
        uint256 itemType = SupplySKU.getItemType(sku);
        renderedSupply = string(
            abi.encodePacked(
                '<g transform="translate(',
                Strings.uintToString(itemType == 1 ? x * BASE_PATCH_SIZE : x),
                ", ",
                Strings.uintToString(itemType == 1 ? y * BASE_PATCH_SIZE : y),
                ')">',
                part,
                "</g>"
            )
        );
    }

    function _renderStitches(Quilt memory quilt)
        internal
        pure
        returns (string memory renderedStitches)
    {
        uint256 quiltW = uint128(quilt.size);
        uint256 quiltH = uint128(quilt.size >> 128);

        for (uint256 i = 0; i < quilt.supplySkus.length; i++) {
            // Skip if the sku is not a patch
            if (SupplySKU.getItemType(quilt.supplySkus[i]) != 1) continue;

            // Get the location of the patches so we know where to draw the stitches
            (uint256 sw, uint256 sh) = SupplySKU.getItemSize(quilt.supplySkus[i]);
            uint256 sx = uint64(quilt.supplyCoords[i]);
            uint256 sy = uint64(quilt.supplyCoords[i] >> 128);
            uint256 w = sw * BASE_PATCH_SIZE;
            uint256 h = sh * BASE_PATCH_SIZE;
            uint256 x = sx * BASE_PATCH_SIZE;
            uint256 y = sy * BASE_PATCH_SIZE;

            // Skip drawing stitches on the bottom right patch
            if (sx + sw == quiltW && sy + sh == quiltH) continue;

            // Draw bottom and right lines
            string memory d = string(
                abi.encodePacked(
                    "M",
                    Strings.uintToString(x),
                    ",",
                    Strings.uintToString(y + h),
                    " h",
                    Strings.uintToString(w),
                    " v-",
                    Strings.uintToString(h)
                )
            );

            // Draw only bottom border for right edge patches
            if (sx + sw == quiltW) {
                d = string(
                    abi.encodePacked(
                        "M",
                        Strings.uintToString(x),
                        ",",
                        Strings.uintToString(y + h),
                        " h",
                        Strings.uintToString(w)
                    )
                );
            }

            // Draw only right border for bottom edge patches
            if (sy + sh == quiltH) {
                d = string(
                    abi.encodePacked(
                        "M",
                        Strings.uintToString(x + w),
                        ",",
                        Strings.uintToString(y),
                        " v",
                        Strings.uintToString(h)
                    )
                );
            }
            renderedStitches = string(
                abi.encodePacked(
                    renderedStitches,
                    '<path d="',
                    d,
                    '" stroke="#2A2F4F" stroke-width="4" stroke-dasharray="4 4" stroke-dashoffset="2" />'
                )
            );
        }
    }

    function _draw(uint256 tokenId, Quilt memory quilt)
        internal
        view
        returns (string memory imageBase64)
    {
        imageBase64 = string(abi.encodePacked("data:image/svg+xml;base64,", quilt.degradation));
        bytes memory svg = DynamicBuffer.allocate(2**19);
        bytes memory svgBase64 = DynamicBuffer.allocate(2**19);

        uint256 quiltW = uint128(quilt.size);
        uint256 quiltH = uint128(quilt.size >> 128);

        // Open the SVG
        svg.appendSafe(
            abi.encodePacked(
                '<svg width="100%" height="100%" viewBox="0 0 ',
                Strings.uintToString(CANVAS_SIZE),
                " ",
                Strings.uintToString(CANVAS_SIZE),
                '" xmlns="http://www.w3.org/2000/svg" fill="none" shape-rendering="crispEdges">'
            )
        );

        // Background
        // TODO: Get this from the list of supplies or fall back to a seeded background colour
        svg.appendSafe('<rect width="100%" height="100%" fill="#F6E6D5" />');

        // Open quilt wrapper group
        svg.appendSafe(
            abi.encodePacked(
                '<g filter="url(#gl)" transform="translate(',
                Strings.uintToString(CANVAS_SIZE / 2 - (BASE_PATCH_SIZE * quiltW) / 2),
                ", ",
                Strings.uintToString(CANVAS_SIZE / 2 - (BASE_PATCH_SIZE * quiltH) / 2),
                ')"><rect x="12" y="12" rx="16" width="',
                Strings.uintToString(BASE_PATCH_SIZE * quiltW),
                '" height="',
                Strings.uintToString(BASE_PATCH_SIZE * quiltH),
                '" fill="#2A2F4F" /><rect width="',
                Strings.uintToString(BASE_PATCH_SIZE * quiltW),
                '" height="',
                Strings.uintToString(BASE_PATCH_SIZE * quiltH),
                '" rx="8" stroke="#2A2F4F" stroke-width="8" fill="#fff" /><g id="patches" clip-path="url(#quilt-shape)">'
            )
        );

        // Patches
        // TODO: Only render patches here, not other supplies
        for (uint256 i = 0; i < quilt.supplySkus.length; i++) {
            svg.appendSafe(bytes(_renderSupply(quilt.supplySkus[i], quilt.supplyCoords[i])));
        }

        // Close patches, start stitches
        svg.appendSafe('</g><g id="stitches">');
        // Stitches
        svg.appendSafe(bytes(_renderStitches(quilt)));
        // Close stitches and quilt wrapper group
        svg.appendSafe(abi.encodePacked("</g></g>"));

        // Filter definitions
        svg.appendSafe(
            abi.encodePacked(
                '<defs><clipPath id="quilt-shape"><rect width="',
                Strings.uintToString(BASE_PATCH_SIZE * quiltW),
                '" height="',
                Strings.uintToString(BASE_PATCH_SIZE * quiltH),
                '" rx="8" /></clipPath><filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence baseFrequency="0.003" seed="',
                Strings.uintToString(tokenId * 4000),
                '"/><feDisplacementMap in="SourceGraphic" scale="20"/></filter></defs>'
            )
        );

        // Close the SVG
        svg.appendSafe("</svg>");

        svgBase64.appendSafe("data:image/svg+xml;base64,");
        svgBase64.appendSafe(bytes(Base64.encode(svg)));

        imageBase64 = string(svgBase64);
    }

    function tokenURI(uint256 tokenId, Quilt memory quilt)
        public
        view
        override
        returns (string memory tokenBase64, uint256 gasUsed)
    {
        uint256 startGas = gasleft();
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"custom quilt #',
                        Strings.uintToString(tokenId),
                        '","description":"a cozy quilt","image": "',
                        _draw(tokenId, quilt),
                        '","attributes":[]}'
                    )
                )
            )
        );
        tokenBase64 = string(abi.encodePacked("data:application/json;base64,", json));
        gasUsed = startGas - gasleft();
    }

    function setQuiltMakerAddress(address quiltMakerAddress) public onlyOwner {
        quiltMaker = IQuiltMaker(quiltMakerAddress);
    }

    constructor() Ownable() {}
}
