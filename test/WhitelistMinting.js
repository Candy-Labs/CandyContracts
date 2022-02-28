const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

async function deploySingle() {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreatorV1A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, false, [], []);
  await CandyCreator.deployed();
  return {contract: CandyCreator, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2}; 
}

async function deployMulti() {
  const [owner, candyWallet, royalty1, royalty2] = await ethers.getSigners();
  const CandyCreatorFactory = await ethers.getContractFactory("CandyCreatorV1A");
  const CandyCreator = await CandyCreatorFactory.deploy("TestToken", "TEST", "candystorage/placeholder.json", 1000000000 * 1, 10000, candyWallet.address, true, [owner.address, royalty1.address], [5000, 4500]);
  await CandyCreator.deployed();
  return {contract: CandyCreator, owner: owner, candyWallet: candyWallet, royalty1: royalty1, royalty2: royalty2}; 
}

describe("Whitelist Minting", function () {

  it("Generate and Set Whitelist", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)
  });

  it("Non-Whitelisted Addresses Can't Mint", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)

    // Enable whitelist 
    await CandyCreator.connect(deployment.owner)
    .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
    .enableMinting()

    // Generate proof for Owner 
    const hashedOwner = keccak256(deployment.owner.address);
    const ownerProof = merkleTree.getHexProof(hashedOwner);

    // Generate proof for CandyWallet
    const hashedCandy = keccak256(deployment.candyWallet.address);
    const candyProof = merkleTree.getHexProof(hashedCandy);

    // Attempt to mint a token 
    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
    .mintingFee()

    // We only whitelisted the owner, the other generated proof is invalid
    await expect(CandyCreator.connect(deployment.candyWallet)
    .whitelistMint(candyProof, 1, {
      value: fee
    })).to.be.revertedWith("Address not whitelisted")

  });


  it("Whitelisted Addresses Can Mint", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)

    // Enable whitelist 
    await CandyCreator.connect(deployment.owner)
    .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
    .enableMinting()

    // Generate proof for Owner 
    const hashedOwner = keccak256(deployment.owner.address);
    const ownerProof = merkleTree.getHexProof(hashedOwner);

    // Generate proof for CandyWallet
    const hashedCandy = keccak256(deployment.candyWallet.address);
    const candyProof = merkleTree.getHexProof(hashedCandy);

    // Attempt to mint a token 
    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
    .mintingFee()

    // Owner proof should be valid
    await expect(CandyCreator.connect(deployment.owner)
    .whitelistMint(ownerProof, 1, {
      value: fee
    }))


  });


  it("Invalidate Whitelist Address after Claim", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)

    // Enable whitelist 
    await CandyCreator.connect(deployment.owner)
    .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
    .enableMinting()

    // Generate proof for Owner 
    const hashedOwner = keccak256(deployment.owner.address);
    const ownerProof = merkleTree.getHexProof(hashedOwner);

    // Generate proof for CandyWallet
    const hashedCandy = keccak256(deployment.candyWallet.address);
    const candyProof = merkleTree.getHexProof(hashedCandy);

    // Attempt to mint a token 
    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
    .mintingFee()

    // Owner proof should be valid
    await expect(CandyCreator.connect(deployment.owner)
    .whitelistMint(ownerProof, 1, {
      value: fee
    }))

    // Should not be able to mint off whitelist again 
    await expect(CandyCreator.connect(deployment.owner)
    .whitelistMint(ownerProof, 1, {
      value: fee
    }))
    .to.be.revertedWith("Not enough whitelist slots.")
    

  });

  it("Whitelist Mint Respects Max Mints", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)

    // Enable whitelist 
    await CandyCreator.connect(deployment.owner)
    .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
    .enableMinting()

    // Generate proof for Owner 
    const hashedOwner = keccak256(deployment.owner.address);
    const ownerProof = merkleTree.getHexProof(hashedOwner);

    // Generate proof for CandyWallet
    const hashedCandy = keccak256(deployment.candyWallet.address);
    const candyProof = merkleTree.getHexProof(hashedCandy);

    // Attempt to mint a token 
    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
    .mintingFee()

    // Should not be able to mint off whitelist again 
    await expect(CandyCreator.connect(deployment.owner)
    .whitelistMint(ownerProof, 2, {
      value: fee*2
    })).to.be.revertedWith("Exceeds maximum whitelist mints")

  });

  it("Update Whitelist During Minting", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)

    // Enable whitelist 
    await CandyCreator.connect(deployment.owner)
    .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
    .enableMinting()

    // Generate a new whitelist root hash (Candy Wallet added to whitelist)
    const newAddresses = [deployment.owner.address, deployment.candyWallet.address]
    const newHashedAddresses = newAddresses.map(addr => keccak256(addr));
    const newMerkleTree = new MerkleTree(newHashedAddresses, keccak256, { sortPairs: true });
    const newRootHash = "0x" + newMerkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(newRootHash)

    // Generate proof for Owner 
    const hashedOwner = keccak256(deployment.owner.address);
    const ownerProof = newMerkleTree.getHexProof(hashedOwner);

    // Generate proof for CandyWallet
    const hashedCandy = keccak256(deployment.candyWallet.address);
    const candyProof = newMerkleTree.getHexProof(hashedCandy);

    // Attempt to mint a token 
    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
    .mintingFee()

    // CandyWallet should be able to mint now
    await CandyCreator.connect(deployment.candyWallet)
    .whitelistMint(candyProof, 1, {
      value: fee*1
    })

  });


  it("1,000 Collection Minting", async function() {
    const deployment = await deployMulti()
    CandyCreator = deployment.contract 

    // Generate a new whitelist root hash (only whitelisted address is the user)
    const addresses = [deployment.owner.address]
    const hashedAddresses = addresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(rootHash)

    // Enable whitelist 
    await CandyCreator.connect(deployment.owner)
    .enableWhitelist()

    // Enable minting
    await CandyCreator.connect(deployment.owner)
    .enableMinting()

    // Set a large enough max whitelsit mints
    await CandyCreator.connect(deployment.owner)
    .setMaxWhitelistMints(1000)

    // Generate a new whitelist root hash (Candy Wallet added to whitelist)
    const newAddresses = [deployment.owner.address, deployment.candyWallet.address]
    const newHashedAddresses = newAddresses.map(addr => keccak256(addr));
    const newMerkleTree = new MerkleTree(newHashedAddresses, keccak256, { sortPairs: true });
    const newRootHash = "0x" + newMerkleTree.getRoot().toString('hex');

    // Update the contract's whitelist root hash 
    await CandyCreator.connect(deployment.owner)
    .setWhitelistMerkleRoot(newRootHash)

    // Generate proof for Owner 
    const hashedOwner = keccak256(deployment.owner.address);
    const ownerProof = newMerkleTree.getHexProof(hashedOwner);

    // Generate proof for CandyWallet
    const hashedCandy = keccak256(deployment.candyWallet.address);
    const candyProof = newMerkleTree.getHexProof(hashedCandy);

    // Attempt to mint a token 
    // Get the minting fee
    const fee = await CandyCreator.connect(deployment.owner)
    .mintingFee()
    
    for (var i = 0; i < 1000; i++) {
      // We only whitelisted the owner, the other generated proof is invalid
      await CandyCreator.connect(deployment.candyWallet)
      .whitelistMint(candyProof, 1, {
        value: fee*1
      })
    }
    
    

  });



  

 
});
