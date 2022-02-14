export default [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getQuiltData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256[5][5]",
            "name": "patches",
            "type": "uint256[5][5]"
          },
          {
            "internalType": "uint256",
            "name": "quiltX",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quiltY",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quiltW",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quiltH",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "xOff",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yOff",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxX",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxY",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "patchXCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "patchYCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roundness",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "themeIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "backgroundIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "backgroundThemeIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "calmnessFactor",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "includesSpecialPatch",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "hovers",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "animatedBg",
            "type": "bool"
          }
        ],
        "internalType": "struct Quilt",
        "name": "quilt",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
];
