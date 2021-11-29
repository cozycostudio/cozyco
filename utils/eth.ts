import { ethers } from "ethers";

export async function resolveAddress(address: string) {
  const provider = ethers.getDefaultProvider();
  let ensAddress;
  if (address.trim().endsWith(".eth")) {
    ensAddress = await provider.resolveName(address);
  } else {
    return address;
  }
  try {
    const resolved = ethers.utils.getAddress(ensAddress || address);
    return resolved;
  } catch (e) {
    return null;
  }
}

export async function isValidAddress(address: string) {
  const provider = ethers.getDefaultProvider();
  let ensAddress;
  if (address.trim().endsWith(".eth")) {
    ensAddress = await provider.resolveName(address);
  }
  try {
    ethers.utils.getAddress(ensAddress || address);
  } catch (e) {
    return false;
  }
  return true;
}
