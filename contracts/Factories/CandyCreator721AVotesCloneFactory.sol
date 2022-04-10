// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "../Base/Token/CandyCreator721AVotesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CandyCreator721AVotesCloneFactory {

    address immutable tokenImplementation;
    address immutable candyWallet;

    event CandyCreator721AVotesCreated(address tokenAddress);

    constructor(address _candyWallet) {
        tokenImplementation = address(new CandyCreator721AVotesUpgradeable());
        candyWallet = _candyWallet;
    }

    function create721AVotes(
        string memory name,
        string memory symbol,
        string memory _placeholderURI,
        uint256 _mintPrice,
        uint256 _mintSize,
        address[] memory splitAddresses,
        uint256[] memory splitShares,
        bytes32 _whitelistMerkleRoot
    )
    external returns (address) {
        address payable clone = payable(Clones.clone(tokenImplementation));
        CandyCreator721AVotesUpgradeable(clone).initialize(name, symbol, _placeholderURI, _mintPrice, _mintSize, splitAddresses, splitShares, _whitelistMerkleRoot, candyWallet);
        emit CandyCreator721AVotesCreated(clone);
        return clone;
    }
}