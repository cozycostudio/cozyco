// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../../utils/SSTORE2.sol";
import "../../utils/DynamicBuffer.sol";
import "../../utils/Strings.sol";
import "../../utils/Base64.sol";
import "../../utils/Random.sol";
import "../ISupplyMetadata.sol";
import "../SupplySKU.sol";

contract PatchesBlankData is Ownable, ISupplyMetadata {
    using DynamicBuffer for bytes;

    string public constant ARTIST = "Quilt Stitcher";
    string public constant COLLECTION = "Blanks";

    uint256 public partsCount = 1;
    mapping(uint256 => address) public svgPartPointers;

    bytes6[5] private imageBackgrounds = [bytes6("FBF4F0"), "FFEDED", "FFD8CC", "E6EDFF", "9CE2DF"];
    bytes6[9] private patchColours = [
        bytes6("FDD75F"),
        "FEA589",
        "5F8BFD",
        "FFAFCC",
        "3FACA6",
        "FD7C84",
        "237672",
        "6974D4",
        "9A3D5F"
    ];

    error InvalidPart();

    function addParts(bytes[] memory _parts) public onlyOwner {
        for (uint256 i = 0; i < _parts.length; i++) {
            svgPartPointers[partsCount + i] = SSTORE2.write(_parts[i]);
        }
        partsCount += _parts.length;
    }

    function getSupplySVGPart(uint256 partNumber)
        public
        view
        override
        returns (string memory part)
    {
        if (partNumber == 0 || partNumber > partsCount) revert InvalidPart();
        part = string(SSTORE2.read(svgPartPointers[partNumber]));
    }

    function tokenImageForSKU(uint256 sku) public view returns (string memory imageBase64) {
        DecodedSKU memory decodedSKU = SupplySKU.decodeSKUToStruct(sku);

        if (svgPartPointers[decodedSKU.metadataPartNumber] == address(0)) revert InvalidPart();

        uint256 w = decodedSKU.itemWidth * 64;
        uint256 h = decodedSKU.itemHeight * 64;
        uint256 x = (200 - w) / 2;
        uint256 y = (200 - h) / 2;
        bytes6 bg = imageBackgrounds[
            Random.seeded(Strings.uintToString(sku)) % imageBackgrounds.length
        ];

        // Allocate 524KB of memory, we will not use this much, but it's safe.
        bytes memory svg = DynamicBuffer.allocate(2**19);
        bytes memory svgBase64 = DynamicBuffer.allocate(2**19);

        svg.appendSafe(
            abi.encodePacked(
                '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" fill="none"><rect width="100%" height="100%" fill="#',
                bg,
                '"/><g transform="translate(',
                Strings.uintToString(x),
                ",",
                Strings.uintToString(y),
                ')">',
                getSupplySVGPart(decodedSKU.metadataPartNumber),
                '<rect width="',
                Strings.uintToString(w),
                '" height="',
                Strings.uintToString(h),
                '" x="0" y="0" fill="none" stroke="black" stroke-width="4" stroke-dasharray="4 4" stroke-dashoffset="2" /></g></svg>'
            )
        );

        svgBase64.appendSafe("data:image/svg+xml;base64,");
        svgBase64.appendSafe(bytes(Base64.encode(svg)));

        return string(svgBase64);
    }

    function tokenURIForSKU(uint256 sku) public view override returns (string memory tokenBase64) {
        DecodedSKU memory decodedSKU = SupplySKU.decodeSKUToStruct(sku);

        if (svgPartPointers[decodedSKU.metadataPartNumber] == address(0)) revert InvalidPart();

        // Allocate 524KB of memory, we will not use this much, but it's safe.
        bytes memory json = DynamicBuffer.allocate(2**19);
        bytes memory jsonBase64 = DynamicBuffer.allocate(2**19);

        json.appendSafe(
            abi.encodePacked(
                '{"name":"Blank patch #',
                decodedSKU.metadataPartNumber,
                '","description":"A blank patch, perfect for filling in the gaps in a custom quilt.","image": "',
                tokenImageForSKU(sku),
                '","attributes":[{"trait_type":"Type","value":"Patch","trait_type":"Artist","value":"',
                ARTIST,
                '"},{"trait_type":"Collection","value":"',
                COLLECTION,
                '"},{"trait_type":"Size","value":"',
                decodedSKU.itemWidth,
                "x",
                decodedSKU.itemHeight,
                '"}]}'
            )
        );

        jsonBase64.appendSafe("data:application/json;base64,");
        jsonBase64.appendSafe(bytes(Base64.encode(json)));

        return string(jsonBase64);
    }

    constructor() Ownable() {
        // Add some of the base patches
        bytes[] memory parts = new bytes[](36);
        for (uint256 i = 0; i < 36; i++) {
            bytes6 color = patchColours[
                Random.seeded(Strings.uintToString(i * 400)) % patchColours.length
            ];
            if (i < 16) {
                parts[i] = bytes(
                    abi.encodePacked(
                        '<rect width="64" height="64" x="0" y="0" fill="#',
                        color,
                        '" />'
                    )
                );
            } else if (i < 24) {
                parts[i] = bytes(
                    abi.encodePacked(
                        '<rect width="128" height="64" x="0" y="0" fill="#',
                        color,
                        '" />'
                    )
                );
            } else if (i < 32) {
                parts[i] = bytes(
                    abi.encodePacked(
                        '<rect width="64" height="128" x="0" y="0" fill="#',
                        color,
                        '" />'
                    )
                );
            } else {
                parts[i] = bytes(
                    abi.encodePacked(
                        '<rect width="128" height="128" x="0" y="0" fill="#',
                        color,
                        '" />'
                    )
                );
            }
        }
        addParts(parts);
    }
}
