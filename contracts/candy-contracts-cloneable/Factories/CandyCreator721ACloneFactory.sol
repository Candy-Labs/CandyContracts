// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "../Base/Token/CandyCreator721AUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CandyCreator721ACloneFactory {

    address immutable tokenImplementation;
    address immutable candyWallet;

    event CandyCreator721ACreated(address tokenAddress);

    constructor(address _candyWallet) {
        tokenImplementation = address(new CandyCreator721AUpgradeable());
        candyWallet = _candyWallet;
    }

    function create721A(string calldata name, string calldata symbol, string calldata placeholderURI, uint256 mintPrice, uint256 mintSize, address[] memory splitAddresses, uint256[] memory splitShares, bytes32 whitelistMerkleRoot) external returns (address) {
        address payable clone = payable(Clones.clone(tokenImplementation));
        CandyCreator721AUpgradeable(clone).initialize(name, symbol, placeholderURI, mintPrice, mintSize, candyWallet, splitAddresses, splitShares, whitelistMerkleRoot);
        emit CandyCreator721ACreated(clone);
        return clone;
    }
}