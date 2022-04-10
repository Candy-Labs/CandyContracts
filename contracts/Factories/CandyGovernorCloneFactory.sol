// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "../Base/Governor/CandyGovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/utils/IVotesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CandyGovernorCloneFactory {

    address immutable governorImplementation;

    event CandyGovernorCreated(address governorAddress, address tokenAddress);

    constructor() {
        governorImplementation = address(new CandyGovernorUpgradeable());
    }

    function createGovernor(address tokenAddress) external returns (address) {
        address payable clone = payable(Clones.clone(governorImplementation));
        CandyGovernorUpgradeable(clone).initialize(IVotesUpgradeable(tokenAddress));
        emit CandyGovernorCreated(clone, tokenAddress);
        return clone;
    }
    
}
