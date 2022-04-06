// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "../Base/Token/CandyCreator721AVotesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CandyCreator721AVotesCloneFactory {

    address immutable votingTokenImplementation;

    event CandyCreator721AVotesCreated(address tokenAddress);

    constructor() {
        votingTokenImplementation = address(new CandyCreator721AVotesUpgradeable());
    }

    // Needs more parameters in this function and those passed to initialize 
    function create721AVotes(string calldata name, string calldata symbol, string calldata placeholderURI, uint256 mintPrice, uint256 mintSize, bytes32 whitelistMerkleRoot) external returns (address) {
        address clone = Clones.clone(votingTokenImplementation);
        CandyCreator721AVotesUpgradeable(clone).initialize(name, symbol, placeholderURI, mintPrice, mintSize, whitelistMerkleRoot);
        emit CandyCreator721AVotesCreated(clone);
        return clone;
    }
    
}
