const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Deploys a standard CandyCreator721A token factory 
async function deploy721AFactory(candyWallet) {
  const CandyCreator721AFactory = await ethers.getContractFactory("CandyCreator721ACloneFactory");
  const FactoryDeployment = await CandyCreator721AFactory.deploy();
  await FactoryDeployment.deployed();
  return FactoryDeployment
}

// Deploys a standard CandyCreator721A token using a factory contract 
async function deploy721AToken(factoryContract) {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const newToken = await factoryContract.connect(owner).create721A("TestToken", "TEST", "placeholder.json", 1000000000 * 1, 10000, [owner.address, royalty1.address], [5000, 4500], "0x0000000000000000000000000000000000000000000000000000000000000000", 1, 1);
}


describe("CandyCreator721A Clone Factory", function () {

  // Basic Tests

  it("Should deploy factory", async function () {
    const [_, candyWallet] = await ethers.getSigners();
    await deploy721AFactory(candyWallet.address);
  });


  it("Should deploy token using factory", async function () {
    const [_, candyWallet] = await ethers.getSigners();
    const factory = await deploy721AFactory(candyWallet.address);
    await deploy721AToken(factory);
  });

  // Used to determine gas savings

  let TEST_LOOPS = 100

  it(`Should deploy ${TEST_LOOPS} tokens using a factory`, async function () {
    const [_, candyWallet] = await ethers.getSigners();
    const factory = await deploy721AFactory(candyWallet.address);
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deploy721AToken(factory);
    }
  });

});