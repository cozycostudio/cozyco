import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  CozyCoMembership,
  CozyCoQuiltSupplyStore,
  PatchesBlankData,
  QuiltMaker,
  QuiltMakerRenderer,
} from "typechain-types";
import {
  deployBlankPatches,
  deployCozyCoMembership,
  deployCozyCoQuiltSupplyStore,
  deployMembershipMetadata,
  deployQuiltMaker,
  deployQuiltMakerRenderer,
} from "./helpers/deployments";
import {
  blankPatchItems as patchItems,
  blankPatchBundles as patchBundles,
  makeArgsStockInSupplies,
  makeSKU,
  makeArgsStockInSuppliesBundle,
  getItemsTotalPrice,
} from "./helpers/mock-data";

describe("Custom quilts", () => {
  const zero = ethers.constants.AddressZero;
  let cozyCoQuiltSupplyStore: CozyCoQuiltSupplyStore;
  let cozyCoMembership: CozyCoMembership;
  let quiltMaker: QuiltMaker;
  let quiltMakerRenderer: QuiltMakerRenderer;
  let patchesBlankData: PatchesBlankData;
  let deployer: SignerWithAddress;
  let cozyCo: SignerWithAddress;
  let collaborator: SignerWithAddress;
  let customerPublic: SignerWithAddress;
  let customerMember: SignerWithAddress;

  beforeEach(async () => {
    [deployer, cozyCo, collaborator, customerPublic, customerMember] =
      await ethers.getSigners();

    cozyCoMembership = await deployCozyCoMembership();

    quiltMakerRenderer = await deployQuiltMakerRenderer();
    quiltMaker = await deployQuiltMaker(
      quiltMakerRenderer.address,
      cozyCoMembership.address
    );

    await quiltMakerRenderer.setQuiltMakerAddress(quiltMaker.address);

    cozyCoQuiltSupplyStore = await deployCozyCoQuiltSupplyStore(
      cozyCoMembership.address,
      quiltMaker.address
    );
    patchesBlankData = await deployBlankPatches();

    const storefrontId = await cozyCoQuiltSupplyStore.STOREFRONT_ID();
    await quiltMaker.setSupplyStoreAddress(
      storefrontId,
      cozyCoQuiltSupplyStore.address
    );

    await cozyCoQuiltSupplyStore.openToMembers();
    await cozyCoQuiltSupplyStore.openToPublic();

    const mm = await deployMembershipMetadata();
    await cozyCoMembership.addMembershipMetadataAddress(1, mm.address);
    await cozyCoMembership.issueMembership(customerMember.address, 1);
  });

  describe("CozyCoQuiltSupplyStore", () => {
    describe("Set up", () => {
      it("should set the owner", async () => {
        expect(await cozyCoQuiltSupplyStore.owner()).to.equal(deployer.address);
      });
    });

    describe("Stock management", () => {
      it("should stock in items", async () => {
        const itemsInput = makeArgsStockInSupplies(patchItems);
        const storefrontId = await cozyCoQuiltSupplyStore.STOREFRONT_ID();
        await cozyCoQuiltSupplyStore.stockInSupplies(
          ...itemsInput,
          cozyCo.address,
          patchesBlankData.address
        );

        for (let i = 0; i < patchItems.length; i++) {
          const item = await cozyCoQuiltSupplyStore.getItemTokenData(i + 1);
          const testItem = patchItems[i];
          const sku = makeSKU(
            storefrontId,
            0, // creatorId
            i + 1, // itemId
            testItem.itemType,
            testItem.itemWidth,
            testItem.itemHeight,
            testItem.metadataPartNumber,
            0
          );

          expect(item.sku).to.equal(sku);
          expect(item.price).to.equal(testItem.price);
          expect(item.memberPrice).to.equal(testItem.memberPrice);
          expect(item.memberExclusive).to.equal(testItem.memberExclusive);
          // We add one in the contract for gas saving so we need to add one to our source data
          expect(item.quantity).to.equal(testItem.quantity + 1);
        }
      });

      it("should stock in bundles", async () => {
        const bundleInput = makeArgsStockInSuppliesBundle(patchBundles[0]);
        const storefrontId = await cozyCoQuiltSupplyStore.STOREFRONT_ID();
        await cozyCoQuiltSupplyStore.stockInSuppliesBundle(
          ...bundleInput,
          cozyCo.address,
          patchesBlankData.address
        );

        const item = await cozyCoQuiltSupplyStore.getItemTokenData(1);
        const bundle = await cozyCoQuiltSupplyStore.getBundleTokenData(1);
        const testBundle = patchBundles[0];
        const sku = makeSKU(
          storefrontId,
          0, // creatorId
          1, // itemId
          testBundle.itemType,
          testBundle.itemWidth,
          testBundle.itemHeight,
          testBundle.metadataPartNumber,
          0
        );

        expect(item.sku).to.equal(sku);
        expect(item.price).to.equal(testBundle.price);
        expect(item.memberPrice).to.equal(testBundle.memberPrice);
        expect(item.memberExclusive).to.equal(testBundle.memberExclusive);
        // We add one in the contract for gas saving so we need to add one to our source data
        expect(item.quantity).to.equal(testBundle.quantity + 1);
        expect(bundle.size).to.equal(testBundle.size);
        expect(bundle.tokenIds).to.eql(
          testBundle.tokenIds.map((i) => BigNumber.from(i))
        );
        expect(bundle.rngWeights).to.eql(
          testBundle.rngWeights.map((i) => BigNumber.from(i))
        );
      });

      it("should only let the owner add supplies", async () => {
        const itemsInput = makeArgsStockInSupplies(patchItems);
        await expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .stockInSupplies(
              ...itemsInput,
              cozyCo.address,
              patchesBlankData.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should only let the owner add supply bundles", async () => {
        const bundleInput = makeArgsStockInSuppliesBundle(patchBundles[0]);
        await expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .stockInSuppliesBundle(
              ...bundleInput,
              cozyCo.address,
              patchesBlankData.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Purchasing", () => {
      beforeEach(async () => {
        const itemsInput = makeArgsStockInSupplies(patchItems);
        await cozyCoQuiltSupplyStore.stockInSupplies(
          ...itemsInput,
          cozyCo.address,
          patchesBlankData.address
        );
      });

      it("should allow tokens to be purchased", async () => {
        const ids = [1, 2, 3, 4];
        const amounts = [5, 5, 5, 5];
        expect(
          await cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSupplies(ids, amounts, {
              value: getItemsTotalPrice(patchItems, ids, amounts),
            })
        )
          .to.emit(cozyCoQuiltSupplyStore, "TransferBatch")
          .withArgs(
            customerPublic.address,
            zero,
            customerPublic.address,
            ids.map((i) => BigNumber.from(i)),
            amounts.map((i) => BigNumber.from(i))
          );
      });

      it("should allow tokens to be purchased as a member", async () => {
        const ids = [1, 2, 3, 4];
        const amounts = [5, 5, 5, 5];
        expect(
          await cozyCoQuiltSupplyStore
            .connect(customerMember)
            .purchaseSuppliesAsMember(1, ids, amounts, {
              value: getItemsTotalPrice(patchItems, ids, amounts, true),
            })
        )
          .to.emit(cozyCoQuiltSupplyStore, "TransferBatch")
          .withArgs(
            customerMember.address,
            zero,
            customerMember.address,
            ids.map((i) => BigNumber.from(i)),
            amounts.map((i) => BigNumber.from(i))
          );
      });

      it("should not allow purchasing over the max quantity", async () => {
        const ids = [1, 2, 3, 4];
        const amounts = [15, 15, 15, 15];
        await expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSupplies(ids, amounts, {
              value: getItemsTotalPrice(patchItems, ids, amounts),
            })
        ).to.be.revertedWith("OutOfStock()");
      });

      it("should not allow purchasing member tokens as a public customer", async () => {
        const ids = [1, 2, 3, 4];
        const amounts = [5, 5, 5, 5];
        await expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSuppliesAsMember(1, ids, amounts, {
              value: getItemsTotalPrice(patchItems, ids, amounts),
            })
        ).to.be.revertedWith("NotAuthorized()");
      });

      it("should not allow purchasing member exclusive tokens as a public customer", async () => {
        const ids = [5];
        const amounts = [1];
        await expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSupplies(ids, amounts, {
              value: getItemsTotalPrice(patchItems, ids, amounts),
            })
        ).to.be.revertedWith("MemberExclusive()");
      });
    });
  });

  describe("QuiltMakerRenderer", () => {
    beforeEach(async () => {
      const itemsInput = makeArgsStockInSupplies(patchItems);
      await cozyCoQuiltSupplyStore.stockInSupplies(
        ...itemsInput,
        cozyCo.address,
        patchesBlankData.address
      );
    });

    it("should render a quilt", async () => {
      const quilt = {
        name: ethers.utils.formatBytes32String("Cool quilt"),
        size: BigNumber.from(4).or(BigNumber.from(3).shl(128)),
        degradation: 0,
        supplySkus: [6, 2, 5, 0, 7, 1, 4].map((i) => {
          const patch = patchItems[i];
          return makeSKU(
            1,
            0,
            i + 1,
            patch.itemType,
            patch.itemWidth,
            patch.itemHeight,
            patch.metadataPartNumber,
            0
          );
        }),
        supplyCoords: [
          BigNumber.from(0).or(BigNumber.from(0).shl(128)),
          BigNumber.from(2).or(BigNumber.from(0).shl(128)),
          BigNumber.from(3).or(BigNumber.from(0).shl(128)),
          BigNumber.from(0).or(BigNumber.from(1).shl(128)),
          BigNumber.from(1).or(BigNumber.from(1).shl(128)),
          BigNumber.from(0).or(BigNumber.from(2).shl(128)),
          BigNumber.from(3).or(BigNumber.from(2).shl(128)),
        ],
      };

      const [tokenURI, gasUsed] = await quiltMakerRenderer.tokenURI(1, quilt);
      const decoded = Buffer.from(tokenURI.substring(29), "base64").toString();
      const token = JSON.parse(decoded);
      const svg = Buffer.from(token.image.substring(25), "base64").toString();
      console.log({ token, svg, gasUsed: gasUsed.toString() });
    });
  });
});
