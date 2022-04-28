const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Deploys a standard CandyCreator721A token factory 
async function deploy721AFactory() {
  const CandyCreator721AFactory = await ethers.getContractFactory("CandyCreator721ACloneFactory");
  const FactoryDeployment = await CandyCreator721AFactory.deploy();
  await FactoryDeployment.deployed();
  return FactoryDeployment
}

// Deploys a standard CandyCreator721A token using a factory contract 
async function deploy721AToken(factoryContract) {
  const [_, owner, royalty1] = await ethers.getSigners();
  const tx = await factoryContract.connect(owner).create721A("TestToken", "TEST", "placeholder.json", 1000000000 * 1, 10000, [owner.address, royalty1.address], [8500, 1000], "0x0000000000000000000000000000000000000000000000000000000000000000", 1, 1);
  const { events } = await tx.wait();
  const { address } = events.find(Boolean);
  return address;
}


describe("CandyCreator721AUpgradeable (Clone) Tests", function () {

  it("Owner of cloned contract should be create721A() msg.sender", async function () {
    const [queryAccount, owner] = await ethers.getSigners();
    const expectedOwner = await owner.getAddress();
    const factory = await deploy721AFactory();
    const clonedTokenAddress = await deploy721AToken(factory);
    const { interface } = await ethers.getContractFactory('CandyCreator721AUpgradeable');
    const clonedTokenInstance = new ethers.Contract(clonedTokenAddress, interface, queryAccount);
    const clonedTokenOwner = await clonedTokenInstance.owner();
    expect(clonedTokenOwner).to.be.equal(expectedOwner);
  });

  it("Candy Wallet should recieve 500 shares on initialization", async function () {
    const [queryAccount] = await ethers.getSigners();
    const factory = await deploy721AFactory();
    const clonedTokenAddress = await deploy721AToken(factory);
    const { interface } = await ethers.getContractFactory('CandyCreator721AUpgradeable');
    const clonedTokenInstance = new ethers.Contract(clonedTokenAddress, interface, queryAccount);
    const firstPayee = await clonedTokenInstance.payee(0);
    expect(firstPayee).to.be.equal("0xD52Ed960e6Bf7B2CdA61980FC286772159e3D266");
    const candyWalletShares = await clonedTokenInstance.shares(firstPayee);
    expect(candyWalletShares).to.be.equal(500);
  });





  /*
   // Attempting to mint should rever
   await expect(CandyCreator.connect(deployment.owner)
   .publicMint(1, {
     value: fee
   }))
   .to.be.revertedWith('MintingNotActive()');
*/
  
});