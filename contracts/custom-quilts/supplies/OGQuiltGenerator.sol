//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
    Because quilts were deterministic, we can copy the library code to recreate the data
    we need to regenerate the quilts.

    Original quilts contract address: 0x4C4808459452c137fB9Bf3E824d4D7aC73655F54
 */

import "../../utils/Strings.sol";

struct Quilt {
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

interface IQuiltGenerator {
    function getQuiltData(uint256 tokenId) external pure returns (Quilt memory quilt);
}

contract OGQuiltGenerator {
    struct RandValues {
        uint256 x;
        uint256 y;
        uint256 roundness;
        uint256 theme;
        uint256 bg;
        uint256 cf;
        uint256 spX;
        uint256 spY;
    }

    function getQuiltData(uint256 tokenId) external pure returns (Quilt memory quilt) {
        string memory seed = Strings.uintToString(tokenId * 4444);
        RandValues memory rand;

        // Determine how big the quilt is
        rand.x = random(seed, "X") % 100;
        rand.y = random(seed, "Y") % 100;

        if (rand.x < 1) {
            quilt.patchXCount = 1;
        } else if (rand.x < 10) {
            quilt.patchXCount = 2;
        } else if (rand.x < 60) {
            quilt.patchXCount = 3;
        } else if (rand.x < 90) {
            quilt.patchXCount = 4;
        } else {
            quilt.patchXCount = 5;
        }

        if (quilt.patchXCount == 1) {
            quilt.patchYCount = 1;
        } else if (rand.y < 10) {
            quilt.patchYCount = 2;
        } else if (rand.y < 60) {
            quilt.patchYCount = 3;
        } else if (rand.y < 90) {
            quilt.patchYCount = 4;
        } else {
            quilt.patchYCount = 5;
        }

        if (quilt.patchXCount == 2 && quilt.patchYCount == 5) {
            quilt.patchXCount = 3;
        }
        if (quilt.patchYCount == 2 && quilt.patchXCount == 5) {
            quilt.patchYCount = 3;
        }

        // Patch selection
        quilt.includesSpecialPatch = random(seed, "ISP") % 4000 > 3996;
        rand.spX = random(seed, "SPX") % quilt.patchXCount;
        rand.spY = random(seed, "SPY") % quilt.patchYCount;
        for (uint256 col = 0; col < quilt.patchXCount; col++) {
            for (uint256 row = 0; row < quilt.patchYCount; row++) {
                quilt.patches[col][row] =
                    random(seed, string(abi.encodePacked("P", col, row))) %
                    15;

                if (quilt.includesSpecialPatch) {
                    quilt.patches[rand.spX][rand.spY] = 15;
                }
            }
        }

        // Coordinates and dimensions for the quilts
        quilt.maxX = 64 * quilt.patchXCount + (quilt.patchXCount - 1) * 4;
        quilt.maxY = 64 * quilt.patchYCount + (quilt.patchYCount - 1) * 4;
        quilt.xOff = (500 - quilt.maxX) / 2;
        quilt.yOff = (500 - quilt.maxY) / 2;
        quilt.quiltW = quilt.maxX + 32;
        quilt.quiltH = quilt.maxY + 32;
        quilt.quiltX = quilt.xOff + 0 - 16;
        quilt.quiltY = quilt.yOff + 0 - 16;

        // Patch roundness
        rand.roundness = random(seed, "R") % 100;
        if (rand.roundness < 70) {
            quilt.roundness = 8;
        } else if (rand.roundness < 90) {
            quilt.roundness = 16;
        } else {
            quilt.roundness = 0;
        }

        // Color theme
        rand.theme = random(seed, "T") % 1000;
        if (rand.theme < 115) {
            quilt.themeIndex = 0;
        } else if (rand.theme < 230) {
            quilt.themeIndex = 1;
        } else if (rand.theme < 345) {
            quilt.themeIndex = 2;
        } else if (rand.theme < 460) {
            quilt.themeIndex = 3;
        } else if (rand.theme < 575) {
            quilt.themeIndex = 4;
        } else if (rand.theme < 690) {
            quilt.themeIndex = 5;
        } else if (rand.theme < 805) {
            quilt.themeIndex = 6;
        } else if (rand.theme < 930) {
            quilt.themeIndex = 7;
        } else if (rand.theme < 990) {
            quilt.themeIndex = 8;
        } else {
            quilt.themeIndex = 9;
        }

        quilt.backgroundThemeIndex = random(seed, "SBGT") % 100 > 33
            ? random(seed, "SBGT") % 10
            : quilt.themeIndex;

        // Background variant
        rand.bg = random(seed, "BG") % 100;
        if (rand.bg < 70) {
            quilt.backgroundIndex = 0;
        } else if (rand.bg < 80) {
            quilt.backgroundIndex = 1;
        } else if (rand.bg < 90) {
            quilt.backgroundIndex = 2;
        } else {
            quilt.backgroundIndex = 3;
        }

        // How calm or wavey a quilt is
        rand.cf = random(seed, "CF") % 100;
        if (rand.cf < 50) {
            quilt.calmnessFactor = 1;
        } else if (rand.cf < 70) {
            quilt.calmnessFactor = 2;
        } else if (rand.cf < 95) {
            quilt.calmnessFactor = 3;
        } else {
            quilt.calmnessFactor = 4;
        }

        // Animations
        quilt.hovers = random(seed, "H") % 100 > 90;
        quilt.animatedBg = random(seed, "ABG") % 100 > 70;

        return quilt;
    }

    function random(string memory seed, string memory key) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(key, seed)));
    }
}
