import QuiltsABI from "../abis/Quilts.json";
import CozyCoMembershipABI from "../abis/CozyCoMembership.json";

export const deployedContracts = {
  quilts: {
    addresses: {
      1: "0x4C4808459452c137fB9Bf3E824d4D7aC73655F54",
    },
    supportedChainIds: [1],
    abi: QuiltsABI,
  },
  cozyCoMembership: {
    addresses: {
      1: "0xbfE56434Ff917d8eB42677d06C0Be2b57EA79F3a",
      4: "0xed269d608f6ec4adffca4ea8152ee7df66c25e94",
    },
    supportedChainIds: [1, 4],
    abi: CozyCoMembershipABI,
  },
};

export function isChainSupportedForContract(
  contract: keyof typeof deployedContracts,
  chainId: number
) {
  return deployedContracts[contract].supportedChainIds.includes(chainId);
}

export function contractAddress(
  contract: keyof typeof deployedContracts,
  chainId = 1
) {
  // @ts-ignore
  return deployedContracts[contract].addresses[chainId];
}

export function contractAbi(contract: keyof typeof deployedContracts) {
  return deployedContracts[contract].abi;
}
