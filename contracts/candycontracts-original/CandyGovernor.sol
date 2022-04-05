// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract CandyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    
    address creatorToken;

    constructor(IVotes _token)
        Governor("CandyGovernor")
        GovernorSettings(1 /* 1 block */, 273 /* 1 hour */, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(30)
    {
        creatorToken = address(_token);
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotes)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    // Alex EDITS
    // Get the NFT token contract that is governed by this contract 
    function governedToken()
        public
        view
        returns (address)
    {
        return creatorToken;
    }

    // Override propose method to restrict calls to release and refund 
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )   public  
        override
        returns(uint256) {
            // The target must be the token address 
            // What to do with values?
            //require(targets.length = 1 && targets[0] = token, "Wrong target data");
            // Can only propose 1 function call 
            //require(calldatas.length = 1 && calldatas[0] = 0x86d1a69f, "Can only propose release");
            // Function call must be to release funds
            // Call propose (which requires you to own at least one token) in the inherited contract
            // Governor.sol
            return super.propose(
                targets,
                values,
                calldatas,
                description
            );
        }

}

