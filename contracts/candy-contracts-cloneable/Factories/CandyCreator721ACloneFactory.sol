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

    function create721A(
        string memory name,
        string memory symbol,
        string memory _placeholderURI,
        uint256 _mintPrice,
        uint256 _mintSize,
        address[] memory splitAddresses,
        uint256[] memory splitShares,
        bytes32 _whitelistMerkleRoot,
        address _candyWallet
    )
    external returns (address) {
        address payable clone = payable(Clones.clone(tokenImplementation));
        CandyCreator721AUpgradeable(clone).initialize(name, symbol, _placeholderURI, _mintPrice, _mintSize, splitAddresses, splitShares, _whitelistMerkleRoot, _candyWallet);
        emit CandyCreator721ACreated(clone);
        return clone;
    }
}