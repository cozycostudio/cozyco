// SPDX-License-Identifier: The Unlicense
pragma solidity ^0.8.10;

interface IQuilts {
    struct Quilt {
        uint8[] patches;
        uint8 width;
        uint8 height;
        uint8 roundness;
        uint8 calmness;
        uint8 theme;
        uint8 bgTheme;
        uint8 bgEffect;
        bool hovers;
        bool animatedBg;
    }

    struct OriginalQuilt {
        uint256[5][5] patches;
        uint256 quiltX;
        uint256 quiltY;
        uint256 quiltW;
        uint256 quiltH;
        uint256 xOff;
        uint256 yOff;
        uint256 maxX;
        uint256 maxY;
        uint256 patchXCount;
        uint256 patchYCount;
        uint256 roundness;
        uint256 themeIndex;
        uint256 backgroundIndex;
        uint256 backgroundThemeIndex;
        uint256 calmnessFactor;
        bool includesSpecialPatch;
        bool hovers;
        bool animatedBg;
    }
}
