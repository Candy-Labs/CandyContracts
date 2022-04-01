const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const creatorAbi = require('../artifacts/contracts/CandyCreator721AVotes.sol/CandyCreator721AVotes.json');

// Deploys a single creator CandyCreatorV1A ERC721A NFT Token contract
async function deploySingle() {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreator721AVotes");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, false, [], [], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, buyer1: buyer1, royalty1: royalty1 };
}
/*
// Deploys a Governor
async function deployGovernor(nftToken) {
    const [owner] = await ethers.getSigners();
    const CandyGovernorFactory = await ethers.getContractFactory("CandyGovernor");
    const CandyGovernor = await CandyGovernorFactory.deploy(nftToken)
    await CandyGovernor.deployed()
    return { contract: CandyGovernor, owner: owner }
}
*/

async function deployGovernorFactory() {
    const [owner] = await ethers.getSigners();
    const CandyGovernorFactory = await ethers.getContractFactory("CandyGovernorSimpleFactory");
    const FactoryDeployment = await CandyGovernorFactory.deploy()
    await FactoryDeployment.deployed()
    return { contract: FactoryDeployment, owner: owner }
}

describe("Refund Tests", function () {

  it("Pass a proposal and activate refund", async function () {
    // Deploy CandyCreator ERC721A NFT Token contract 
    const CandyCreatorDeployment = await deploySingle()
    const CandyCreatorContract = CandyCreatorDeployment.contract

    // Deploy the Candy Governor Simple Factory
    const govFactory = await deployGovernorFactory()

    // Create a Governor using the Simple Factory and the previously created token 
    const newGovernor = await govFactory.contract.connect(govFactory.owner).createGovernor(CandyCreatorContract.address)
    console.log(newGovernor)

  });

});