/***
 *    ██████╗  █████╗ ██╗   ██╗███╗   ███╗███████╗███╗   ██╗████████╗
 *    ██╔══██╗██╔══██╗╚██╗ ██╔╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝
 *    ██████╔╝███████║ ╚████╔╝ ██╔████╔██║█████╗  ██╔██╗ ██║   ██║
 *    ██╔═══╝ ██╔══██║  ╚██╔╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║
 *    ██║     ██║  ██║   ██║   ██║ ╚═╝ ██║███████╗██║ ╚████║   ██║
 *    ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝
 *
 *    ███████╗██████╗ ██╗     ██╗████████╗████████╗███████╗██████╗
 *    ██╔════╝██╔══██╗██║     ██║╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 *    ███████╗██████╔╝██║     ██║   ██║      ██║   █████╗  ██████╔╝
 *    ╚════██║██╔═══╝ ██║     ██║   ██║      ██║   ██╔══╝  ██╔══██╗
 *    ███████║██║     ███████╗██║   ██║      ██║   ███████╗██║  ██║
 *    ╚══════╝╚═╝     ╚══════╝╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝
 * Re-write of @openzeppelin/contracts/finance/PaymentSplitter.sol
 *
 *
 * Edits the release functionality to force release to all addresses added
 * as payees.
 */

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../PaymentSplitter/CandyPaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract RoyaltySplitterUpgradeable is Initializable, OwnableUpgradeable, CandyPaymentSplitterUpgradeable {

    function initialize(
        address candyWallet,
        address creatorWallet,
        address owner
    )   public initializer {
        // Candy Chain platform gets 25% of all royalties paid to this address 
        _addPayee(candyWallet, 2500);
        // Creator gets 75% of all royalties paid to this address
        _addPayee(creatorWallet, 7500);
        // Transfer ownership to the project creator so that only they can call the 
        // releaseRoyalties function 
        transferOwnership(owner);
    }

    // Only the NFT project creator can call this function 
    // which releases funds to both Candy Chain and to the creator
    function release() external onlyOwner {
        _release();
    }

    // For payable contracts 
    receive() external payable virtual {
        emit PaymentReceived(msg.sender, msg.value);
    }
     
    fallback() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    // Should indicate support for CandyPaymentSplitter interface?

}

