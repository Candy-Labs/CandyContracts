/***
 *    ░█████╗░░█████╗░███╗░░██╗██████╗░██╗░░░██╗  ░█████╗░██████╗░███████╗░█████╗░████████╗░█████╗░██████╗░
 *    ██╔══██╗██╔══██╗████╗░██║██╔══██╗╚██╗░██╔╝  ██╔══██╗██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
 *    ██║░░╚═╝███████║██╔██╗██║██║░░██║░╚████╔╝░  ██║░░╚═╝██████╔╝█████╗░░███████║░░░██║░░░██║░░██║██████╔╝
 *    ██║░░██╗██╔══██║██║╚████║██║░░██║░░╚██╔╝░░  ██║░░██╗██╔══██╗██╔══╝░░██╔══██║░░░██║░░░██║░░██║██╔══██╗
 *    ╚█████╔╝██║░░██║██║░╚███║██████╔╝░░░██║░░░  ╚█████╔╝██║░░██║███████╗██║░░██║░░░██║░░░╚█████╔╝██║░░██║
 *    ░╚════╝░╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░░░░╚═╝░░░  ░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝
 *
 * Version: VALHALLA
 *
 * Purpose: ERC-721 template for no-code users.
 *          Placeholder for pre-reveal information.
 *          Batch minting using ERC721A.
 *          Guaranteed mint royalties with CandyPaymentSplitter.
 *          EIP-2981 compliant secondary sale collection-wide royalties with CandyCollection2981Royalties.
 *          Merkle whitelist functionality utilizing getAux from ERC721A.
 *          Can be deployed using a Clone Factory (OpenZeppelin Upgradeable Style)
 */

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/governance/utils/VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC721A/ERC721AUpgradeable.sol";
import "./ERC721A/extensions/ERC721ABurnableUpgradeable.sol";
import "../PaymentSplitter/CandyPaymentSplitterUpgradeable.sol";
import "../Royalties/CandyCollection2981RoyaltiesUpgradeable.sol";

error MintingNotActive();
error MintingActive();
error WouldExceedMintSize();
error ExceedsMaxTransactionMints();
error NonExistentToken();
error WhitelistNotRequired();
error WhitelistRequired();
error NotWhitelisted();
error NotEnoughWhitelistSlots();
error ExceedsMaxWhitelistMints();
error WrongPayment();
error InvalidMintSize();
error NotAuthorizedToRelease();
error NotTokenHolder();
error RefundNotActive();

/// @title An ERC721A-based contract with custodied fund release.
/// @author Candy Labs
contract CandyCreator721AVotesUpgradeable is
    Initializable,
    OwnableUpgradeable,
    ERC721ABurnableUpgradeable,
    CandyPaymentSplitterUpgradeable,
    CandyCollection2981RoyaltiesUpgradeable,
    VotesUpgradeable
{
    // State Variables
    string private base;
    // 32 bytes
    string private placeholderURI;
    // 32 bytes
    bytes32 private whitelistMerkleRoot;
    // 32 bytes 
    uint256 private maxPublicMints;
    // 32 bytes 
    uint256 private mintPrice;
    // 32 bytes 
    uint256 private mintSize;
    // 32 bytes
    uint256 private refundPrice;
    // 20 bytes
    address private governor;
    // 8 bytes 
    uint64 private maxWhitelistMints;
    // 1 byte 
    bool private whitelistActive;
    // 1 byte 
    bool private mintingActive;
    // 1 byte
    bool private lockedPayees;
    // 1 byte
    bool private refundActive;
    
    // Contract Events 
    event UpdatedMintPrice(uint256 _old, uint256 _new);
    event UpdatedMintSize(uint256 _old, uint256 _new);
    event UpdatedMaxWhitelistMints(uint256 _old, uint256 _new);
    event UpdatedMaxPublicMints(uint256 _old, uint256 _new);
    event UpdatedMintStatus(bool _old, bool _new);
    event UpdatedWhitelistStatus(bool _old, bool _new);
    event UpdatedPresaleEnd(uint256 _old, uint256 _new);
    event UpdatedWhitelist(bytes32 _old, bytes32 _new);
    event UpdatedRoyalties(address newRoyaltyAddress, uint256 newPercentage);
    event PayeesLocked(bool _status);
    event SetGovernor(address governorAddress);
    event RefundActivated(uint256 refundPrice);

    /***
     *    ░██████╗███████╗████████╗██╗░░░██╗██████╗░
     *    ██╔════╝██╔════╝╚══██╔══╝██║░░░██║██╔══██╗
     *    ╚█████╗░█████╗░░░░░██║░░░██║░░░██║██████╔╝
     *    ░╚═══██╗██╔══╝░░░░░██║░░░██║░░░██║██╔═══╝░
     *    ██████╔╝███████╗░░░██║░░░╚██████╔╝██║░░░░░
     *    ╚═════╝░╚══════╝░░░╚═╝░░░░╚═════╝░╚═╝░░░░░
     *    This section pertains to contract initialization and setup.
     */

    function initialize(
        // 32 bytes
        string memory name,
        // 32 bytes
        string memory symbol,
        // 32 bytes
        string memory _placeholderURI,
        // 32 bytes
        uint256 _mintPrice,
        // 32 bytes 
        uint256 _mintSize,
        // 32 bytes per element
        address[] memory splitAddresses,
        // 32 bytes per element
        // Can use uint16 (max value 65535) since an element in splitBasisPoints cannot be greater than 9,500.
        uint256[] memory splitBasisPoints,
        // 32 bytes
        bytes32 _whitelistMerkleRoot,
        // 20 bytes
        address candyWallet
    )   public initializer {
        __ERC721A_init(name, symbol);
        setupPaymentSplit(candyWallet, splitAddresses, splitBasisPoints);
        if (_whitelistMerkleRoot != 0) {
            whitelistMerkleRoot = _whitelistMerkleRoot;
            enableWhitelist();
        }
        placeholderURI = _placeholderURI;
        mintPrice = _mintPrice;
        mintSize = _mintSize;
        maxWhitelistMints = 2;
        maxPublicMints = 2;
    }

    /// @dev Called only within the logic of the initializer function to setup the payment splitting logic. 
    /// @param candyWallet The address used to receive the 5% (500 basis points) Candy Chain platform fee.
    /// @param splitAddresses An array containing the addresses that should receive payment.
    /// @param splitBasisPoints An array containing the basis points for each address in splitAddresses.
    function setupPaymentSplit(address candyWallet, address[] memory splitAddresses, uint256[] memory splitBasisPoints) private onlyInitializing {
        addPayee(candyWallet, 500);
        if (splitAddresses.length == 0) {
            addPayee(_msgSender(), 9500);
            lockPayees();
        } else {
            for (uint256 i = 0; i < splitAddresses.length; i++) {
                addPayee(splitAddresses[i], splitBasisPoints[i]);
            }
            lockPayees();
        }
    }

    /***
     *    ███╗   ███╗██╗███╗   ██╗████████╗
     *    ████╗ ████║██║████╗  ██║╚══██╔══╝
     *    ██╔████╔██║██║██╔██╗ ██║   ██║
     *    ██║╚██╔╝██║██║██║╚██╗██║   ██║
     *    ██║ ╚═╝ ██║██║██║ ╚████║   ██║
     *    ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝
     *    This section pertains to minting functionality.
     */

    /// @notice Mint function for use with whitelist minting sales. Mint fees in native token,
    ///  requires amount * mintPrice to be sent by caller.
    /// @param merkleProof The merkleProof generated by an off-chain API.
    /// @param amount The number of tokens to be minted.
    function whitelistMint(bytes32[] calldata merkleProof, uint64 amount)
        external
        payable
    {
        if (!mintingActive) revert MintingNotActive();
        if (!whitelistActive) revert WhitelistNotRequired();
        if (_msgValue() != mintPrice * amount) revert WrongPayment();
        if (totalSupply() + amount > mintSize) revert WouldExceedMintSize();
        if (amount > maxWhitelistMints) revert ExceedsMaxWhitelistMints();
        if (
            !MerkleProofUpgradeable.verify(
                merkleProof,
                whitelistMerkleRoot,
                keccak256(abi.encodePacked(_msgSender()))
            )
        ) revert NotWhitelisted();
        uint64 numWhitelistMinted = _getAux(_msgSender()) + amount;
        if (numWhitelistMinted > maxWhitelistMints)
            revert NotEnoughWhitelistSlots();
        _safeMint(_msgSender(), amount);
        _setAux(_msgSender(), numWhitelistMinted);
    }

    /// @notice Mint function for use with public minting sales. Mint Fees in native token,
    ///  requires amount * mintPrice to be sent by caller.
    /// @param amount The number of tokens to be minted.
    function publicMint(uint256 amount) external payable {
        if (whitelistActive) revert WhitelistRequired();
        if (!mintingActive) revert MintingNotActive();
        if (_msgValue() != mintPrice * amount) revert WrongPayment();
        if (totalSupply() + amount > mintSize) revert WouldExceedMintSize();
        if (amount > maxPublicMints) revert ExceedsMaxTransactionMints();
        _safeMint(_msgSender(), amount);
    }

    /***
     *    ██████╗░░█████╗░██╗░░░██╗███╗░░░███╗███████╗███╗░░██╗████████╗
     *    ██╔══██╗██╔══██╗╚██╗░██╔╝████╗░████║██╔════╝████╗░██║╚══██╔══╝
     *    ██████╔╝███████║░╚████╔╝░██╔████╔██║█████╗░░██╔██╗██║░░░██║░░░
     *    ██╔═══╝░██╔══██║░░╚██╔╝░░██║╚██╔╝██║██╔══╝░░██║╚████║░░░██║░░░
     *    ██║░░░░░██║░░██║░░░██║░░░██║░╚═╝░██║███████╗██║░╚███║░░░██║░░░
     *    ╚═╝░░░░░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░░░░╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░
     *    This section pertains to mint fees, royalties, and fund release.
     */

    // Function to receive ether, msg.data must be empty
    receive() external payable {
        // From PaymentSplitter.sol
        emit PaymentReceived(_msgSender(), _msgValue());
    }

    // Function to receive ether, msg.data is not empty
    fallback() external payable {
        // From PaymentSplitter.sol
        emit PaymentReceived(_msgSender(), _msgValue());
    }

    /// @notice Releases funds from the contract to the addresses owed payment.
    ///  Only the owner can call this function.
    /// @dev Defaults to the logic contained in CandyPaymentSplitterUpgradeable.
    function release() external onlyOwner {
        if (governor != _msgSender()) revert NotAuthorizedToRelease();
        _release();
    }

    /// @notice Sets single address EIP-2981 royalty information for this collection.
    /// @dev Uses internal functions to set EIP-2981
    ///  found in IERC2981Upgradeable.sol and used by CandyCollection2981RoyaltiesUpgradeable.sol
    /// @param _royaltyAddress - Address for all royalties to go to.
    /// @param _basisPoints - Basis points (out of 10,000) to set as secondary sale royalty fee.
    ///  of secondary sales
    function setRoyaltyInfo(address _royaltyAddress, uint256 _basisPoints)
        public
        onlyOwner
    {
        _setRoyalties(_royaltyAddress, _basisPoints);
        emit UpdatedRoyalties(_royaltyAddress, _basisPoints);
    }

    /// @notice this will set the fees required to mint using
    ///  publicMint(), must enter in wei. So 1 ETH = 10**18.
    /// @param _newFee - fee you set, if ETH 10**18, if
    ///  an ERC20 use token's decimals in calculation
    function setMintPrice(uint256 _newFee) public onlyOwner {
        uint256 oldFee = mintPrice;
        mintPrice = _newFee;
        emit UpdatedMintPrice(oldFee, mintPrice);
    }

    /// @notice will add an address to PaymentSplitter by owner role
    /// @dev May be able to eliminate this function since it is only called in the constructor / initializer
    /// @param newAddress Address to receive payments.
    /// @param _basisPoints The basis points newAddress should receive of contract earnings.
    function addPayee(address newAddress, uint256 _basisPoints) private {
        require(!lockedPayees, "Can not set, payees locked");
        _addPayee(newAddress, _basisPoints);
    }

    /// @notice Locks the ability to add further payees on CandyPaymentSplitter.sol
    function lockPayees() private {
        require(!lockedPayees, "Can not set, payees locked");
        lockedPayees = true;
        emit PayeesLocked(lockedPayees);
    }

    /// @dev Returns the tokenIds of the address. O(totalSupply) in complexity.
    /// Added to support the refund functionality.
    function tokensOfOwner(address owner) internal view returns (uint256[] memory) {
        unchecked {
            uint256[] memory a = new uint256[](balanceOf(owner)); 
            uint256 end = _currentIndex;
            uint256 tokenIdsIdx;
            address currOwnershipAddr;
            for (uint256 i; i < end; i++) {
                TokenOwnership memory ownership = _ownerships[i];
                if (ownership.burned) {
                    continue;
                }
                if (ownership.addr != address(0)) {
                    currOwnershipAddr = ownership.addr;
                }
                if (currOwnershipAddr == owner) {
                    a[tokenIdsIdx++] = i;
                }
            }
            return a;    
        }
    }

    /// @notice Transfers the caller the refund amount they are owed if eligible.
    function claimRefund() external {
        uint256 holderBalance = balanceOf(_msgSender());
        if (holderBalance == 0) revert NotTokenHolder();
        if (!refundActive) revert RefundNotActive();
        uint256[] memory ownedTokens = tokensOfOwner(_msgSender());
        for (uint256 i; i < ownedTokens.length; i++) {
            burn(ownedTokens[i]);
        }
        _releaseRefund(_msgSender(), refundPrice * holderBalance);
    }

    /***
     *
     *    ░█████╗░██████╗░███╗░░░███╗██╗███╗░░██╗
     *    ██╔══██╗██╔══██╗████╗░████║██║████╗░██║
     *    ███████║██║░░██║██╔████╔██║██║██╔██╗██║
     *    ██╔══██║██║░░██║██║╚██╔╝██║██║██║╚████║
     *    ██║░░██║██████╔╝██║░╚═╝░██║██║██║░╚███║
     *    ╚═╝░░╚═╝╚═════╝░╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝
     *    This section pertains to to basic contract administration tasks.
     *    All functions are restricted with the onlyOwner modifier.
     */

    /// @notice Updates the placeholderURI.
    /// @dev Added so users can fix mistakes with expensive deployed contracts.
    function updatePlaceholder(string calldata _placeholderURI) external onlyOwner {
        placeholderURI = _placeholderURI;
    }

    /// @notice Enables minting. 
    function enableMinting() external onlyOwner {
        if (mintingActive) revert MintingActive();
        bool old = mintingActive;
        mintingActive = true;
        emit UpdatedMintStatus(old, mintingActive);
    }

    /// @notice Disables minting. 
    function disableMinting() external onlyOwner {
        if (!mintingActive) revert MintingNotActive();
        bool old = mintingActive;
        mintingActive = false;
        emit UpdatedMintStatus(old, mintingActive);
    }

    /// @notice Requires whitelist membership for minting. 
    /// @dev Public visibility required since the function is called internally.
    function enableWhitelist() public onlyOwner {
        if (whitelistActive) revert WhitelistRequired();
        bool old = whitelistActive;
        whitelistActive = true;
        emit UpdatedWhitelistStatus(old, whitelistActive);
    }

    /// @notice Removes the whitelist requirement for minting. 
    function disableWhitelist() external onlyOwner {
        if (!whitelistActive) revert WhitelistNotRequired();
        bool old = whitelistActive;
        whitelistActive = false;
        emit UpdatedWhitelistStatus(old, whitelistActive);
    }

    /// @notice Sets a new Merkle root used to verify whitelist membership
    ///  in combination with a proof submitted to the whitelistMint function.
    /// @param _merkleRoot The generated Merkle root hash for the whitelist.
    function setWhitelistMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        bytes32 old = whitelistMerkleRoot;
        whitelistMerkleRoot = _merkleRoot;
        emit UpdatedWhitelist(old, whitelistMerkleRoot);
    }

    /// @notice Sets the maximum number of tokens a whitelisted user can mint.
    /// @param _amount The maximum amount of tokens a whitelisted user can mint.
    function setMaxWhitelistMints(uint64 _amount) public onlyOwner {
        uint256 oldAmount = maxWhitelistMints;
        maxWhitelistMints = _amount;
        emit UpdatedMaxWhitelistMints(oldAmount, maxWhitelistMints);
    }

    /// @notice Sets the maximum number of tokens a single address can mint AT A TIME
    ///  during the public mint period. Keep in mind that regardless of the number set, during public
    ///  minting any user will still be able to call the publicMint function an unlimited number of times
    /// @param  _amount The maximum amount of tokens that can be minted in a public transaction.
    function setMaxPublicMints(uint256 _amount) public onlyOwner {
        uint256 oldAmount = maxPublicMints;
        maxPublicMints = _amount;
        emit UpdatedMaxPublicMints(oldAmount, maxWhitelistMints);
    }

    /// @notice Updates the base URI for the token metadata
    ///  it does not emit an event so that it can be set invisibly to purchasers
    ///  and avoid token sniping.
    /// @param baseURI The new baseURI to generate tokenURIs from. 
    function setBaseURI(string memory baseURI) public onlyOwner {
        base = baseURI;
    }

    /// @notice Sets the mint size. Cannot be smaller than the totalSupply().
    /// @param _amount The mint size, or number of items in the collection.
    function setMintSize(uint256 _amount) public onlyOwner {
        if (_amount < totalSupply()) revert InvalidMintSize();
        uint256 old = mintSize;
        mintSize = _amount;
        emit UpdatedMintSize(old, mintSize);
    }

    /***
     *    ██████╗░██╗░░░██╗██████╗░██╗░░░░░██╗░█████╗░  ██╗░░░██╗██╗███████╗░██╗░░░░░░░██╗░██████╗
     *    ██╔══██╗██║░░░██║██╔══██╗██║░░░░░██║██╔══██╗  ██║░░░██║██║██╔════╝░██║░░██╗░░██║██╔════╝
     *    ██████╔╝██║░░░██║██████╦╝██║░░░░░██║██║░░╚═╝  ╚██╗░██╔╝██║█████╗░░░╚██╗████╗██╔╝╚█████╗░
     *    ██╔═══╝░██║░░░██║██╔══██╗██║░░░░░██║██║░░██╗  ░╚████╔╝░██║██╔══╝░░░░████╔═████║░░╚═══██╗
     *    ██║░░░░░╚██████╔╝██████╦╝███████╗██║╚█████╔╝  ░░╚██╔╝░░██║███████╗░░╚██╔╝░╚██╔╝░██████╔╝
     *    ╚═╝░░░░░░╚═════╝░╚═════╝░╚══════╝╚═╝░╚════╝░  ░░░╚═╝░░░╚═╝╚══════╝░░░╚═╝░░░╚═╝░░╚═════╝░
     *    Public view functions to retrieve information about the contract. 
     */

    /// @notice True/False value indicating whether minting is enabled.
    function mintStatus() external view returns (bool) {
        return mintingActive;
    }

    /// @notice True/False value indicating that the whitelist is currenly required for minting.
    function whitelistStatus() external view returns (bool) {
        return whitelistActive;
    }

    /// @notice The fee to mint each token in this collection. 
    function mintingFee() external view returns (uint256) {
        return mintPrice;
    }

    /// @notice The maximum tokens that are allowed to be minted 
    ///  by a whitelisted address.
    function whitelistMaxMints() external view returns (uint256) {
        return maxWhitelistMints;
    }

    /// @notice The maximum tokens that are allowed to be minted during
    ///  a single publicMint transaction.
    function publicMaxMints() external view returns (uint256) {
        return maxPublicMints;
    }

    /// @notice The current contract balance. 
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice The size of the collection.
    /// @dev Can be updated to sizes larger than or equal to the totalSupply()
    ///  through setMintSize().
    function collectionSize() external view returns (uint256) {
        return mintSize;
    }

    /// @notice Whether a refund is currently available to token holders.
    function refundStatus() external view returns (bool) {
        return refundActive;
    }

    /*** 
     *    ░██████╗░░█████╗░██╗░░░██╗███████╗██████╗░███╗░░██╗
     *    ██╔════╝░██╔══██╗██║░░░██║██╔════╝██╔══██╗████╗░██║
     *    ██║░░██╗░██║░░██║╚██╗░██╔╝█████╗░░██████╔╝██╔██╗██║
     *    ██║░░╚██╗██║░░██║░╚████╔╝░██╔══╝░░██╔══██╗██║╚████║
     *    ╚██████╔╝╚█████╔╝░░╚██╔╝░░███████╗██║░░██║██║░╚███║
     *    ░╚═════╝░░╚════╝░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝
     *    This section pertains to governance feature that are a part of
     *    CandyCreator721AVotes tokens.
     */
    
    /// @notice Sets the OpenZeppelin Governor contract for this token contract
    /// @dev This can technically be any address so user's need to verify that 
    ///  this is a proper governor themselves.
    /// @param govAddress The address of the governing contract.
    function setGovernor(address govAddress) public onlyOwner {
        governor = govAddress;
        emit SetGovernor(govAddress);
    }

    /// @dev Must return the voting units held by an account.
    function _getVotingUnits(address account) internal view override returns (uint256) {
        return balanceOf(account);
    }

    /// @notice Activates a refund. Can only be called by the governor contract.
    /// @dev Sets the refund price into the state. 
    function activateRefund() external {
        if (governor != _msgSender()) revert NotAuthorizedToRelease();
        refundPrice = address(this).balance / totalSupply();
        refundActive = true; 
        emit RefundActivated(refundPrice);
    }

    /***
     *    ░█████╗░██╗░░░██╗███████╗██████╗░██████╗░██╗██████╗░███████╗
     *    ██╔══██╗██║░░░██║██╔════╝██╔══██╗██╔══██╗██║██╔══██╗██╔════╝
     *    ██║░░██║╚██╗░██╔╝█████╗░░██████╔╝██████╔╝██║██║░░██║█████╗░░
     *    ██║░░██║░╚████╔╝░██╔══╝░░██╔══██╗██╔══██╗██║██║░░██║██╔══╝░░
     *    ╚█████╔╝░░╚██╔╝░░███████╗██║░░██║██║░░██║██║██████╔╝███████╗
     *    ░╚════╝░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═════╝░╚══════╝
     */

    /// @notice Sets the baseURI which will be used to generate tokenURIs
    /// @dev Refer to tokenURI function for additional information.
    function _baseURI() internal view override returns (string memory) {
        return base;
    }

    /// @notice Sets the first tokenId that will be minted.
    /// @dev Override for ERC721A _startTokenId to change from default 0 -> 1
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /// @notice Returns the metadata URI for a given token.
    /// @dev Override for ERC721A tokenURI.
    /// @param tokenId The id of the token in this collection to retrieve the URI for. Must exist.
    /// @return The baseURI suffixed with ./{tokenId}.json
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) revert NonExistentToken();
        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        "/",
                        StringsUpgradeable.toString(tokenId),
                        ".json"
                    )
                )
                : placeholderURI;
    }

    /// @notice Required override for supportsInterface(bytes4).
    /// @param interfaceId bytes4 id per interface or contract
    ///  calculated by ERC165 standards automatically
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721AUpgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return (
            interfaceId == type(CandyCollection2981RoyaltiesUpgradeable).interfaceId ||
            interfaceId == type(OwnableUpgradeable).interfaceId ||
            super.supportsInterface(interfaceId)
        );
    }

    /// @dev Override enable transfer of voting units to new recipient
    ///  after a token transfer.
    function _afterTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        // For governance (See Votes.sol)
        _transferVotingUnits(from, to, quantity);
        super._afterTokenTransfers(from, to, startTokenId, quantity);
    }
}