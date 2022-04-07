/***
 *    ░█████╗░░█████╗░███╗░░██╗██████╗░██╗░░░██╗  ░█████╗░██████╗░███████╗░█████╗░████████╗░█████╗░██████╗░
 *    ██╔══██╗██╔══██╗████╗░██║██╔══██╗╚██╗░██╔╝  ██╔══██╗██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
 *    ██║░░╚═╝███████║██╔██╗██║██║░░██║░╚████╔╝░  ██║░░╚═╝██████╔╝█████╗░░███████║░░░██║░░░██║░░██║██████╔╝
 *    ██║░░██╗██╔══██║██║╚████║██║░░██║░░╚██╔╝░░  ██║░░██╗██╔══██╗██╔══╝░░██╔══██║░░░██║░░░██║░░██║██╔══██╗
 *    ╚█████╔╝██║░░██║██║░╚███║██████╔╝░░░██║░░░  ╚█████╔╝██║░░██║███████╗██║░░██║░░░██║░░░╚█████╔╝██║░░██║
 *    ░╚════╝░╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░░░░╚═╝░░░  ░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝
 *
 *
 *
 *
 *  “Growing up, I slowly had this process of realizing that all the things around me that people had told me
 *  were just the natural way things were, the way things always would be, they weren’t natural at all.
 *  They were things that could be changed, and they were things that, more importantly, were wrong and should change,
 *  and once I realized that, there was really no going back.”
 *
 *    ― Aaron Swartz (1986-2013)
 *
 *
 * Version: VALHALLA
 *
 * Purpose: ERC-721 template for no-code users.
 *          Placeholder for pre-reveal information.
 *          Guaranteed mint royalties with CandyPaymentSplitter.
 *          EIP-2981 compliant secondary sale collection-wide royalties with CandyCollection2981Royalties.
 *          Whitelist functionality utilizing getAux from ERC721A.
 *          Deployable to ETH, AVAX, BNB, MATIC, FANTOM chains on https://candychain.io.
 *
 */

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Royalties/CandyCollection2981RoyaltiesUpgradeable.sol";
import "../PaymentSplitter/CandyPaymentSplitterUpgradeable.sol";
import "./ERC721AUpgradeable.sol";

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

contract CandyCreator721AUpgradeable is
    Initializable,
    ERC721AUpgradeable,
    OwnableUpgradeable,
    CandyCollection2981RoyaltiesUpgradeable,
    CandyPaymentSplitterUpgradeable
    
{
    // @notice basic state variables
    string private base;
    bool private mintingActive;
    bool private lockedPayees;
    uint256 private maxPublicMints;
    uint256 private mintPrice;
    uint256 private mintSize;
    string private placeholderURI;

    // @notice Whitelist functionality
    bool private whitelistActive;
    bytes32 private whitelistMerkleRoot;
    uint64 private maxWhitelistMints;

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

    function initialize(
        // 32 bytes 1 slot
        string memory name,
        // 32 bytes 1 slot 
        string memory symbol,
        // 32 bytes 1 slot 
        string memory _placeholderURI,
        // 32 bytes 1 slot 
        uint256 _mintPrice,
        // 32 bytes 1 slot
        uint256 _mintSize,
        // 32 bytes per element, x slots 
        address[] memory splitAddresses,
        // 32 bytes per element, x slots 
        // Can use uint16 (max value 65535) since an element in splitShares cannot be greater than 9,500.
        uint256[] memory splitShares,
        // 32 bytes 1 slot 
        bytes32 _whitelistMerkleRoot,
        // 20 bytes (could take this out?)
        address candyWallet
    )   public initializer {
        __ERC721A_init(name, symbol);
        setupPaymentSplit(candyWallet, splitAddresses, splitShares);
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

    // Used to attempt to eliminate stack too deep errors with initializer
    function setupPaymentSplit(address candyWallet, address[] memory splitAddresses, uint256[] memory splitShares) private {
        addPayee(candyWallet, 500);
        if (splitAddresses.length == 0) {
            addPayee(_msgSender(), 9500);
            lockPayees();
        } else {
            for (uint256 i = 0; i < splitAddresses.length; i++) {
                addPayee(splitAddresses[i], splitShares[i]);
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
     */

    // @notice this is the mint function, mint Fees in ERC20,
    //  requires amount * mintPrice to be sent by caller
    // @param uint amount - number of tokens minted
    function whitelistMint(bytes32[] calldata merkleProof, uint64 amount)
        external
        payable
    {
        // @notice using Checks-Effects-Interactions
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

    // @notice this is the mint function, mint Fees in ERC20,
    //  requires amount * mintPrice to be sent by caller
    // @param uint amount - number of tokens minted
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
     * This section pertains to mint fees, royalties, and fund release.
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

    // @notice will release funds from the contract to the addresses
    // owed funds as passed to constructor
    function release() external onlyOwner {
        _release();
    }

    // @notice this will use internal functions to set EIP 2981
    //  found in IERC2981.sol and used by ERC2981Collections.sol
    // @param address _royaltyAddress - Address for all royalties to go to
    // @param uint256 _percentage - Precentage in whole number of comission
    //  of secondary sales
    function setRoyaltyInfo(address _royaltyAddress, uint256 _percentage)
        public
        onlyOwner
    {
        _setRoyalties(_royaltyAddress, _percentage);
        emit UpdatedRoyalties(_royaltyAddress, _percentage);
    }

    // @notice this will set the fees required to mint using
    //  publicMint(), must enter in wei. So 1 ETH = 10**18.
    // @param uint256 _newFee - fee you set, if ETH 10**18, if
    //  an ERC20 use token's decimals in calculation
    function setMintPrice(uint256 _newFee) public onlyOwner {
        uint256 oldFee = mintPrice;
        mintPrice = _newFee;
        emit UpdatedMintPrice(oldFee, mintPrice);
    }

    // @notice will add an address to PaymentSplitter by owner role
    // @param address newAddy - address to recieve payments
    // @param uint newShares - number of shares they recieve
    function addPayee(address newAddy, uint256 newShares) private {
        require(!lockedPayees, "Can not set, payees locked");
        _addPayee(newAddy, newShares);
    }

    // @notice Will lock the ability to add further payees on PaymentSplitter.sol
    function lockPayees() private {
        require(!lockedPayees, "Can not set, payees locked");
        lockedPayees = true;
        emit PayeesLocked(lockedPayees);
    }

    /***
     *
     *    ░█████╗░██████╗░███╗░░░███╗██╗███╗░░██╗
     *    ██╔══██╗██╔══██╗████╗░████║██║████╗░██║
     *    ███████║██║░░██║██╔████╔██║██║██╔██╗██║
     *    ██╔══██║██║░░██║██║╚██╔╝██║██║██║╚████║
     *    ██║░░██║██████╔╝██║░╚═╝░██║██║██║░╚███║
     *    ╚═╝░░╚═╝╚═════╝░╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝
     * This section pertains to to basic contract administration tasks.
     */

    // @notice this will enable publicMint()
    function enableMinting() external onlyOwner {
        if (mintingActive) revert MintingActive();
        bool old = mintingActive;
        mintingActive = true;
        emit UpdatedMintStatus(old, mintingActive);
    }

    // @notice this will disable publicMint()
    function disableMinting() external onlyOwner {
        if (!mintingActive) revert MintingNotActive();
        bool old = mintingActive;
        mintingActive = false;
        emit UpdatedMintStatus(old, mintingActive);
    }

    // @notice this will enable whitelist or "if" in publicMint()
    function enableWhitelist() public onlyOwner {
        if (whitelistActive) revert WhitelistRequired();
        bool old = whitelistActive;
        whitelistActive = true;
        emit UpdatedWhitelistStatus(old, whitelistActive);
    }

    // @notice this will disable whitelist or "else" in publicMint()
    function disableWhitelist() external onlyOwner {
        if (!whitelistActive) revert WhitelistNotRequired();
        bool old = whitelistActive;
        whitelistActive = false;
        emit UpdatedWhitelistStatus(old, whitelistActive);
    }

    // @notice this will set a new Merkle root used to verify whitelist membership
    // together with a proof submitted to the mint function
    // @param bytes32 _merkleRoot - generated merkleRoot hash
    function setWhitelistMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        bytes32 old = whitelistMerkleRoot;
        whitelistMerkleRoot = _merkleRoot;
        emit UpdatedWhitelist(old, whitelistMerkleRoot);
    }

    // @notice this will set the maximum number of tokens a whitelisted user can mint.
    // @param uint256 _amount - max amount of tokens
    function setMaxWhitelistMints(uint64 _amount) public onlyOwner {
        uint256 oldAmount = maxWhitelistMints;
        maxWhitelistMints = _amount;
        emit UpdatedMaxWhitelistMints(oldAmount, maxWhitelistMints);
    }

    // @notice this will set the maximum number of tokens a single address can mint at a time
    // during the public mint period. Keep in mind that user will be able to transfer their tokens
    // to a different address, and continue minting this amount of tokens on each transaction.
    // If you wish to prevent this, use the whitelist.
    // @param uint256 _amount - max amount of tokens
    function setMaxPublicMints(uint256 _amount) public onlyOwner {
        uint256 oldAmount = maxPublicMints;
        maxPublicMints = _amount;
        emit UpdatedMaxPublicMints(oldAmount, maxWhitelistMints);
    }

    // @notice this updates the base URI for the token metadata
    // it does not emit an event so that it can be set invisibly to purchasers
    // and avoid token sniping
    // @param string _ - max amount of tokens
    function setBaseURI(string memory baseURI) public onlyOwner {
        base = baseURI;
    }

    // @notice will set mint size by owner role
    // @param uint256 _amount - set number to mint
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
     */
    // @notice will return whether minting is enabled
    function mintStatus() external view returns (bool) {
        return mintingActive;
    }

    // @notice will return whitelist status of Minter
    function whitelistStatus() external view returns (bool) {
        return whitelistActive;
    }

    // @notice will return minting fees
    function mintingFee() external view returns (uint256) {
        return mintPrice;
    }

    // @notice will return whitelist status of Minter
    function whitelistMaxMints() external view returns (uint256) {
        return maxWhitelistMints;
    }

    // @notice will return maximum tokens that are allowed to be minted during a single transaction
    // during the whitelist period
    function publicMaxMints() external view returns (uint256) {
        return maxPublicMints;
    }

    // @notice this is a public getter for ETH balance on contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // @notice will return the planned size of the collection
    function collectionSize() external view returns (uint256) {
        return mintSize;
    }

    /***
     *    ░█████╗░██╗░░░██╗███████╗██████╗░██████╗░██╗██████╗░███████╗
     *    ██╔══██╗██║░░░██║██╔════╝██╔══██╗██╔══██╗██║██╔══██╗██╔════╝
     *    ██║░░██║╚██╗░██╔╝█████╗░░██████╔╝██████╔╝██║██║░░██║█████╗░░
     *    ██║░░██║░╚████╔╝░██╔══╝░░██╔══██╗██╔══██╗██║██║░░██║██╔══╝░░
     *    ╚█████╔╝░░╚██╔╝░░███████╗██║░░██║██║░░██║██║██████╔╝███████╗
     *    ░╚════╝░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═════╝░╚══════╝
     */

    // @notice Solidity required override for _baseURI(), if you wish to
    //  be able to set from API -> IPFS or vice versa using setBaseURI(string)
    function _baseURI() internal view override returns (string memory) {
        return base;
    }

    // @notice Override for ERC721A _startTokenId to change from default 0 -> 1
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    // @notice Override for ERC721A tokenURI
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

    // @notice solidity required override for supportsInterface(bytes4)
    // @param bytes4 interfaceId - bytes4 id per interface or contract
    // calculated by ERC165 standards automatically
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;
}