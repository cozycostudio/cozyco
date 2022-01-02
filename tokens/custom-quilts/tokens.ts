import { ethers } from "ethers";

enum TokenTypes {
  Bundle = 1,
  Patch = 2,
  Background = 3,
  Accessory = 4,
  Effect = 5,
}

interface Token {
  metadata: string;
  tokenType: TokenTypes;
  price: ethers.BigNumber;
  memberPrice: ethers.BigNumber;
  quantity: number;
  metadataTokenAtIndex: number;
  memberExclusive: boolean;
}

type TokenRecord = Record<number, Token>;

export const tokenData: TokenRecord = {
  9000: {
    metadata: "",
    tokenType: TokenTypes.Patch,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    metadataTokenAtIndex: 0,
    memberExclusive: false,
  },
  9001: {
    metadata: "",
    tokenType: TokenTypes.Patch,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    metadataTokenAtIndex: 1,
    memberExclusive: false,
  },
  9002: {
    metadata: "",
    tokenType: TokenTypes.Patch,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    metadataTokenAtIndex: 2,
    memberExclusive: false,
  },
  9003: {
    metadata: "",
    tokenType: TokenTypes.Patch,
    price: ethers.utils.parseEther("0.02"),
    memberPrice: ethers.utils.parseEther("0.016"),
    quantity: 10,
    metadataTokenAtIndex: 3,
    memberExclusive: false,
  },
  9004: {
    metadata: "",
    tokenType: TokenTypes.Patch,
    price: ethers.utils.parseEther("0.02"),
    memberPrice: ethers.utils.parseEther("0.016"),
    quantity: 10,
    metadataTokenAtIndex: 4,
    memberExclusive: false,
  },
};

interface TokenBundle extends Token {
  bundleSize: number;
  tokenIdsInBundle: number[];
}

type TokenBundleRecord = Record<number, TokenBundle>;

export const tokenBundleData: TokenBundleRecord = {
  9005: {
    metadata: "",
    tokenType: TokenTypes.Bundle,
    price: ethers.utils.parseEther("0.1"),
    memberPrice: ethers.utils.parseEther("0.075"),
    quantity: 10,
    metadataTokenAtIndex: 0,
    bundleSize: 5,
    tokenIdsInBundle: [9000, 9001, 9002],
    memberExclusive: false,
  },
  9006: {
    metadata: "",
    tokenType: TokenTypes.Bundle,
    price: ethers.utils.parseEther("0.2"),
    memberPrice: ethers.utils.parseEther("0.15"),
    quantity: 20,
    metadataTokenAtIndex: 1,
    bundleSize: 10,
    tokenIdsInBundle: [9003, 9004],
    memberExclusive: false,
  },
};

export const tokens = {
  ids: () => Object.keys(tokenData).map((i) => Number(i)),
  tokenTypes: () =>
    Object.entries(tokenData).map(([_, { tokenType }]) => tokenType),
  tokenType: (id: number) => tokenData[id].tokenType,
  prices: () => Object.entries(tokenData).map(([_, { price }]) => price),
  price: (id: number) => tokenData[id].price,
  memberPrices: () =>
    Object.entries(tokenData).map(([_, { memberPrice }]) => memberPrice),
  memberPrice: (id: number) => tokenData[id].memberPrice,
  quantities: () =>
    Object.entries(tokenData).map(([_, { quantity }]) => quantity),
  metadataTokenAtIndexes: () =>
    Object.entries(tokenData).map(
      ([_, { metadataTokenAtIndex }]) => metadataTokenAtIndex
    ),
  metadataTokenAtIndex: (id: number) => tokenData[id].metadataTokenAtIndex,
  memberExclusives: () =>
    Object.entries(tokenData).map(
      ([_, { memberExclusive }]) => memberExclusive
    ),
  memberExclusive: (id: number) => tokenData[id].memberExclusive,
  getTotalPriceForPurchase: (ids: number[], amounts: number[]) => {
    return ids.reduce((sum: ethers.BigNumber, id, index) => {
      const price = tokenData[id].price.mul(amounts[index]);
      return price.add(sum);
    }, ethers.BigNumber.from(0));
  },
};

export const tokenBundles = {
  ids: () => Object.keys(tokenBundleData).map((i) => Number(i)),
  tokenTypes: () =>
    Object.entries(tokenBundleData).map(([_, { tokenType }]) => tokenType),
  tokenType: (id: number) => tokenBundleData[id].tokenType,
  prices: () => Object.entries(tokenBundleData).map(([_, { price }]) => price),
  price: (id: number) => tokenBundleData[id].price,
  memberPrices: () =>
    Object.entries(tokenBundleData).map(([_, { memberPrice }]) => memberPrice),
  memberPrice: (id: number) => tokenBundleData[id].memberPrice,
  quantities: () =>
    Object.entries(tokenBundleData).map(([_, { quantity }]) => quantity),
  metadataTokenAtIndexes: () =>
    Object.entries(tokenBundleData).map(
      ([_, { metadataTokenAtIndex }]) => metadataTokenAtIndex
    ),
  metadataTokenAtIndex: (id: number) =>
    tokenBundleData[id].metadataTokenAtIndex,
  memberExclusives: () =>
    Object.entries(tokenBundleData).map(
      ([_, { memberExclusive }]) => memberExclusive
    ),
  memberExclusive: (id: number) => tokenBundleData[id].memberExclusive,
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
