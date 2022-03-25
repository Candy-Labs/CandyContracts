const { expect } = require("chai");
const { ethers } = require("hardhat");

// Deploys a single creator CandyCreatorV1A ERC721A NFT Token contract
async function deploySingle() {
  const [owner, candyWallet, buyer1, royalty1] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreatorV1A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, false, [], [], "0x0000000000000000000000000000000000000000000000000000000000000000");
  await CandyCreator.deployed();
  return { contract: CandyCreator, owner: owner, candyWallet: candyWallet, buyer1: buyer1, royalty1: royalty1 };
}

// Deploys a Governor
async function deployGovernor(nftToken) {
    const [owner] = await ethers.getSigners();
    const CandyGovernorFactory = await ethers.getContractFactory("CandyGovernor");
    const CandyGovernor = await CandyGovernorFactory.deploy(nftToken)
    await CandyGovernor.deployed()
    return { contract: CandyGovernor, owner: owner }
}

describe("Governor Tests", function () {

  it("Deploy Token and Governor", async function () {
    // Deploy CandyCreator ERC721A NFT Token contract 
    const CandyCreatorDeployment = await deploySingle()
    const CandyCreatorContract = CandyCreatorDeployment.contract
    const CandyCreatorOwner = CandyCreatorDeployment.owner
    // Deploy the Candy Governor
    const CandyGovernorDeployment = await deployGovernor(CandyCreatorContract.address)
  });

  it("Create a proposal", async function () {
    // Deploy CandyCreator ERC721A NFT Token contract 
    const CandyCreatorDeployment = await deploySingle()
    const CandyCreatorContract = CandyCreatorDeployment.contract
    const CandyCreatorOwner = CandyCreatorDeployment.owner
    // Deploy the Candy Governor
    const CandyGovernorDeployment = await deployGovernor(CandyCreatorContract.address)
    const CandyGovernorContract = CandyGovernorDeployment.contract
    const CandyGovernorOwner = CandyGovernorDeployment.owner 
    // Encode release() function to pass to propose() and execute()
    const token = await ethers.getContractAt('CandyCreatorV1A', CandyCreatorContract.address);
    const releaseCalldata = token.interface.encodeFunctionData('release', []);
    // Create a proposal that will release funds to the project creator
    const proposal = await CandyGovernorContract.connect(CandyGovernorOwner).propose(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      "Release funds to project creator",
    );
    // Generate the keccak256 hash of the proposal description
    const descriptionHash = ethers.utils.id("Release funds to project creator")
    // Hash the proposal details 
    const hashedProposal = await CandyGovernorContract.connect(CandyGovernorOwner).hashProposal(
      // The CandyCreatorV1A ERC721A NFT Token contract address
      [CandyCreatorContract.address],
      // ?
      [0],
      // Encoded function data from before 
      [releaseCalldata],
      // keccak256 hash of proposal description 
      descriptionHash
    )
    // Check the state of the proposal it should be "Pending"
    /*
    Pending = 0
    Active = 1
    Canceled = 2
    Defeated = 3
    Succeeded = 4
    Queued = 5
    Expired = 6
    Executed = 7
    */
    const proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(hashedProposal)
    expect(proposalState).to.be.equal(0)
  });

  it("Create a proposal and pass release() vote", async function () {
    // Deploy CandyCreator ERC721A NFT Token contract 
    const CandyCreatorDeployment = await deploySingle()
    const CandyCreatorContract = CandyCreatorDeployment.contract
    const CandyCreatorOwner = CandyCreatorDeployment.owner
    // Deploy the Candy Governor
    const CandyGovernorDeployment = await deployGovernor(CandyCreatorContract.address)
    const CandyGovernorContract = CandyGovernorDeployment.contract
    const CandyGovernorOwner = CandyGovernorDeployment.owner 
    // Encode release() function to pass to propose() and execute()
    const token = await ethers.getContractAt('CandyCreatorV1A', CandyCreatorContract.address);
    const releaseCalldata = token.interface.encodeFunctionData('release');
    // The owner sets the governing contract via setGovernor()
    await CandyCreatorContract.connect(CandyCreatorDeployment.owner).setGovernor(CandyGovernorContract.address)
    // Enable minting on the contract 
    await CandyCreatorContract.connect(CandyCreatorDeployment.owner).enableMinting()
    // Get the minting fee
    const fee = await CandyCreatorContract.connect(CandyCreatorDeployment.buyer1)
      .mintingFee()
    // Set max public mints so we can mint many tokens
    await CandyCreatorContract.connect(CandyCreatorDeployment.owner)
      .setMaxPublicMints(100)
    // Mint 10 tokens 
    await expect(CandyCreatorContract.connect(CandyCreatorDeployment.buyer1)
      .publicMint(100, {
        value: 100*fee
      }))
    // Must delegate votes before the proposal is created
    // Delegate the buyers votes to themselves
    await CandyCreatorContract.connect(CandyCreatorDeployment.buyer1).delegate(CandyCreatorDeployment.buyer1.address)
    // Propose the fund release 
    const proposal = await CandyGovernorContract.connect(CandyCreatorDeployment.buyer1).propose(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      "Release funds to project creator",
    );
    // keccak256 hash of proposal description
    const descriptionHash = ethers.utils.id("Release funds to project creator")
    // Create proposalId by hashing full proposal details 
    const proposalId = await CandyGovernorContract.connect(CandyGovernorOwner).hashProposal(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      descriptionHash
    )
    // State should be Pending
    var proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(proposalId)
    expect(proposalState).to.be.equal(0)
    
    // 0 = Against, 1 = For, 2 = Abstain, as in CompoundBravo
    let AGAINST = 0
    let FOR = 1
    let ABSTAIN = 2

    // Mine a some blocks 
    for (var i = 0; i < 10; i++) {
      await network.provider.send("evm_mine")
    }

    // The token purchaser casts their votes FOR the proposal 
    await CandyGovernorContract.connect(CandyCreatorDeployment.buyer1).castVote(proposalId, FOR)
    
    for (var i = 0; i < 10; i++) {
      await network.provider.send("evm_mine")
    }

    // Check to see if the proposal is ACTIVE = 1
    proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(proposalId)
    expect(proposalState).to.be.equal(1)
    
  });

  it("Pass a proposal and release funds", async function () {
    // Deploy CandyCreator ERC721A NFT Token contract 
    const CandyCreatorDeployment = await deploySingle()
    const CandyCreatorContract = CandyCreatorDeployment.contract
    const CandyCreatorOwner = CandyCreatorDeployment.owner
    // Deploy the Candy Governor
    const CandyGovernorDeployment = await deployGovernor(CandyCreatorContract.address)
    const CandyGovernorContract = CandyGovernorDeployment.contract
    const CandyGovernorOwner = CandyGovernorDeployment.owner 
    // Encode release() function to pass to propose() and execute()
    const token = await ethers.getContractAt('CandyCreatorV1A', CandyCreatorContract.address);
    const releaseCalldata = token.interface.encodeFunctionData('release');
    // The owner sets the governing contract via setGovernor()
    await CandyCreatorContract.connect(CandyCreatorDeployment.owner).setGovernor(CandyGovernorContract.address)
    // Enable minting on the contract 
    await CandyCreatorContract.connect(CandyCreatorDeployment.owner).enableMinting()
    // Get the minting fee
    const fee = await CandyCreatorContract.connect(CandyCreatorDeployment.buyer1)
      .mintingFee()
    // Set max public mints so we can mint many tokens
    await CandyCreatorContract.connect(CandyCreatorDeployment.owner)
      .setMaxPublicMints(100)
    // Mint 10 tokens 
    await expect(CandyCreatorContract.connect(CandyCreatorDeployment.buyer1)
      .publicMint(100, {
        value: 100*fee
      }))
    // Must delegate votes before the proposal is created
    // Delegate the buyers votes to themselves
    await CandyCreatorContract.connect(CandyCreatorDeployment.buyer1).delegate(CandyCreatorDeployment.buyer1.address)
    // Propose the fund release 
    const proposal = await CandyGovernorContract.connect(CandyCreatorDeployment.buyer1).propose(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      "Release funds to project creator",
    );
    // keccak256 hash of proposal description
    const descriptionHash = ethers.utils.id("Release funds to project creator")
    // Create proposalId by hashing full proposal details 
    const proposalId = await CandyGovernorContract.connect(CandyGovernorOwner).hashProposal(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      descriptionHash
    )
    // State should be Pending
    var proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(proposalId)
    expect(proposalState).to.be.equal(0)
    
    // 0 = Against, 1 = For, 2 = Abstain, as in CompoundBravo
    let AGAINST = 0
    let FOR = 1
    let ABSTAIN = 2

    // Mine a some blocks 
    for (var i = 0; i < 10; i++) {
      await network.provider.send("evm_mine")
    }

    // The token purchaser casts their votes FOR the proposal 
    await CandyGovernorContract.connect(CandyCreatorDeployment.buyer1).castVote(proposalId, FOR)
    
    for (var i = 0; i < 10; i++) {
      await network.provider.send("evm_mine")
    }

    // Check to see if the proposal passed
    proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(proposalId)
    expect(proposalState).to.be.equal(1)

    // Get the proposal deadline 
    const proposalDeadline = await CandyGovernorContract.connect(CandyGovernorOwner).proposalDeadline(
      proposalId
    )
    //console.log(proposalDeadline)

    // Check the quorum, it should be 30% of totalSupply() = 30
    currentBlockNumber = await ethers.provider.getBlockNumber()
    const quorum = await CandyGovernorContract.connect(CandyGovernorOwner).quorum(currentBlockNumber-1)
    expect(quorum.toNumber()).to.be.equal(30)

    // Mine 50 blocks past the end of the proposal so that the voting period 
    // will have ended 
    for (var i = currentBlockNumber; i < proposalDeadline.toNumber()+50; i++) {
      await network.provider.send("evm_mine")
    }

    // Show votes cast for the given proposal 
    //const voteData = await CandyGovernorContract.connect(CandyGovernorOwner).proposalVotes(proposalId)
    //console.log(voteData)

    // Check to see if the proposal passed
    // Should be SUCCEEDED = 4
    proposalState = await CandyGovernorContract.connect(CandyGovernorOwner).state(proposalId)
    expect(proposalState).to.be.equal(4)

    // Have the Governor execute the release proposal on the contract 
    await CandyGovernorContract.connect(CandyGovernorOwner).execute(
      [CandyCreatorContract.address],
      [0],
      [releaseCalldata],
      descriptionHash
    )
    
  });


});
