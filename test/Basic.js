const { expect } = require("chai");
const { ethers } = require("hardhat");
const tokenArtifact = require('../artifacts/contracts/candy-contracts-cloneable/Base/Token/CandyCreator721AUpgradeable.sol/CandyCreator721AUpgradeable.json');

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

// Deploys a standard CandyCreator721A token factory 
async function deploy721AFactory() {
  const CandyCreator721AFactory = await ethers.getContractFactory("CandyCreator721ACloneFactory");
  const FactoryDeployment = await CandyCreator721AFactory.deploy();
  await FactoryDeployment.deployed();
  return FactoryDeployment
}

// MAIN

// Deploys a standard CandyCreator721A token using a factory contract 
async function deploy721ATokenSingle(factoryContract) {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const newToken = await factoryContract.connect(owner).callStatic.create721A("TestToken", "TEST", "placeholder.json", 1000000000 * 1, 10000, candyWallet.address, false, [owner.address, royalty1.address], [5000, 4500], "0x0000000000000000000000000000000000000000000000000000000000000000");
  return newToken
}

// Deploys a standard CandyCreator721A token using a factory contract 
async function deploy721ATokenMulti(factoryContract) {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const newToken = await factoryContract.connect(owner).callStatic.create721A("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, true, [owner.address, royalty1.address], [5000, 4500], "0x0000000000000000000000000000000000000000000000000000000000000000");
  return newToken
}

// Deploy both a factory and token (single creator with no split)
async function deployFactoryAndTokenSingle() {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const factory = await deploy721AFactory();
  const newTokenAddress = deploy721ATokenSingle(factory);
  const newToken = new ethers.Contract(newTokenAddress, tokenArtifact.abi, owner);
  return { contract: newToken, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2 };
}

// Deploy both a factory and token (multi-creator with split)
async function deployFactoryAndTokenMulti() {
  const factory = await deploy721AFactory();
  const newTokenAddress = deploy721ATokenMulti(factory);
  const newToken = new ethers.Contract(newTokenAddress, tokenArtifact.abi, owner);
  return { contract: newToken, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2 };
}

describe("Basic Tests", function () {

  it("Single Creator Deployment", async function () {

    const deployment = await deployFactoryAndTokenSingle()
    const CandyCreator = deployment.contract

    // Ensure the candyWallet address is the first payee in list
    const payee0 = await CandyCreator.payee(0)
    expect(deployment.candyWallet.address).to.equal(payee0)

    const totalShares = await CandyCreator.totalShares()
    const totalSupply = await CandyCreator.totalSupply()
    const revealTimestamp = await CandyCreator.totalSupply()
    const mintStatus = await CandyCreator.mintStatus()
    const whitelistStatus = await CandyCreator.whitelistStatus()

    // Should be enforced by contract but is not 
    expect(totalShares).to.equal(10000)

    expect(totalSupply).to.equal(0)
    expect(mintStatus).to.equal(false)
    expect(whitelistStatus).to.equal(false)

  });

  it("Multiple Creator Deployment", async function () {

    const deployment = await deployFactoryAndTokenMulti()
    const CandyCreator = deployment.contract

    // Ensure the candyWallet address is the first payee in list
    const payee0 = await CandyCreator.payee(0)
    expect(deployment.candyWallet.address).to.equal(payee0)

    // Ensure the owner is the second address in the list (THIS ISNT FORCED BY CONTRACT)
    // For flexibility reasons we allow the contract deployer to be paid at a different address
    const payee1 = await CandyCreator.payee(1)
    expect(deployment.owner.address).to.equal(payee1)

    const totalShares = await CandyCreator.totalShares()
    const totalSupply = await CandyCreator.totalSupply()
    const revealTimestamp = await CandyCreator.totalSupply()
    const mintStatus = await CandyCreator.mintStatus()
    const whitelistStatus = await CandyCreator.whitelistStatus()

    // Should be enforced by contract but is not 
    expect(totalShares).to.equal(10000)

    expect(totalSupply).to.equal(0)
    expect(mintStatus).to.equal(false)
    expect(whitelistStatus).to.equal(false)

  });

});
