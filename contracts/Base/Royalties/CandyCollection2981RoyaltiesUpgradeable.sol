/***
 *    
 *    ██████╗░░█████╗░░█████╗░░░███╗░░  ██████╗░░█████╗░██╗░░░██╗░█████╗░██╗░░░░░████████╗██╗███████╗░██████╗
 *    ╚════██╗██╔══██╗██╔══██╗░████║░░  ██╔══██╗██╔══██╗╚██╗░██╔╝██╔══██╗██║░░░░░╚══██╔══╝██║██╔════╝██╔════╝
 *    ░░███╔═╝╚██████║╚█████╔╝██╔██║░░  ██████╔╝██║░░██║░╚████╔╝░███████║██║░░░░░░░░██║░░░██║█████╗░░╚█████╗░
 *    ██╔══╝░░░╚═══██║██╔══██╗╚═╝██║░░  ██╔══██╗██║░░██║░░╚██╔╝░░██╔══██║██║░░░░░░░░██║░░░██║██╔══╝░░░╚═══██╗
 *    ███████╗░█████╔╝╚█████╔╝███████╗  ██║░░██║╚█████╔╝░░░██║░░░██║░░██║███████╗░░░██║░░░██║███████╗██████╔╝
 *    ╚══════╝░╚════╝░░╚════╝░╚══════╝  ╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚═╝░░╚═╝╚══════╝░░░╚═╝░░░╚═╝╚══════╝╚═════╝░
 *
 * Designed to allow setting a global royalty address along with specified basis points. 
 */

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

abstract contract CandyCollection2981RoyaltiesUpgradeable is Initializable, IERC2981Upgradeable {

  address private royaltyAddress;
  uint256 private royaltyBasisPoints;

  function _setRoyalties(address _receiver, uint256 _basisPoints) internal {
    royaltyAddress = _receiver;
    royaltyBasisPoints = _basisPoints;
  }

  // Override for royaltyInfo(uint256, uint256)
  function royaltyInfo(
    uint256 _tokenId,
    uint256 _salePrice
  ) external view override(IERC2981Upgradeable) returns (
    address receiver,
    uint256 royaltyAmount
  ) {
    receiver = royaltyAddress;
    royaltyAmount = _salePrice * royaltyBasisPoints / 10000;
  }

}
