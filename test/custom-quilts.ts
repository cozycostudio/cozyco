import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { tokens } from "../tokens/custom-quilts/tokens";

describe("Custom quilts", () => {
  let quiltStoreAdmin: Contract;
  let quiltStoreStockRoom: Contract;
  let patchesBlankData: Contract;
  let cozyCoMembership: Contract;
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

    const QuiltStoreStockRoom = await ethers.getContractFactory(
      "QuiltStoreStockRoom"
    );
    quiltStoreStockRoom = await QuiltStoreStockRoom.deploy();

    const QuiltStoreAdmin = await ethers.getContractFactory("QuiltStoreAdmin");
    quiltStoreAdmin = await QuiltStoreAdmin.deploy(
      quiltStoreStockRoom.address,
      cozyCoMembership.address
    );

    const PatchesBlankData = await ethers.getContractFactory(
      "PatchesBlankData"
    );
    patchesBlankData = await PatchesBlankData.deploy();

    await quiltStoreStockRoom.setStoreAdmin(quiltStoreAdmin.address);
    await quiltStoreAdmin.openStoreForMembers();
    await quiltStoreAdmin.openStoreForPublic();
  });

  describe("QuiltStoreAdmin", () => {
    describe("Purchasing", () => {
      beforeEach(async () => {
        await quiltStoreAdmin.addStock(
          tokens.ids(),
          tokens.prices(),
          tokens.memberPrices(),
          patchesBlankData.address,
          tokens.quantities(),
          tokens.storageIndexes()
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
          await quiltStoreAdmin
            .connect(customerPublic)
            .purchaseTokens(ids, amounts, {
              value: totalPrice,
            })
        )
          .to.emit(quiltStoreStockRoom, "TransferBatch")
          .withArgs(
            quiltStoreAdmin.address,
            ethers.constants.AddressZero,
            customerPublic.address,
            ids,
            amounts
          );

        console.log(
          await quiltStoreStockRoom.balanceOfBatch(
            ids.map((_) => customerPublic.address),
            ids
          )
        );

        // await quiltStoreAdmin
        //   .connect(customerPublic)
        //   .purchaseTokens(ids, amounts, {
        //     value: totalPrice,
        //   });

        // expect(
        //   await quiltStoreStockRoom.balanceOfBatch(
        //     ids.map((_) => addr1.address),
        //     ids
        //   )
        // ).to.eql([
        //   BigNumber.from(tokens[1].maxQuantity),
        //   BigNumber.from(tokens[2].maxQuantity),
        //   BigNumber.from(tokens[3].maxQuantity),
        // ]);
      });
    });
  });
});

// describe.skip("QuiltStoreStockRoom contract", () => {
//   let contract: Contract;
//   let patchesBlankData: Contract;
//   let deployer: SignerWithAddress;
//   let addr1: SignerWithAddress;
//   let addr2: SignerWithAddress;

//   beforeEach(async () => {
//     [deployer, addr1, addr2] = await ethers.getSigners();
//     const CozyCoMembership = await ethers.getContractFactory(
//       "CozyCoMembership"
//     );
//     const cozyCoMembership = await CozyCoMembership.deploy();
//     const PatchesBlankData = await ethers.getContractFactory(
//       "PatchesBlankData"
//     );
//     patchesBlankData = await PatchesBlankData.deploy();
//     const QuiltStoreStockRoom = await ethers.getContractFactory(
//       "QuiltStoreStockRoom"
//     );
//     contract = await QuiltStoreStockRoom.deploy();
//     const QuiltAssembly = await ethers.getContractFactory("QuiltAssembly");
//     const customQuilts = await QuiltAssembly.deploy(
//       cozyCoMembership.address,
//       contract.address
//     );
//     await contract.setCustomQuiltsAddress(customQuilts.address);
//     await contract.setMemberOpenState(true);
//     await contract.setPublicOpenState(true);
//   });

//   it("should set the correct deployer", async () => {
//     expect(await contract.deployer()).to.equal(deployer.address);
//   });

//   describe("Tokens", () => {
//     beforeEach(async () => {
//       await contract.addStock(
//         getIds("patch"),
//         patchesBlankData.address,
//         getQuantities("patch"),
//         getMetadataIndexes("patch")
//       );
//     });

//     it("should add new patches", async () => {
//       expect(await contract.getTokenMetadataAddress(1)).to.equal(
//         patchesBlankData.address
//       );
//       expect(await contract.getTokenMaxQuantity(1)).to.equal(
//         tokens[1].maxQuantity
//       );
//       expect(await contract.getTokenMaxQuantity(2)).to.equal(
//         tokens[2].maxQuantity
//       );
//     });

//     it("should allow purchasing of patches", async () => {
//       const ids = [1, 2, 3];
//       const amounts = [
//         tokens[1].maxQuantity,
//         tokens[2].maxQuantity,
//         tokens[3].maxQuantity,
//       ];
//       const totalPrice = getTotalPriceForPurchase("patch", ids, amounts);
//       expect(
//         await contract.purchaseTokens(ids, amounts, {
//           value: totalPrice,
//         })
//       )
//         .to.emit(contract, "TransferBatch")
//         .withArgs(
//           deployer.address,
//           ethers.constants.AddressZero,
//           deployer.address,
//           ids,
//           amounts
//         );
//       expect(
//         await contract.balanceOfBatch(
//           ids.map((_) => deployer.address),
//           ids
//         )
//       ).to.eql([
//         BigNumber.from(tokens[1].maxQuantity),
//         BigNumber.from(tokens[2].maxQuantity),
//         BigNumber.from(tokens[3].maxQuantity),
//       ]);
//     });

//     it("should not allow purchasing patches over the max quantity", async () => {
//       const ids = [1, 2, 3];
//       const amounts = [
//         tokens[1].maxQuantity + 5,
//         tokens[2].maxQuantity,
//         tokens[3].maxQuantity,
//       ];
//       const totalPrice = getTotalPriceForPurchase("patch", ids, amounts);
//       expect(
//         contract.purchaseTokens(ids, amounts, { value: totalPrice })
//       ).to.be.revertedWith("out of stock");
//     });
//   });

//   describe("Token bundle", () => {
//     beforeEach(async () => {
//       await contract.setTokenBundles(
//         getIds("bundle"),
//         patchesBlankData.address,
//         getMetadataIndexes("bundle"),
//         getPrices("bundle"),
//         getPackSizes(),
//         getQuantities("bundle"),
//         getPackTokenIds()
//       );
//     });

//     it("should add new token bundle", async () => {
//       expect(await contract.getTokenMetadataAddress(10)).to.equal(
//         patchesBlankData.address
//       );
//       expect(await contract.getTokenPrice(10)).to.equal(tokenBundles[10].price);
//       expect(await contract.getTokenPrice(11)).to.equal(tokenBundles[11].price);
//       expect(await contract.getTokenMaxQuantity(10)).to.equal(
//         tokenBundles[10].maxQuantity
//       );
//       expect(await contract.getTokenMaxQuantity(11)).to.equal(
//         tokenBundles[11].maxQuantity
//       );
//       expect(await contract.getTokenBundleSize(10)).to.equal(
//         tokenBundles[10].packSize
//       );
//       expect(await contract.getTokenBundleSize(11)).to.equal(
//         tokenBundles[11].packSize
//       );
//     });

//     it("should allow purchasing of token bundles", async () => {
//       const tokenIds = [10, 11];
//       const amounts = [
//         tokenBundles[10].maxQuantity,
//         tokenBundles[11].maxQuantity,
//       ];
//       const totalPrice = getTotalPriceForPurchase("bundle", tokenIds, amounts);
//       expect(
//         await contract.purchaseTokens(tokenIds, amounts, {
//           value: totalPrice,
//         })
//       )
//         .to.emit(contract, "TransferBatch")
//         .withArgs(
//           deployer.address,
//           ethers.constants.AddressZero,
//           deployer.address,
//           tokenIds,
//           amounts
//         );
//       expect(
//         await contract.balanceOfBatch(
//           tokenIds.map((_) => deployer.address),
//           tokenIds
//         )
//       ).to.eql([
//         BigNumber.from(tokenBundles[10].maxQuantity),
//         BigNumber.from(tokenBundles[11].maxQuantity),
//       ]);
//     });

//     it("should allow opening token bundle", async () => {
//       const tokenIds = [10, 11];
//       const amounts = [3, 3];
//       const totalPrice = getTotalPriceForPurchase("bundle", tokenIds, amounts);
//       await contract.purchaseTokens(tokenIds, amounts, {
//         value: totalPrice,
//       });

//       await contract.openTokenBundles(tokenIds, amounts);
//       expect(true).to.be.true;
//       console.log(await contract.balanceOf(deployer.address, 1));
//       console.log(await contract.balanceOf(deployer.address, 2));
//       console.log(await contract.balanceOf(deployer.address, 3));
//       console.log(await contract.balanceOf(deployer.address, 4));
//       console.log(await contract.balanceOf(deployer.address, 5));
//     });
//   });

//   it.skip("should handle membership discounts", async () => {
//     // await contract.addTokens(
//     //   tokenIds,
//     //   patchesBlankData.address,
//     //   tokenPrices,
//     //   tokenQuantities,
//     //   0
//     // );
//     await contract.setMemberDiscounts(1, [1, 2, 3], [5000, 3000, 1000]);
//     expect(await contract.getTokenMembershipDiscountBPS(1, 1)).to.equal(5000);
//     expect(await contract.getTokenMembershipDiscountBPS(2, 1)).to.equal(3000);
//     expect(await contract.getTokenMembershipDiscountBPS(3, 1)).to.equal(1000);
//   });
// });

// describe("PatchesBlankData contract", () => {
//   let contract: Contract;
//   let deployer: SignerWithAddress;
//   let addr1: SignerWithAddress;
//   let addr2: SignerWithAddress;

//   beforeEach(async () => {
//     [deployer, addr1, addr2] = await ethers.getSigners();
//     const PatchesBlankData = await ethers.getContractFactory(
//       "PatchesBlankData"
//     );
//     contract = await PatchesBlankData.deploy();
//   });

//   it("should return token patchesBlankData", async () => {
//     const token = await contract.tokenURI(0);
//     const decoded = Buffer.from(token.substring(29), "base64").toString();
//     const data = JSON.parse(decoded);
//     expect(data.name).to.equal("Blank patch #1");
//     expect(data.description).to.equal(
//       "A blank patch, perfect for filling in the gaps in a custom quilt."
//     );
//     // expect(data.attributes[0].value).to.equal("Single patch");
//     // expect(data.attributes[1].value).to.equal("Quilt Stitcher");
//     // expect(data.attributes[2].value).to.equal("Blanks");
//     // expect(data.attributes[3].value).to.equal("1x1");
//   });
// });

// describe.skip("QuiltAssembly contract", () => {
//   let contract: Contract;
//   let quiltStoreStockRoom: Contract;
//   let deployer: SignerWithAddress;
//   let addr1: SignerWithAddress;
//   let addr2: SignerWithAddress;

//   beforeEach(async () => {
//     [deployer, addr1, addr2] = await ethers.getSigners();
//     const CozyCoMembership = await ethers.getContractFactory(
//       "CozyCoMembership"
//     );
//     const cozyCoMembership = await CozyCoMembership.deploy();
//     const PatchesBlankData = await ethers.getContractFactory(
//       "PatchesBlankData"
//     );
//     const patchesBlankData = await PatchesBlankData.deploy();
//     const QuiltStoreStockRoom = await ethers.getContractFactory(
//       "QuiltStoreStockRoom"
//     );
//     quiltStoreStockRoom = await QuiltStoreStockRoom.deploy();
//     const QuiltAssembly = await ethers.getContractFactory("QuiltAssembly");
//     contract = await QuiltAssembly.deploy(
//       cozyCoMembership.address,
//       quiltStoreStockRoom.address
//     );
//     await quiltStoreStockRoom.setCustomQuiltsAddress(contract.address);
//     await quiltStoreStockRoom.setMemberOpenState(true);
//     await quiltStoreStockRoom.setPublicOpenState(true);
//     await quiltStoreStockRoom.setTokens(
//       getIds("patch"),
//       patchesBlankData.address,
//       getMetadataIndexes("patch"),
//       getPrices("patch"),
//       getQuantities("patch")
//     );
//     const ids = [1, 2, 3];
//     const amounts = [
//       tokens[1].maxQuantity,
//       tokens[2].maxQuantity,
//       tokens[3].maxQuantity,
//     ];
//     const totalPrice = getTotalPriceForPurchase("patch", ids, amounts);
//     await quiltStoreStockRoom.connect(addr1).purchaseTokens(ids, amounts, {
//       value: totalPrice,
//     });
//   });

//   it("should create a quilt", async () => {
//     const price = await contract.creationCost();
//     console.log(await quiltStoreStockRoom.balanceOf(addr1.address, 1));
//     console.log(await quiltStoreStockRoom.balanceOf(addr1.address, 2));
//     console.log(await quiltStoreStockRoom.balanceOf(addr1.address, 3));

//     await contract.connect(addr1).createQuilt([1, 2, 3], { value: price });

//     console.log(await quiltStoreStockRoom.balanceOf(addr1.address, 1));
//     console.log(await quiltStoreStockRoom.balanceOf(addr1.address, 2));
//     console.log(await quiltStoreStockRoom.balanceOf(addr1.address, 3));

//     expect(true).to.be.true;

//     console.log(await contract.connect(addr1).tokenURI(1));
//   });
// });
