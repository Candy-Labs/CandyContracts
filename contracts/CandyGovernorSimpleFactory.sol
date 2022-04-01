// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./CandyGovernor.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract CandyGovernorSimpleFactory {

    event GovernorCreated(address governorAddress, address tokenAddress);

    constructor() public {}

    function createGovernor(address tokenAddress) external {
        // Voting power will be derived from ERC721 tokenAddress 
        CandyGovernor governor = new CandyGovernor(IVotes(tokenAddress));
        // Governor will have no control until setGovernor is called on token contract
        emit GovernorCreated(address(governor), tokenAddress);
    }
}