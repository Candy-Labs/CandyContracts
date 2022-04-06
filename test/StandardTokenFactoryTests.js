const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Deploys a standard CandyCreator721A token factory 
async function deploy721AFactory() {
  const CandyCreator721AFactory = await ethers.getContractFactory("CandyCreator721ACloneFactory");
  const FactoryDeployment = await CandyCreator721AFactory.deploy();
  await FactoryDeployment.deployed();
  return FactoryDeployment
}

// Deploys a standard CandyCreator721A token without using a factory contract
async function deploy721ATokenNaive() {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreator721A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, true, [owner.address, royalty1.address], [5000, 4500], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, buyer1: buyer1, royalty1: royalty1 };
}

// Deploys a standard CandyCreator721A token using a factory contract 
async function deploy721AToken(factoryContract) {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const newToken = await factoryContract.connect(owner).create721A("TestToken", "TEST", "placeholder.json", 1000000000 * 1, 10000, "0x0000000000000000000000000000000000000000000000000000000000000000");
}

describe("CandyCreator721A Clone Factory", function () {

  // Basic Tests

  it("Should deploy factory", async function () {
    await deploy721AFactory();
  });

  it("Should deploy token without factory", async function () {
    await deploy721ATokenNaive();
  });

  it("Should deploy token using factory", async function () {
    const factory = await deploy721AFactory();
    await deploy721AToken(factory);
  });

  // Used to determine gas savings

  let TEST_LOOPS = 10

  it(`Should deploy ${TEST_LOOPS} tokens without using a factory`, async function () {
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deploy721ATokenNaive();
    }
  });

  it(`Should deploy ${TEST_LOOPS} tokens using a factory`, async function () {
    const factory = await deploy721AFactory();
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deploy721AToken(factory);
    }
  });

});