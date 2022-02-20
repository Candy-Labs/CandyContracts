const { expect } = require("chai");
const { ethers } = require("hardhat");


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

describe("Payment", function () {

    it("Contract has Correct Balance (Single Mint)", async function() {
        const deployment = await deployMulti()
        CandyCreator = deployment.contract 

        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .enableMinting()
    
        // Get the minting fee
        const fee = await CandyCreator.connect(deployment.owner)
        .mintingFee()
        
        await CandyCreator.connect(deployment.owner)
        .publicMint(1, {
          value: 1 * fee
        })

        await CandyCreator.connect(deployment.owner)
        .publicMint(1, {
          value: 1 * fee
        })

        await CandyCreator.connect(deployment.owner)
        .publicMint(1, {
          value: 1 * fee
        })

        const balance = await CandyCreator.getBalance()
        expect(balance).to.be.equal(3*fee)
    });

    it("Contract has Correct Balance (Batch Mint)", async function() {
        const deployment = await deployMulti()
        CandyCreator = deployment.contract 

        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .enableMinting()

        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .setMaxPublicMints(100)
    
        // Get the minting fee
        const fee = await CandyCreator.connect(deployment.owner)
        .mintingFee()
        
        await CandyCreator.connect(deployment.owner)
        .publicMint(5, {
          value: 5 * fee
        })

        await CandyCreator.connect(deployment.owner)
        .publicMint(45, {
          value: 45 * fee
        })

        await CandyCreator.connect(deployment.owner)
        .publicMint(50, {
          value: 50 * fee
        })

        const balance = await CandyCreator.getBalance()
        expect(balance).to.be.equal(100*fee)
    });

    it("Should only release funds when balance is non-zero", async function() {
        const deployment = await deployMulti()
        CandyCreator = deployment.contract 

        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .enableMinting()

        // Enable minting THIS SHOULD SAY MINTING IS ALREADY ENABLED
        await expect(CandyCreator.connect(deployment.owner)
        .enableMinting())

        await expect(CandyCreator.connect(deployment.owner)
        .release())
        .to.be.revertedWith("Contract must have a balance to release funds")
        
    });

    it("Should calculate funds owed correctly", async function() {
        const deployment = await deployMulti()
        CandyCreator = deployment.contract 

        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .enableMinting()


        await expect(CandyCreator.connect(deployment.owner)
        .release())
        .to.be.revertedWith("Contract must have a balance to release funds")

        const totalShares = await CandyCreator.totalShares()
        const ownerShares = await CandyCreator.shares(deployment.owner.address)
        const royalty1Shares = await CandyCreator.shares(deployment.royalty1.address)
        const candyShares = await CandyCreator.shares(deployment.candyWallet.address)

        expect(ownerShares).to.be.equal(5000)
        expect(royalty1Shares).to.be.equal(4500)
        expect(candyShares).to.be.equal(500)
        expect(totalShares).to.be.equal(10000)
        
    });

    it("Should release all funds", async function() {
        const deployment = await deployMulti()
        CandyCreator = deployment.contract
        
        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .enableMinting()

        // Enable minting
        await CandyCreator.connect(deployment.owner)
        .setMaxPublicMints(100)
    
        // Get the minting fee
        const fee = await CandyCreator.connect(deployment.owner)
        .mintingFee()
        
        await CandyCreator.connect(deployment.owner)
        .publicMint(5, {
          value: 5 * fee
        })

        await CandyCreator.connect(deployment.owner)
        .publicMint(45, {
          value: 45 * fee
        })

        await CandyCreator.connect(deployment.owner)
        .publicMint(50, {
          value: 50 * fee
        })

        const ownerInitialBalance = await ethers.provider.getBalance(deployment.owner.address)

        const balance = await CandyCreator.getBalance()

        await CandyCreator.connect(deployment.owner)
        .release()

        const totalShares = await CandyCreator.totalShares()
        const ownerShares = await CandyCreator.shares(deployment.owner.address)
        const royalty1Shares = await CandyCreator.shares(deployment.royalty1.address)
        const candyShares = await CandyCreator.shares(deployment.candyWallet.address)

        expect(ownerShares).to.be.equal(5000)
        expect(royalty1Shares).to.be.equal(4500)
        expect(candyShares).to.be.equal(500)
        expect(totalShares).to.be.equal(10000)

        const updatedBalance = await CandyCreator.getBalance()
        expect(updatedBalance).to.be.equal(0)
        
    });
 
});
