import { ethers } from "ethers";

const foo = ethers.utils.parseEther("0.01");

console.log(foo);

interface Token {
  price: ethers.BigNumber;
  memberPrice: ethers.BigNumber;
  quantity: number;
  metadata: string;
  storageIndex: number;
}

type TokenRecord = Record<number, Token>;

export const tokenData: TokenRecord = {
  9000: {
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    metadata: "",
    storageIndex: 0,
  },
  9001: {
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    metadata: "",
    storageIndex: 0,
  },
  9002: {
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    metadata: "",
    storageIndex: 0,
  },
  9003: {
    price: ethers.utils.parseEther("0.02"),
    memberPrice: ethers.utils.parseEther("0.016"),
    quantity: 10,
    metadata: "",
    storageIndex: 0,
  },
  9004: {
    price: ethers.utils.parseEther("0.02"),
    memberPrice: ethers.utils.parseEther("0.016"),
    quantity: 10,
    metadata: "",
    storageIndex: 0,
  },
};

interface TokenBundle extends Token {
  bundleSize: number;
  tokenIdsInBundle: number[];
}

type TokenBundleRecord = Record<number, TokenBundle>;

export const tokenBundleData: TokenBundleRecord = {
  9005: {
    price: ethers.utils.parseEther("0.1"),
    memberPrice: ethers.utils.parseEther("0.075"),
    quantity: 10,
    metadata: "",
    storageIndex: 0,
    bundleSize: 5,
    tokenIdsInBundle: [9000, 9001, 9002],
  },
  9006: {
    price: ethers.utils.parseEther("0.2"),
    memberPrice: ethers.utils.parseEther("0.15"),
    quantity: 20,
    metadata: "",
    storageIndex: 0,
    bundleSize: 10,
    tokenIdsInBundle: [9003, 9004],
  },
};

export const tokens = {
  ids: () => Object.keys(tokenData).map((i) => Number(i)),
  prices: () => Object.entries(tokenData).map(([_, { price }]) => price),
  price: (id: number) => tokenData[id].price,
  memberPrices: () =>
    Object.entries(tokenData).map(([_, { memberPrice }]) => memberPrice),
  memberPrice: (id: number) => tokenData[id].memberPrice,
  quantities: () =>
    Object.entries(tokenData).map(([_, { quantity }]) => quantity),
  memberQuantity: (id: number) => tokenData[id].quantity,
  storageIndexes: () => Object.keys(tokenData).map((_, idx) => idx),
  storageIndex: (id: number) =>
    Object.keys(tokenData)
      .map((_, idx) => idx)
      .indexOf(id),
  getTotalPriceForPurchase: (ids: number[], amounts: number[]) => {
    return ids.reduce((sum: ethers.BigNumber, id, index) => {
      const price = tokenData[id].price.mul(amounts[index]);
      return price.add(sum);
    }, ethers.BigNumber.from(0));
  },
};

export const tokenBundles = {
  ids: () => Object.keys(tokenBundleData).map((i) => Number(i)),
  prices: () => Object.entries(tokenBundleData).map(([_, { price }]) => price),
  price: (id: number) => tokenBundleData[id].price,
  memberPrices: () =>
    Object.entries(tokenBundleData).map(([_, { memberPrice }]) => memberPrice),
  memberPrice: (id: number) => tokenBundleData[id].memberPrice,
  quantities: () =>
    Object.entries(tokenBundleData).map(([_, { quantity }]) => quantity),
  memberQuantity: (id: number) => tokenBundleData[id].quantity,
  storageIndexes: () => Object.keys(tokenBundleData).map((_, idx) => idx),
  storageIndex: (id: number) =>
    Object.keys(tokenBundleData)
      .map((_, idx) => idx)
      .indexOf(id),
  bundleSizes: () =>
    Object.entries(tokenBundleData).map(([_, { bundleSize }]) => bundleSize),
  bundleSize: (id: number) => tokenBundleData[id].bundleSize,
  tokenIdsInBundles: () =>
    Object.entries(tokenBundleData).map(
      ([_, { tokenIdsInBundle }]) => tokenIdsInBundle
    ),
  tokenIdsInBundle: (id: number) => tokenBundleData[id].tokenIdsInBundle,
  getTotalPriceForPurchase: (ids: number[], amounts: number[]) => {
    return ids.reduce((sum: ethers.BigNumber, id, index) => {
      const price = tokenBundleData[id].price.mul(amounts[index]);
      return price.add(sum);
    }, ethers.BigNumber.from(0));
  },
};
