import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";
import { createContext, useEffect, useState } from "react";
import {
  CozyCoMembership,
  CozyCoMembership__factory,
} from "../typechain-types";

type MintableContracts = CozyCoMembership;

interface ContractAddressByChainId {
  [chainId: string]: string;
}

const cozyCoMembershipContract: ContractAddressByChainId = {
  "1": "0xbfE56434Ff917d8eB42677d06C0Be2b57EA79F3a",
  "4": "0xed269d608f6ec4adffca4ea8152ee7df66c25e94",
};

export interface MintManagerState {
  writeableContract: MintableContracts | null;
  readonlyContract: MintableContracts;
}

export const MintManagerContext = createContext<MintManagerState>(
  {} as MintManagerState
);

export default function MintManager({ children }: { children: any }) {
  const { library } = useWeb3();
  const rpc = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_ETH_PROVIDER_URL || "http://localhost:8545"
  );
  const readonlyContract = new ethers.Contract(
    process.env.NEXT_PUBLIC_CHAIN_ID
      ? cozyCoMembershipContract[process.env.NEXT_PUBLIC_CHAIN_ID]
      : "",
    CozyCoMembership__factory.abi,
    rpc
  ) as CozyCoMembership;

  const [writeableContract, setWriteableContract] =
    useState<MintManagerState["writeableContract"]>(null);

  // Set up a writeable contract
  useEffect(() => {
    async function setContract() {
      if (library) {
        const writeableContract = CozyCoMembership__factory.connect(
          process.env.NEXT_PUBLIC_CHAIN_ID
            ? cozyCoMembershipContract[process.env.NEXT_PUBLIC_CHAIN_ID]
            : "",
          await library.getSigner()
        ) as CozyCoMembership;
        setWriteableContract(writeableContract);
      }
    }
    setContract();
  }, [library]);

  return (
    <MintManagerContext.Provider
      value={{
        writeableContract,
        readonlyContract,
      }}
    >
      {children}
    </MintManagerContext.Provider>
  );
}
