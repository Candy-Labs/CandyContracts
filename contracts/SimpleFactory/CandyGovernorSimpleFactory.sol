// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import "./CandyGovernor.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract CandyGovernorSimpleFactory {

    event GovernorCreated(address governorAddress, address tokenAddress);

    constructor() public {}

    function createGovernor(address tokenAddress) external {
        CandyGovernor governor = new CandyGovernor(IVotes(tokenAddress));
        emit GovernorCreated(address(governor), tokenAddress);
    }
}