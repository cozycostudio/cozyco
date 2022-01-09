import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { tokenBundles, tokens } from "../tokens/custom-quilts/tokens";

describe("Custom quilts", () => {
  let cozyCoQuiltSupplyStore: Contract;
  let cozyCoMembership: Contract;
  let quiltMaker: Contract;
  let quiltMakerRenderer: Contract;
  let patchesBlankData: Contract;
  let deployer: SignerWithAddress;
  let cozyCo: SignerWithAddress;
  let collaborator: SignerWithAddress;
  let customerPublic: SignerWithAddress;
  let customerMember: SignerWithAddress;

  beforeEach(async () => {
    [deployer, cozyCo, collaborator, customerPublic, customerMember] =
      await ethers.getSigners();

    const CozyCoMembership = await ethers.getContractFactory(
      "CozyCoMembership"
    );
    cozyCoMembership = await CozyCoMembership.deploy();

    const CozyCoQuiltSupplyStore = await ethers.getContractFactory(
      "CozyCoQuiltSupplyStore"
    );
    cozyCoQuiltSupplyStore = await CozyCoQuiltSupplyStore.deploy(
      cozyCoMembership.address
    );

    const QuiltMakerRenderer = await ethers.getContractFactory(
      "QuiltMakerRenderer"
    );
    quiltMakerRenderer = await QuiltMakerRenderer.deploy();

    const QuiltMaker = await ethers.getContractFactory("QuiltMaker");
    quiltMaker = await QuiltMaker.deploy(
      cozyCoQuiltSupplyStore.address,
      cozyCoMembership.address,
      quiltMakerRenderer.address
    );

    const PatchesBlankData = await ethers.getContractFactory(
      "PatchesBlankData"
    );
    patchesBlankData = await PatchesBlankData.deploy();

    await cozyCoQuiltSupplyStore.setQuiltMakerAddress(quiltMaker.address);
    await cozyCoQuiltSupplyStore.openToMembers();
    await cozyCoQuiltSupplyStore.openToPublic();

    const MembershipMetadata = await ethers.getContractFactory(
      "CCMFriendsOfMetadata"
    );
    const mm = await MembershipMetadata.deploy("", "", "");
    await cozyCoMembership.addMembershipMetadataAddress(1, mm.address);
    await cozyCoMembership.issueMembership(customerMember.address, 1);
  });

  describe.only("CozyCoQuiltSupplyStore", () => {
    describe("Set up", () => {
      it("should set the owner", async () => {
        expect(await cozyCoQuiltSupplyStore.owner()).to.equal(deployer.address);
      });
    });

    describe("Stock", () => {
      it("should add new tokens", async () => {
        await cozyCoQuiltSupplyStore.stockInSupplies(
          tokens.ids(),
          patchesBlankData.address,
          tokens.tokenTypes(),
          tokens.prices(),
          tokens.memberPrices(),
          tokens.quantities(),
          tokens.metadataTokenAtIndexes(),
          tokens.memberExclusives()
        );

        for (const id of tokens.ids()) {
          expect(
            await cozyCoQuiltSupplyStore.getItemMetadataAddress(id)
          ).to.equal(patchesBlankData.address);
          expect(await cozyCoQuiltSupplyStore.getItemMaxStock(id)).to.equal(
            tokens.quantity(id)
          );
        }
      });

      it("should only let the owner add new tokens", async () => {
        expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .stockInSupplies(
              tokens.ids(),
              patchesBlankData.address,
              tokens.tokenTypes(),
              tokens.prices(),
              tokens.memberPrices(),
              tokens.quantities(),
              tokens.metadataTokenAtIndexes(),
              tokens.memberExclusives()
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should add new token bundles", async () => {
        await cozyCoQuiltSupplyStore.stockInBundledSupplies(
          tokenBundles.ids(),
          patchesBlankData.address,
          tokenBundles.tokenTypes(),
          tokenBundles.prices(),
          tokenBundles.memberPrices(),
          tokenBundles.quantities(),
          tokenBundles.metadataTokenAtIndexes(),
          tokenBundles.memberExclusives(),
          tokenBundles.bundleSizes(),
          tokenBundles.tokenIdsInBundles(),
          tokenBundles.allCumulativeTokenIdWeights()
        );

        for (const id of tokenBundles.ids()) {
          expect(
            await cozyCoQuiltSupplyStore.getItemMetadataAddress(id)
          ).to.equal(patchesBlankData.address);
          expect(await cozyCoQuiltSupplyStore.getItemMaxStock(id)).to.equal(
            tokenBundles.quantity(id)
          );
        }
      });

      it("should only let the owner add new token bundles", async () => {
        expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .stockInBundledSupplies(
              tokenBundles.ids(),
              patchesBlankData.address,
              tokenBundles.tokenTypes(),
              tokenBundles.prices(),
              tokenBundles.memberPrices(),
              tokenBundles.quantities(),
              tokenBundles.metadataTokenAtIndexes(),
              tokenBundles.memberExclusives(),
              tokenBundles.bundleSizes(),
              tokenBundles.tokenIdsInBundles(),
              tokenBundles.allCumulativeTokenIdWeights()
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Purchasing", () => {
      beforeEach(async () => {
        await cozyCoQuiltSupplyStore.stockInSupplies(
          tokens.ids(),
          patchesBlankData.address,
          tokens.tokenTypes(),
          tokens.prices(),
          tokens.memberPrices(),
          tokens.quantities(),
          tokens.metadataTokenAtIndexes(),
          tokens.memberExclusives()
        );
      });

      it("should allow purchasing of tokens", async () => {
        const ids = tokens.ids().slice(0, 5);
        const amounts = tokens
          .quantities()
          .slice(0, 5)
          .map((_) => 1);
        const totalPrice = tokens.getTotalPriceForPurchase(ids, amounts);

        expect(
          await cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSupplies(ids, amounts, {
              value: totalPrice,
            })
        )
          .to.emit(cozyCoQuiltSupplyStore, "TransferBatch")
          .withArgs(
            customerPublic.address,
            ethers.constants.AddressZero,
            customerPublic.address,
            ids,
            amounts
          );

        expect(
          await cozyCoQuiltSupplyStore.balanceOfBatch(
            ids.map((_) => customerPublic.address),
            ids
          )
        ).to.eql(amounts.map((i) => BigNumber.from(i)));

        for (const id of ids) {
          expect(await cozyCoQuiltSupplyStore.getUnitsSold(id)).to.eql([
            BigNumber.from(1),
            BigNumber.from(0),
            BigNumber.from(1),
          ]);
        }

        await cozyCoQuiltSupplyStore
          .connect(customerPublic)
          .purchaseSupplies(ids, amounts, {
            value: totalPrice,
          });

        expect(
          await cozyCoQuiltSupplyStore.balanceOfBatch(
            ids.map((_) => customerPublic.address),
            ids
          )
        ).to.eql(amounts.map((i, idx) => BigNumber.from(i + amounts[idx])));

        for (const id of ids) {
          expect(await cozyCoQuiltSupplyStore.getUnitsSold(id)).to.eql([
            BigNumber.from(2),
            BigNumber.from(0),
            BigNumber.from(2),
          ]);
        }
      });

      it("should not allow purchasing of tokens over the max quantity", async () => {
        const ids = tokens.ids().slice(0, 5);
        const amounts = tokens
          .quantities()
          .slice(0, 5)
          .map((i) => i + 1);
        const totalPrice = tokens.getTotalPriceForPurchase(ids, amounts);

        expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSupplies(ids, amounts, {
              value: totalPrice,
            })
        ).to.be.revertedWith("OutOfStock()");
      });

      it("should not allow public purchasing of member exclusives", async () => {
        const ids = tokens.ids();
        const amounts = tokens.quantities().map((_) => 1);
        const totalPrice = tokens.getTotalMemberPriceForPurchase(ids, amounts);
        expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSupplies(ids, amounts, {
              value: totalPrice,
            })
        ).to.be.revertedWith("MemberExclusive()");
      });

      it("should allow purchasing of tokens as a member", async () => {
        const ids = tokens.ids();
        const amounts = tokens.quantities().map((_) => 1);
        const totalPrice = tokens.getTotalMemberPriceForPurchase(ids, amounts);

        expect(
          await cozyCoQuiltSupplyStore
            .connect(customerMember)
            .purchaseSuppliesAsMember(1, ids, amounts, {
              value: totalPrice,
            })
        )
          .to.emit(cozyCoQuiltSupplyStore, "TransferBatch")
          .withArgs(
            customerMember.address,
            ethers.constants.AddressZero,
            customerMember.address,
            ids,
            amounts
          );

        expect(
          await cozyCoQuiltSupplyStore.balanceOfBatch(
            ids.map((_) => customerMember.address),
            ids
          )
        ).to.eql(amounts.map((i) => BigNumber.from(i)));

        for (const id of ids) {
          expect(await cozyCoQuiltSupplyStore.getUnitsSold(id)).to.eql([
            BigNumber.from(0),
            BigNumber.from(1),
            BigNumber.from(1),
          ]);
        }
      });

      it("should not allow public purchasing of tokens as a member", async () => {
        const ids = tokens.ids().slice(0, 5);
        const amounts = tokens
          .quantities()
          .slice(0, 5)
          .map((_) => 1);
        const totalPrice = tokens.getTotalMemberPriceForPurchase(ids, amounts);

        expect(
          cozyCoQuiltSupplyStore
            .connect(customerPublic)
            .purchaseSuppliesAsMember(1, ids, amounts, {
              value: totalPrice,
            })
        ).to.be.revertedWith("NotAuthorized()");
      });
    });

    describe("Bundles", () => {
      beforeEach(async () => {
        await cozyCoQuiltSupplyStore.stockInBundledSupplies(
          tokenBundles.ids(),
          patchesBlankData.address,
          tokenBundles.tokenTypes(),
          tokenBundles.prices(),
          tokenBundles.memberPrices(),
          tokenBundles.quantities(),
          tokenBundles.metadataTokenAtIndexes(),
          tokenBundles.memberExclusives(),
          tokenBundles.bundleSizes(),
          tokenBundles.tokenIdsInBundles(),
          tokenBundles.allCumulativeTokenIdWeights()
        );

        const ids = tokenBundles.ids().slice(0, 5);
        const amounts = tokenBundles
          .quantities()
          .slice(0, 5)
          .map((_) => 1);
        const totalPrice = tokenBundles.getTotalPriceForPurchase(ids, amounts);

        await cozyCoQuiltSupplyStore
          .connect(customerPublic)
          .purchaseSupplies(ids, amounts, {
            value: totalPrice,
          });
      });

      it("should allow opening of bundles", async () => {
        const ids = tokenBundles.ids();
        const amounts = tokenBundles.quantities().map(() => 1);

        expect(
          await cozyCoQuiltSupplyStore.balanceOfBatch(
            ids.map((_) => customerPublic.address),
            ids
          )
        ).to.eql(amounts.map((i) => BigNumber.from(i)));

        await cozyCoQuiltSupplyStore
          .connect(customerPublic)
          .openSuppliesBundles(ids, amounts);

        const balances = await cozyCoQuiltSupplyStore.balanceOfBatch(
          tokens.ids().map((_) => customerPublic.address),
          tokens.ids()
        );

        expect(
          balances.reduce((sum: BigNumber, bal: BigNumber) => {
            return sum.add(bal);
          }, BigNumber.from(0))
        ).to.equal(tokenBundles.bundleSizes().reduce((sum, i) => sum + i));

        expect(
          await cozyCoQuiltSupplyStore.balanceOfBatch(
            ids.map((_) => customerPublic.address),
            ids
          )
        ).to.eql(amounts.map(() => BigNumber.from(0)));
      });
    });

    describe("Creators", () => {
      beforeEach(async () => {
        await cozyCoQuiltSupplyStore.stockInSupplies(
          tokens.ids(),
          patchesBlankData.address,
          tokens.tokenTypes(),
          tokens.prices(),
          tokens.memberPrices(),
          tokens.quantities(),
          tokens.metadataTokenAtIndexes(),
          tokens.memberExclusives()
        );
      });

      it("should add creators for payments", async () => {
        await cozyCoQuiltSupplyStore.addCreatorPayments(
          [cozyCo.address, collaborator.address],
          [1000, 9000],
          tokens.ids()
        );

        expect(
          await cozyCoQuiltSupplyStore.getCreatorShareForTokenIds(
            cozyCo.address,
            tokens.ids()
          )
        ).to.eql(tokens.ids().map(() => BigNumber.from(1000)));
      });

      it("should allow creators to withdraw funds", async () => {
        await cozyCoQuiltSupplyStore.addCreatorPayments(
          [cozyCo.address, collaborator.address],
          [1000, 9000],
          tokens.ids()
        );

        const ids = tokens.ids().slice(0, 5);
        const amounts = tokens
          .quantities()
          .slice(0, 5)
          .map((_) => 1);
        const totalPrice = tokens.getTotalPriceForPurchase(ids, amounts);

        await cozyCoQuiltSupplyStore
          .connect(customerPublic)
          .purchaseSupplies(ids, amounts, {
            value: totalPrice,
          });

        expect(
          await cozyCoQuiltSupplyStore
            .connect(collaborator)
            .creatorBatchWithdraw(tokens.ids())
        )
          .to.emit(cozyCoQuiltSupplyStore, "CreatorPaid")
          .withArgs(collaborator.address, totalPrice.mul(9000).div(10000));
      });
    });
  });

  describe("QuiltMaker", () => {
    it("should validate a layout", async () => {
      const patches = [
        [0, 0, 1, 1],
        [1, 0, 1, 1],
        [2, 0, 1, 1],
        [3, 0, 1, 1],
        [4, 0, 1, 1],
        [5, 0, 1, 1],
        [0, 1, 1, 1],
        [1, 1, 1, 1],
        [2, 1, 1, 1],
        [3, 1, 1, 1],
        [4, 1, 1, 1],
        [5, 1, 1, 1],
        [0, 2, 1, 1],
        [1, 2, 1, 1],
        [2, 2, 1, 1],
        [3, 2, 1, 1],
        [4, 2, 1, 1],
        [5, 2, 1, 1],
        [0, 3, 1, 1],
        [1, 3, 1, 1],
        [2, 3, 1, 1],
        [3, 3, 1, 1],
        [4, 3, 1, 1],
        [5, 3, 1, 1],
        [0, 4, 1, 1],
        [1, 4, 1, 1],
        [2, 4, 1, 1],
        [3, 4, 1, 1],
        [4, 4, 1, 1],
        [5, 4, 1, 1],
        [0, 5, 1, 1],
        [1, 5, 1, 1],
        [2, 5, 1, 1],
        [3, 5, 1, 1],
        [4, 5, 1, 1],
        [5, 5, 1, 1],
      ].map(([x, y, w, h]) => {
        const xBit = BigNumber.from(x);
        return xBit
          .or(BigNumber.from(y).shl(64))
          .or(BigNumber.from(w).shl(128))
          .or(BigNumber.from(h).shl(192));
      });
      const w = BigNumber.from(6);
      const h = BigNumber.from(6).shl(128);
      const size = w.or(h);
      await quiltMaker.createQuilt(size, patches, {
        value: ethers.utils.parseEther("0.08"),
      });
      expect(true).to.be.true;
    });

    it.skip("should set up the max stock", async () => {
      expect(await quiltMaker.getMaxStock(2, 2)).to.equal(50);
      expect(await quiltMaker.getMaxStock(2, 2)).to.equal(50);
    });
  });

  describe("QuiltMakerRenderer", () => {
    it("should validate a layout", async () => {
      const patches = [
        [0, 0, 1, 1],
        [1, 0, 1, 1],
        [2, 0, 1, 1],
        [3, 0, 1, 1],
        [4, 0, 1, 1],
        [5, 0, 1, 1],
        [0, 1, 1, 1],
        [1, 1, 1, 1],
        [2, 1, 1, 1],
        [3, 1, 1, 1],
        [4, 1, 1, 1],
        [5, 1, 1, 1],
        [0, 2, 1, 1],
        [1, 2, 1, 1],
        [2, 2, 1, 1],
        [3, 2, 1, 1],
        [4, 2, 1, 1],
        [5, 2, 1, 1],
        [0, 3, 1, 1],
        [1, 3, 1, 1],
        [2, 3, 1, 1],
        [3, 3, 1, 1],
        [4, 3, 1, 1],
        [5, 3, 1, 1],
        [0, 4, 1, 1],
        [1, 4, 1, 1],
        [2, 4, 1, 1],
        [3, 4, 1, 1],
        [4, 4, 1, 1],
        [5, 4, 1, 1],
        [0, 5, 1, 1],
        [1, 5, 1, 1],
        [2, 5, 1, 1],
        [3, 5, 1, 1],
        [4, 5, 1, 1],
        [5, 5, 1, 1],
      ].map(([x, y, w, h]) => {
        const xBit = BigNumber.from(x);
        return xBit
          .or(BigNumber.from(y).shl(64))
          .or(BigNumber.from(w).shl(128))
          .or(BigNumber.from(h).shl(192));
      });
      const w = BigNumber.from(6);
      const h = BigNumber.from(6).shl(128);
      const size = w.or(h);
      expect(await quiltMakerRenderer.validatePatchLayout(size, patches)).to.be
        .true;
    });
  });
});
