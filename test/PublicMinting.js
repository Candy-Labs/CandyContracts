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

describe("Public Minting", function () {

  it("Public Minting Disabled on Initialization", async function () {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract

    // Mint status should report false
    const mintStatus = await CandyCreator.mintStatus()
    expect(mintStatus).to.be.equal(false)

    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
      .mintingFee()

    // Attempting to mint should rever
    await expect(CandyCreator.connect(deployment.owner)
      .publicMint(1, {
        value: fee
      }))
      .to.be.revertedWith('MintingNotActive()');

  });

  it("Enable Minting", async function () {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract

    // Mint status should report false
    const oldStatus = await CandyCreator.mintStatus()
    expect(oldStatus).to.be.equal(false)

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    // Mint status should report true
    const newStatus = await CandyCreator.mintStatus()
    expect(newStatus).to.be.equal(true)

  });

  it("Disable Minting", async function () {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    // Mint status should report true
    const oldStatus = await CandyCreator.mintStatus()
    expect(oldStatus).to.be.equal(true)

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .disableMinting()

    // Mint status should report false
    const newStatus = await CandyCreator.mintStatus()
    expect(newStatus).to.be.equal(false)

  });


  it("Public Minting Requires Correct Payment", async function () {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
      .mintingFee()

    // Must send the correct amount of token 
    let badFee = 999

    await expect(CandyCreator.connect(deployment.owner)
      .publicMint(1, {
        value: badFee
      }))
      .to.be.revertedWith('WrongPayment()');

  });

  it("Public Minting Respects Max Limit", async function () {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract

    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
      .mintingFee()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    // Set a maximum number of public mints
    await CandyCreator.connect(deployment.owner)
      .setMaxPublicMints(2)

    // Valid number of tokens to mint in a public transaction 
    let okNumber = 2

    // Invalid number of tokens to mint in a public transaction 
    let badNumber = 3

    // Mint 1 token
    await CandyCreator.connect(deployment.owner)
      .publicMint(1, {
        value: (1 * fee).toString()
      });

    // Mint 2 tokens 
    await CandyCreator.connect(deployment.owner)
      .publicMint(okNumber, {
        value: (okNumber * fee).toString()
      });

    // You should not be allowed to mint more than the max public 
    // mint limit
    await expect(CandyCreator.connect(deployment.owner)
      .publicMint(badNumber, {
        value: (badNumber * fee).toString()
      }))
      .to.be.revertedWith('ExceedsMaxTransactionMints');

  });

  it("Public Minting Disabled when Whitelist Enabled", async function () {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract

    // Enable whitelist
    await CandyCreator.connect(deployment.owner)
      .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
      .enableMinting()

    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
      .mintingFee()

    await expect(CandyCreator.connect(deployment.owner)
      .publicMint(1, {
        value: 1 * fee
      }))
      .to.be.revertedWith('WhitelistRequired()');

  });

});
