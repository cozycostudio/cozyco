import { BigNumber, BigNumberish, ethers } from "ethers";

enum ItemTypes {
  Bundle = 0,
  Patch = 1,
  Background = 2,
  Accessory = 3,
  Effect = 4,
}

interface Item {
  itemType: ItemTypes;
  itemWidth: number;
  itemHeight: number;
  metadataPartNumber: number;
  price: ethers.BigNumber;
  memberPrice: ethers.BigNumber;
  quantity: number;
  memberExclusive: boolean;
}

interface Bundle extends Item {
  size: number;
  tokenIds: number[];
  rngWeights: number[];
}

interface Collection {
  id: string;
  name: string;
  creatorName: string;
  items: Item[];
  bundles: Bundle[];
}

export const blankPatchItems: Item[] = [
  {
    itemWidth: 1,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 1,
  },
  {
    itemWidth: 1,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 2,
  },
  {
    itemWidth: 1,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 3,
  },
  {
    itemWidth: 1,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 4,
  },
  {
    itemWidth: 1,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: true,
    metadataPartNumber: 5,
  },
  {
    itemWidth: 1,
    itemHeight: 2,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 25,
  },
  {
    itemWidth: 2,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 20,
  },
  {
    itemWidth: 2,
    itemHeight: 2,
    price: ethers.utils.parseEther("0.01"),
    memberPrice: ethers.utils.parseEther("0.008"),
    quantity: 10,
    memberExclusive: false,
    metadataPartNumber: 35,
  },
].map((i) => ({
  ...i,
  itemType: ItemTypes.Patch,
}));

export const blankPatchBundles: Bundle[] = [
  {
    itemWidth: 0,
    itemHeight: 0,
    price: ethers.utils.parseEther("0.04"),
    memberPrice: ethers.utils.parseEther("0.016"),
    quantity: 10,
    memberExclusive: false,
    size: 5,
    tokenIds: [1, 2, 3, 4],
    rngWeights: [100, 200, 250, 275],
  },
  {
    itemWidth: 1,
    itemHeight: 1,
    price: ethers.utils.parseEther("0.04"),
    memberPrice: ethers.utils.parseEther("0.04"),
    quantity: 10,
    memberExclusive: true,
    size: 10,
    tokenIds: [1, 2, 3, 4, 5],
    rngWeights: [100, 200, 100, 100],
  },
].map((i, idx) => ({
  ...i,
  itemType: ItemTypes.Bundle,
  metadataPartNumber: idx + 1,
}));

export const blankPatchCollection: Collection = {
  id: "blank-patches",
  name: "Blanks",
  creatorName: "Quilt Stitcher",
  items: blankPatchItems,
  bundles: blankPatchBundles,
};

export function makeSKU(
  storefrontId: BigNumberish,
  creatorId: number,
  itemId: number,
  itemType: number,
  itemWidth: number,
  itemHeight: number,
  metadataPartNumber: number,
  metadataAddrIndex: number
) {
  const sku = BigNumber.from(0);
  return sku
    .or(BigNumber.from(storefrontId).shl(0))
    .or(BigNumber.from(creatorId).shl(16))
    .or(BigNumber.from(itemId).shl(32))
    .or(BigNumber.from(itemType).shl(96))
    .or(BigNumber.from(itemWidth).shl(128))
    .or(BigNumber.from(itemHeight).shl(160))
    .or(BigNumber.from(metadataPartNumber).shl(192))
    .or(BigNumber.from(metadataAddrIndex).shl(224));
}

export function makeArgsStockInSupplies(
  items: Item[]
): [
  number[],
  number[],
  number[],
  number[],
  ethers.BigNumber[],
  ethers.BigNumber[],
  number[],
  boolean[]
] {
  return [
    items.map((i) => i.itemType),
    items.map((i) => i.itemWidth),
    items.map((i) => i.itemHeight),
    items.map((i) => i.metadataPartNumber),
    items.map((i) => i.price),
    items.map((i) => i.memberPrice),
    items.map((i) => i.quantity),
    items.map((i) => i.memberExclusive),
  ];
}

export function getItemsTotalPrice(
  items: Item[],
  ids: number[],
  amounts: number[],
  useMemberPrice?: boolean
) {
  const filteredItems = items.filter((_, idx) => ids.includes(idx + 1));
  return filteredItems.reduce((sum, item, idx) => {
    return sum.add(
      useMemberPrice
        ? item.memberPrice.mul(amounts[idx])
        : item.price.mul(amounts[idx])
    );
  }, ethers.BigNumber.from(0));
}

export function makeArgsStockInSuppliesBundle(bundle: Bundle): [
  number,
  BigNumberish,
  BigNumberish,
  number,
  boolean,
  {
    size: BigNumberish;
    tokenIds: BigNumberish[];
    rngWeights: BigNumberish[];
  }
] {
  return [
    bundle.metadataPartNumber,
    bundle.price,
    bundle.memberPrice,
    bundle.quantity,
    bundle.memberExclusive,
    bundle,
  ];
}
