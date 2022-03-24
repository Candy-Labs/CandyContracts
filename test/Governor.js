const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deploySingle() {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreatorV1A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, false, [], [], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2 };
}

async function deployGovernor(nftToken) {
    const [owner] = await ethers.getSigners();
    const CandyGovernorFactory = await ethers.getContractFactory("CandyGovernor");
    const CandyGovernor = await CandyGovernorFactory.deploy(nftToken)
    await CandyGovernor.deployed()
    return { contract: CandyGovernor, owner: owner }
}

describe("Governor Tests", function () {

  it("Deploy Token and Governor", async function () {

    const CandyCreatorDeployment = await deploySingle()
    const CandyCreatorContract = CandyCreatorDeployment.contract
    const CandyCreatorOwner = CandyCreatorDeployment.owner

    const CandyGovernorDeployment = await deployGovernor(CandyCreatorContract.address)
    const CandyGovernorContract = CandyGovernorDeployment.contract
    const CandyGovernorOwner = CandyGovernorDeployment.owner 

    const token = await ethers.getContractAt('CandyCreatorV1A', CandyCreatorContract.address);
    const releaseCalldata = token.interface.encodeFunctionData('release', []);

    const proposal = await CandyGovernorContract.connect(CandyGovernorOwner).propose(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      "Release funds to project creator",
    );

    const descriptionHash = ethers.utils.id("Release funds to project creator")

    const hashedProposal = await CandyGovernorContract.connect(CandyGovernorOwner).hashProposal(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      descriptionHash
    )

    const proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(hashedProposal)

    // Vote on contract 
    // Check to make sure the status changes
    
  });


});
