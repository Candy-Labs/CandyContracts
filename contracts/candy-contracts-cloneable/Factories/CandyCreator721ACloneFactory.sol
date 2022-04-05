pragma solidity >=0.8.4 <0.9.0;

import "./CandyCreator721AUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "hardhat/console.sol";

contract CandyCreator721ACloneFactory {

    address immutable tokenImplementation;

    constructor() {
        tokenImplementation = address(new CandyCreator721AUpgradeable());
    }

    function createToken(string calldata name, string calldata symbol, string calldata _placeholderURI, uint256 _mintPrice, uint256 _mintSize, bytes32 _whitelistMerkleRoot) external returns (address) {
        address clone = Clones.clone(tokenImplementation);
        CandyCreator721AUpgradeable(clone).initialize(name, symbol, _placeholderURI, _mintPrice, _mintSize, _whitelistMerkleRoot);
        return clone;
    }
}