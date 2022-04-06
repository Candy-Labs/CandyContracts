const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Deploys a CandyCreator721A voting token factory 
async function deploy721AVotesFactory() {
  const CandyCreator721AVotesFactory = await ethers.getContractFactory("CandyCreator721AVotesCloneFactory");
  const FactoryDeployment = await CandyCreator721AVotesFactory.deploy();
  await FactoryDeployment.deployed();
  return FactoryDeployment
}

// Deploys a CandyCreator721A voting token without using a factory contract
async function deploy721AVotesTokenNaive() {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreator721AVotes");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, true, [owner.address, royalty1.address], [5000, 4500], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, buyer1: buyer1, royalty1: royalty1 };
}

// Deploys a CandyCreator721A voting token using a factory contract 
async function deploy721AVotesToken(factoryContract) {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const newToken = await factoryContract.connect(owner).create721AVotes("TestToken", "TEST", "placeholder.json", 1000000000 * 1, 10000, "0x0000000000000000000000000000000000000000000000000000000000000000");
}

describe("CandyCreator721AVotes Clone Factory", function () {

  // Basic Tests

  it("Should deploy factory", async function () {
    await deploy721AVotesFactory();
  });

  it("Should deploy token without factory", async function () {
    await deploy721AVotesTokenNaive();
  });

  it("Should deploy token using factory", async function () {
    const factory = await deploy721AVotesFactory();
    await deploy721AVotesToken(factory);
  });

  // Used to determine gas savings

  let TEST_LOOPS = 10

  it(`Should deploy ${TEST_LOOPS} tokens without using a factory`, async function () {
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deploy721AVotesTokenNaive();
    }
  });

  it(`Should deploy ${TEST_LOOPS} tokens using a factory`, async function () {
    const factory = await deploy721AVotesFactory();
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deploy721AVotesToken(factory);
    }
  });

});