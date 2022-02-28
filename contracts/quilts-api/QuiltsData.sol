// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

contract QuiltsData {
    struct Theme {
        string name;
        bytes6[4] colors;
        string svgString;
    }

    struct Patch {
        string name;
        string svgString;
    }

    struct Background {
        string name;
        string[4] parts;
        string svgString;
    }

    mapping(uint256 => Theme) private themes;

    function _storeThemes() internal {
        string[10] memory names = [
            "Pink panther",
            "Cherry blossom",
            "Desert",
            "Forest",
            "Mushroom",
            "Mint tea",
            "Fairy grove",
            "Pumpkin",
            "Twilight",
            "Black & white"
        ];

        bytes6[4][10] memory colors = [
            [bytes6("5c457b"), "ff8fa4", "f9bdbd", "fbced6"],
            [bytes6("006d77"), "ffafcc", "ffe5ef", "bde0fe"],
            [bytes6("3d405b"), "f2cc8f", "e07a5f", "f4f1de"],
            [bytes6("333d29"), "656d4a", "dda15e", "c2c5aa"],
            [bytes6("6d2e46"), "d5b9b2", "a26769", "ece2d0"],
            [bytes6("006d77"), "83c5be", "ffddd2", "edf6f9"],
            [bytes6("351f39"), "726a95", "719fb0", "a0c1b8"],
            [bytes6("472e2a"), "e78a46", "fac459", "fde3ae"],
            [bytes6("0d1b2a"), "2f4865", "7b88a7", "b4c0d0"],
            [bytes6("222222"), "eeeeee", "bbbbbb", "eeeeee"]
        ];

        for (uint256 i = 0; i < 11; i++) {
            string memory svgString = string(
                abi.encodePacked(
                    '<linearGradient id="c1"><stop stop-color="',
                    colors[i][0],
                    '"/></linearGradient><linearGradient id="c2"><stop stop-color="',
                    colors[i][1],
                    '"/></linearGradient><linearGradient id="c3"><stop stop-color="',
                    colors[i][2],
                    '"/></linearGradient><linearGradient id="c4"><stop stop-color="',
                    colors[i][3],
                    '"/></linearGradient>'
                )
            );
            themes[i] = Theme(names[i], colors[i], svgString);
        }
    }

    string[16] private patchNames = [
        "Quilty",
        "Waterfront",
        "Flow",
        "Bengal",
        "Sunbeam",
        "Spires",
        "Division",
        "Crashing waves",
        "Equilibrium",
        "Ichimatsu",
        "Highlands",
        "Log cabin",
        "Maiz",
        "Flying geese",
        "Pinwheel",
        "Kawaii"
    ];

    string[4] private backgroundNames = ["Dusty", "Flags", "Electric", "Groovy"];

    string[4] private calmnessNames = ["Serene", "Calm", "Wavey", "Chaotic"];

    string[16] private patches = [
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M0 0h64v32H0z"/><path fill="url(#c2)" d="M0 32 16 0v32H0Zm16 0L32 0v32H16Zm16 0L48 0v32H32Zm16 0L64 0v32H48Z"/><circle cx="16" cy="48" r="4" fill="url(#c1)"/><circle cx="48" cy="48" r="4" fill="url(#c1)"/>',
        '<path fill="url(#c2)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M32 0h32v64H32z"/><path fill="url(#c3)" d="M0 64 64 0v64H0Z"/><circle cx="46" cy="46" r="10" fill="url(#c2)"/>',
        '<path fill="url(#c2)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="m52 16 8-16h16l-8 16v16l8 16v16H60V48l-8-16V16Zm-64 0 8-16h16L4 16v16l8 16v16H-4V48l-8-16V16Z"/><path fill="url(#c3)" d="m4 16 8-16h16l-8 16v16l8 16v16H12V48L4 32V16Zm32 0 8-16h16l-8 16v16l8 16v16H44V48l-8-16V16Z"/>',
        '<path fill="url(#c1)" d="M0 0h64v64H0z"/><path fill="url(#c3)" d="M0 60h64v8H0zm0-16h64v8H0zm0-16h64v8H0zm0-16h64v8H0zM0-4h64v8H0z"/>',
        '<path fill="url(#c1)" d="M0 0h64v64H0z"/><path fill="url(#c3)" d="M16 0H8L0 8v8L16 0Zm16 0h-8L0 24v8L32 0Zm16 0h-8L0 40v8L48 0Zm16 0h-8L0 56v8L64 0Zm0 16V8L8 64h8l48-48Zm0 16v-8L24 64h8l32-32Zm0 16v-8L40 64h8l16-16Zm0 16v-8l-8 8h8Z"/>',
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M0 64 32 0v64H0Zm32 0L64 0v64H32Z"/>',
        '<path fill="url(#c1)" d="M0 0h64v64H0z"/><path fill="url(#c3)" d="M0 64 64 0v64H0Z"/>',
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M0 16V0h64L48 16V0L32 16V0L16 16V0L0 16Z"/><path fill="url(#c2)" d="M0 48V32h64L48 48V32L32 48V32L16 48V32L0 48Z"/>',
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M0 0h48v48H0z"/><path fill="url(#c2)" d="M0 48 48 0v48H0Z"/><circle cx="23" cy="25" r="8" fill="url(#c3)"/>',
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M0 0h32v32H0zm32 32h32v32H32z"/>',
        '<path fill="url(#c1)" d="M0 0h64v64H0z"/><path fill="url(#c3)" d="M16 0 0 16v16l16-16 16 16 16-16 16 16V16L48 0 32 16 16 0Zm0 32L0 48v16l16-16 16 16 16-16 16 16V48L48 32 32 48 16 32Z"/>',
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="M8 8h40v8H8z"/><path fill="url(#c2)" d="M24 32h8v8h-8zm8-8h8v8h-8z"/><path fill="url(#c1)" d="M24 24h8v8h-8zm8 8h8v8h-8zM16 48h40v8H16z"/><path fill="url(#c2)" d="M8 16h8v40H8zm40-8h8v40h-8z"/>',
        '<path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c1)" d="m24 4 8 8-8 8V4Zm0 40 8 8-8 8V44Zm-4-20-8 8-8-8h16Zm40 0-8 8-8-8h16ZM40 4l-8 8 8 8V4Zm0 40-8 8 8 8V44Zm-20-4-8-8-8 8h16Zm40 0-8-8-8 8h16Z"/><path fill="url(#c2)" d="M24 24h16v16H24z"/>',
        '<path fill="url(#c1)" d="M0 0h64v64H0z"/><path fill="url(#c2)" d="m32 0 16 16-16 16V0Zm0 64L16 48l16-16v32ZM48 0l16 16-16 16V0ZM16 64 .0000014 48 16 32v32Z"/><path fill="url(#c3)" d="M0 16 16 2e-7 32 16H0Zm64 32L48 64 32 48h32ZM32 32 16 16 0 32h32Zm0 0 16 16 16-16H32Z"/>',
        '<path fill="url(#c2)" d="M0 0h64v64H0z"/><path fill="url(#c3)" d="M0 0h64v64H0z"/><path fill="url(#c2)" d="M32 32-.0000014.0000019 32 5e-7V32Zm0 0 32 32H32V32Z"/><path fill="url(#c1)" d="M32 32-.00000381 64l.0000028-32H32Zm0 0L64 0v32H32Z"/>',
        '<rect width="64" height="64" fill="url(#c2)"/><path fill="url(#c1)" d="M9 50v14h46V50h-2v-6h-2v-6h-2v-4h-2v-2h-4v2h-2v4H23v-4h-2v-2h-4v2h-2v4h-2v6h-2v6H9Z"/><path fill="url(#c3)" d="M11 50v14h42V50h-2v-6h-2v-6h-2v-4h-4v4h-2v2H23v-2h-2v-4h-4v4h-2v6h-2v6h-2Z"/><path fill="url(#c2)" d="M23 44v-4h4v4h-4Zm6 0v-4h6v4h-6Zm8 0v-4h4v4h-4ZM13 54h-2v8h2v-8Zm38 8v-8h2v8h-2Z"/><path fill="url(#c1)" d="M15 48v-2h2v2h2v2h-2v2h-2v-2h2v-2h-2Zm6 2v-4h4v4h-4Zm8 2v-2h2v-2h2v2h2v2h-6Zm10-2v-4h4v4h-4Zm8-4h2v2h-2v2h2v2h-2v-2h-2v-2h2v-2Z"/>'
    ];

    // string[4] private backgrounds = [
    //     string(
    //         abi.encodePacked(
    //             '<pattern id="bp" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="32" cy="32" r="8" fill="transparent" stroke="url(#c1)" stroke-width="1" opacity=".6"/></pattern><filter id="bf"><feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="1" seed="',
    //             seed,
    //             '"/><feDisplacementMap in="SourceGraphic" xChannelSelector="B" scale="200"/></filter><g filter="url(#bf)"><rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#bp)">',
    //             quilt.animatedBg
    //                 ? '<animateTransform attributeName="transform" type="translate" dur="4s" values="0,0; 0,64;"  repeatCount="indefinite"/>'
    //                 : "",
    //             "</rect></g>"
    //         )
    //     ),
    //     string(
    //         abi.encodePacked(
    //             '<pattern id="bp" width="128" height="128" patternUnits="userSpaceOnUse"><path d="m64 16 32 32H64V16ZM128 16l32 32h-32V16ZM0 16l32 32H0V16ZM128 76l-32 32h32V76ZM64 76l-32 32h32V76Z" fill="url(#c2)"/></pattern><filter id="bf"><feTurbulence type="fractalNoise" baseFrequency="0.002" numOctaves="1" seed="',
    //             seed,
    //             '"/><feDisplacementMap in="SourceGraphic" scale="100"/></filter><g filter="url(#bf)"><rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#bp)" opacity=".2">',
    //             quilt.animatedBg
    //                 ? '<animateTransform attributeName="transform" type="translate" dur="4s" values="0,0; 0,128;" repeatCount="indefinite"/>'
    //                 : "",
    //             "</rect></g>"
    //         )
    //     ),
    //     string(
    //         abi.encodePacked(
    //             '<pattern id="bp" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M32 0L0 32V64L32 32L64 64V32L32 0Z" fill="url(#c1)" opacity=".1"/></pattern><filter id="bf"><feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="1" seed="',
    //             seed,
    //             '"/><feDisplacementMap in="SourceGraphic" scale="200"/></filter><g filter="url(#bf)"><rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#bp)">',
    //             quilt.animatedBg
    //                 ? '<animateTransform attributeName="transform" type="translate" dur="4s" values="0,0; -128,0;" repeatCount="indefinite"/>'
    //                 : "",
    //             "</rect></g>"
    //         )
    //     ),
    //     string(
    //         abi.encodePacked(
    //             '<pattern id="bp" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 20a20 20 0 1 1 0 1M40 0a20 20 0 1 0 40 0m0 40a20 20 0 1 0 -40 0" fill="url(#c2)" opacity=".2"/></pattern><filter id="bf"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="',
    //             seed,
    //             '"/><feDisplacementMap in="SourceGraphic" scale="200"/></filter><g filter="url(#bf)"><rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#bp)">',
    //             quilt.animatedBg
    //                 ? '<animateTransform attributeName="transform" type="translate" dur="4s" values="0,0; 0,-80;" repeatCount="indefinite"/>'
    //                 : "",
    //             "</rect></g>"
    //         )
    //     )
    // ];
}
