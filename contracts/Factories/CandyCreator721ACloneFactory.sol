// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "../Base/Token/CandyCreator721AUpgradeable.sol";
import "../Base/Royalties/RoyaltySplitterUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CandyCreator721ACloneFactory {

    address immutable tokenImplementation;
    address immutable royaltySplitterImplementation;
    address immutable candyWallet = 0xD52Ed960e6Bf7B2CdA61980FC286772159e3D266;

    event CandyCreator721ACreated(address tokenAddress, address royaltySplitterAddress);

    // When the factory is constructed, create the implementation contracts
    constructor() {
        tokenImplementation = address(new CandyCreator721AUpgradeable());
        royaltySplitterImplementation = address(new RoyaltySplitterUpgradeable());
    }

    // Creates a 721A contract and a Royalty Splitter to split 
    // secondary sale royalty payments
    function create721A(
        // The token name 
        string memory name,
        // The token symbol
        string memory symbol,
        // The URI for a JSON placeholder file
        string memory _placeholderURI,
        // The mint fee in wei (10**18 = 1 ETH)
        uint256 _mintPrice,
        // THe size of the collection 
        uint256 _mintSize,
        // The primary sale earnings recipients
        address[] memory splitAddresses,
        // The basis points for each of the primary sale earnings recipients
        uint256[] memory splitShares,
        // The Merkle root hash for the initial whitelist
        bytes32 _whitelistMerkleRoot,
        // The address to pay out 75% of secondary sale royalties to 
        address creatorRoyaltyDestination,
        // The secondary sale royalty fees measured in basis points of the sale price
        uint256 royaltyBasisPoints
    )
    external returns (address) {
        // Clone the RoyaltySplitter contract 
        address payable royaltySplitterClone = payable(Clones.clone(royaltySplitterImplementation));
        // Set up the royalty splitter
        RoyaltySplitterUpgradeable(royaltySplitterClone).initialize(candyWallet, creatorRoyaltyDestination, msg.sender);
        // Clone the CandyCreator721A contract 
        address payable tokenClone = payable(Clones.clone(tokenImplementation));
        // Setup the CandyCreator721A contract
        CandyCreator721AUpgradeable(tokenClone).initialize(name, symbol, _placeholderURI, _mintPrice, _mintSize, splitAddresses, splitShares, _whitelistMerkleRoot, royaltyBasisPoints, royaltySplitterClone, candyWallet, msg.sender);
        // Emit event for external systems / The Graph to retrieve
        emit CandyCreator721ACreated(tokenClone, royaltySplitterClone);
        return tokenClone;
    }
}
