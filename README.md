![Logo](https://res.cloudinary.com/candy-labs/image/upload/v1644974796/smaller_dep6qo.png)
</br>
</br>
![Twitter](https://img.shields.io/twitter/follow/Candy_Chain_?style=social)
![GithubFollow](https://img.shields.io/github/followers/Candy-Labs?style=social)

# CandyContracts (Audit/Factory Branch)
* EIP-1167 Minimal Proxy Contract Deployments
* Minimal Setup
* Gas-Optimized
* ERC721A Batch Minting
* Supports EIP-2981 / Royalty Split
* Merkle Proof Whitelist
* Delayed Reveal

## Base
The main folder of Solidity contracts.

### Token 
Contains our main NFT implementation [CandyCreator721AUpgradeable](https://github.com/Candy-Labs/CandyContracts/blob/factory-audit/contracts/Base/Token/CandyCreator721AUpgradeable.sol) and the [ERC721A-Upgradeable contracts](https://github.com/chiru-labs/ERC721A-Upgradeable/tree/main/contracts). The NFT implementation inherits from the PaymentSplitter to split primary mint sale earnings to multiple creators. 

### PaymentSplitter
Contains a [modified version](https://github.com/Candy-Labs/CandyContracts/blob/factory-audit/contracts/Base/PaymentSplitter/CandyPaymentSplitterUpgradeable.sol) of the [OpenZeppelin PaymentSplitter contract](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/finance/PaymentSplitterUpgradeable.sol). Our version removes support for ERC20 tokens, opting to only split native token (ETH, MATIC, AVAX etc) payments. Instead of allowing each payee to claim the funds individually, we just have a single owner who calls a `release` function that distributes payment to all parties. 

### Royalties
Contains an [abstract IERC2981 contract](https://github.com/Candy-Labs/CandyContracts/blob/factory-audit/contracts/Base/Royalties/CandyCollection2981RoyaltiesUpgradeable.sol) for setting collection-wide (royalty fee is the same for all tokens) EIP-2981 royalties. Also contains a [RoyaltySplitter contract](https://github.com/Candy-Labs/CandyContracts/blob/factory-audit/contracts/Base/Royalties/RoyaltySplitterUpgradeable.sol) that is used to share secondary sale royalties between both the creator and the Candy Chain platform (inherits from our PaymentSplitter). 

## Factories 
Contains a [single factory](https://github.com/Candy-Labs/CandyContracts/blob/factory-audit/contracts/Factories/CandyCreator721ACloneFactory.sol) that uses the [OpenZeppelin Clones contract](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones) to deploy EIP-1167 minimal proxy clones of our NFT contract so that it is signficantly cheaper to deploy for our users. 

The `create721A` method works as follows:
* Deploys a RoyaltySplitter contract to be used to split secondary sale royalty payments between the creator and Candy Chain platform.
* Deploys a CandyCreator721AUpgradeable contract (and sets the secondary sale royalty recipient address to the Royalty Splitter contract deployed in the previous step. 

## Note on Upgradeability 
Despite the naming convention of adding the `Upgradeable` suffix to our contracts, they are not actually upgradeable. We simply follow this convention that OpenZeppelin has set to indicate that the contract uses an initializer instead of a constructor and has no immutable variables. 

## Developer Questions
* Do we need to be using OpenZeppelin Context and change `msg.sender` to `_msgSender()`. We see this implemented in many contracts but we don't intend to have contract functions called via a GSN (Gas Station Network) forwarder so we have ommitted it. 
* We have changed the mint functions to call `mint` instead of `safeMint`. This is often considered better practice and helps avoid re-entrancy attacks but it also limits functionality (if the mint function is called by a contract instead of an EOA, the contract cannot respond to receiving the NFTs). In addition, the ERC721A `safeMint` function is re-entrant safe which may mean it is okay to use here.
* Can the logic of the CandyPaymentSplitter `release` function be simplified since we've edited the original OpenZeppelin version?
* Can we use `unchecked` anywhere to save gas?
* Can we replace any `memory` parameters with `calldata`? Is this better practice? 

## Testing / Auditing 
To start using these contracts with [Hardhat](https://hardhat.org/) simply run the following commands:
1. `npm install`
2. `npx hardhat compile` or `npx hardhat test`

**Tests are not yet available for this branch and need to be ported from the legacy branch (main)**
