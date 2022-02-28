export default [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "patch",
        "type": "uint8"
      }
    ],
    "name": "getPatchSVG",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "patch",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "theme",
        "type": "uint8"
      }
    ],
    "name": "getPatchSVG",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "quiltId",
        "type": "uint256"
      }
    ],
    "name": "getQuilt",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8[]",
            "name": "patches",
            "type": "uint8[]"
          },
          {
            "internalType": "uint8",
            "name": "width",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "height",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "roundness",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "calmness",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "theme",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "bgTheme",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "bgEffect",
            "type": "uint8"
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
        "internalType": "struct IQuilts.Quilt",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint8[]",
            "name": "patches",
            "type": "uint8[]"
          },
          {
            "internalType": "uint8",
            "name": "width",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "height",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "roundness",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "calmness",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "theme",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "bgTheme",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "bgEffect",
            "type": "uint8"
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
        "internalType": "struct IQuilts.Quilt",
        "name": "",
        "type": "tuple"
      }
    ],
    "name": "getQuiltSVG",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "quiltId",
        "type": "uint256"
      }
    ],
    "name": "getQuiltSVG",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
