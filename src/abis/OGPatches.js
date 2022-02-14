export default [
  {
    "inputs": [],
    "name": "AlreadyClaimed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "claimedQuilts",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cozyCoQuiltSupplyStore",
    "outputs": [
      {
        "internalType": "contract ICozyCoQuiltSupplyStore",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ogQuiltGenerator",
    "outputs": [
      {
        "internalType": "contract IQuiltGenerator",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
