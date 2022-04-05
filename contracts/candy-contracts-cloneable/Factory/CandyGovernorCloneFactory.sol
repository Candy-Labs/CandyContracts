// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "./CandyGovernor.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract CandyGovernorCloneFactory {

    address immutable governorImplementation;

    event GovernorCreated(address governorAddress, address tokenAddress);

    constructor() {
        governorImplementation = address(new CandyGovernorUpgradeable());
    }

    function createGovernor(address tokenAddress) external returns (address) {
        address clone = Clones.clone(governorImplementation);
        CandyGovernorUpgradeable(clone).initialize(IVotes(tokenAddress));
        emit GovernorCreated(clone, tokenAddress);
        return clone;
    }
    
}
