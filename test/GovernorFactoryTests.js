const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Deploys a CandyGovernor factory 
async function deployGovernorFactory() {
  const CandyGovernorFactory = await ethers.getContractFactory("CandyGovernorCloneFactory");
  const FactoryDeployment = await CandyGovernorFactory.deploy();
  await FactoryDeployment.deployed();
  return FactoryDeployment;
}

// Deploys a CandyGovernor without using a factory contract
async function deployGovernorFromTokenNaive(tokenAddress) {
  const [owner] = await ethers.getSigners();
  const CandyGovernor = await ethers.getContractFactory("CandyGovernor");
  const CandyGovernorDeployment = await CandyGovernor.deploy(tokenAddress);
  await CandyGovernorDeployment.deployed();
  return CandyGovernorDeployment;
}

// Deploys a CandyGovernor using a factory contract 
async function deployGovernorFromToken(factoryContract, tokenAddress) {
  const [owner] = await ethers.getSigners();
  const newToken = await factoryContract.connect(owner).createGovernor(tokenAddress);
}

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
  const newToken = await factoryContract.connect(owner).callStatic.create721AVotes("TestToken", "TEST", "placeholder.json", 1000000000 * 1, 10000, "0x0000000000000000000000000000000000000000000000000000000000000000");
  return newToken;
}

describe("CandyGovernor Clone Factory", function () {

  // Basic Tests

  it("Should deploy factory", async function () {
    await deployGovernorFactory();
  });

  it("Should deploy governor from naive token using factory", async function () {
    // Naive token 
    const token = await deploy721AVotesTokenNaive();
    const factory = await deployGovernorFactory();
    await deployGovernorFromToken(factory, token.contract.address);
  });

  it("Should deploy governor from naive token without factory", async function () {
    // Naive token 
    const token = await deploy721AVotesTokenNaive();
    const factory = await deployGovernorFactory();
    await deployGovernorFromToken(factory, token.contract.address);
  });

  it("Should deploy governor from cloned token without factory", async function () {
    const tokenFactory = await deploy721AVotesFactory();
    const token = await deploy721AVotesToken(tokenFactory);
    await deployGovernorFromTokenNaive(token);
  });

  it("Should deploy governor from cloned token using factory", async function () {
    const tokenFactory = await deploy721AVotesFactory();
    const token = await deploy721AVotesToken(tokenFactory);
    const factory = await deployGovernorFactory();
    await deployGovernorFromToken(factory, token);
  });

  // Used to determine gas savings

  let TEST_LOOPS = 10

  it(`Should deploy ${TEST_LOOPS} governors on naive tokens using factory`, async function () {
    const token = await deploy721AVotesTokenNaive();
    const factory = await deployGovernorFactory();
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deployGovernorFromToken(factory, token.contract.address);
    }
  });

  it(`Should deploy ${TEST_LOOPS} governors on naive tokens without factory`, async function () {
    const token = await deploy721AVotesTokenNaive();
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deployGovernorFromTokenNaive(token.contract.address);
    }
  });

  it(`Should deploy ${TEST_LOOPS} governors on cloned tokens without factory`, async function () {
    const tokenFactory = await deploy721AVotesFactory();
    const token = await deploy721AVotesToken(tokenFactory);
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deployGovernorFromTokenNaive(token);
    }
  });

  it(`Should deploy ${TEST_LOOPS} governors on cloned tokens using factory`, async function () {
    const tokenFactory = await deploy721AVotesFactory();
    const token = await deploy721AVotesToken(tokenFactory);
    const factory = await deployGovernorFactory();
    for (var i = 0; i < TEST_LOOPS; i++) {
      await deployGovernorFromToken(factory, token);
    }
  });

});