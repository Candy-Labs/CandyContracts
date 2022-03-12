const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deploySingle() {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreatorV1A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, false, [], [], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2 };
}

async function deployMulti() {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreatorV1A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, true, [owner.address, royalty1.address], [5000, 4500], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2 };
}

describe("Owner Permissions", function () {

  it("onlyOwner can enable minting", async function () {
    const deployment = await deploySingle()
    CandyCreator = deployment.contract

    let initialMintStatus = await CandyCreator.mintStatus()
    expect(initialMintStatus).to.be.equal(false)

    await expect(
      CandyCreator.connect(deployment.candyWallet)
        .enableMinting()
    ).to.be.revertedWith("Owner: caller is not the Owner");

    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    let newMintStatus = await CandyCreator.mintStatus()
    expect(newMintStatus).to.be.equal(true)

  });

  it("onlyOwner can enable whitelist", async function () {
    const deployment = await deploySingle()
    CandyCreator = deployment.contract

    let initialWhitelistStatus = await CandyCreator.whitelistStatus()
    expect(initialWhitelistStatus).to.be.equal(false)

    await expect(
      CandyCreator.connect(deployment.candyWallet)
        .enableWhitelist()
    ).to.be.revertedWith("Owner: caller is not the Owner");

    await CandyCreator.connect(deployment.owner)
      .enableWhitelist()

    let newWhitelistStatus = await CandyCreator.whitelistStatus()
    expect(newWhitelistStatus).to.be.equal(true)

  });

  it("onlyOwner can release funds", async function () {
    const deployment = await deploySingle()
    CandyCreator = deployment.contract

    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
      .mintingFee()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    // Mint 1 token
    await CandyCreator.connect(deployment.owner)
      .publicMint(1, {
        value: (1 * fee).toString()
      });

    await expect(CandyCreator.connect(deployment.candyWallet).release())
      .to.be.revertedWith("Owner: caller is not the Owner");

    await CandyCreator.connect(deployment.owner).release()

  });

  it("onlyOwner can set a new mint price", async function () {
    const deployment = await deploySingle()
    CandyCreator = deployment.contract

    let initialFee = await CandyCreator.mintingFee()
    let newFee = initialFee * 10

    await expect(
      CandyCreator.connect(deployment.candyWallet)
        .setMintPrice(newFee)
    ).to.be.revertedWith("Owner: caller is not the Owner");

    await CandyCreator.connect(deployment.owner)
      .setMintPrice(newFee)

    let updatedFee = await CandyCreator.mintingFee()
    expect(updatedFee).to.be.equal(newFee)

  });

  it("onlyOwner can edit collection size", async function () {
    const deployment = await deploySingle()
    CandyCreator = deployment.contract

    let initialSize = await CandyCreator.collectionSize()
    let newSize = 10

    await expect(
      CandyCreator.connect(deployment.candyWallet)
        .setMintSize(newSize)
    ).to.be.revertedWith("Owner: caller is not the Owner");

    await CandyCreator.connect(deployment.owner)
      .setMintSize(newSize)

    let updatedSize = await CandyCreator.collectionSize()
    expect(updatedSize).to.be.equal(newSize)

  });


});
