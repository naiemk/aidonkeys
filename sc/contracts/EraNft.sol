// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "./RewardBase.sol";
import "./IDtnMinter.sol";
import "hardhat/console.sol";


contract EraNFT is
    RewardBase,
    ERC721URIStorage,
    ERC721Burnable,
    ERC721Enumerable
{
    struct Era {
        uint64  eraId;
        string  title;
        uint256 startPrice;
        uint256 startTimestamp;
        string kingPrompt;
        string queenPrompt;
        string knightPrompt;
    }

    struct Purchase {
        uint64  id;
        string  text;
        string  telegramId;
        uint256 purchasePrice;
        uint64  eraId;
        address purchaser;
        Reward  reward;
    }

    uint256 public doublingPeriod = 4 * 24 * 60 * 60; // 4 days
    uint64 public lastEra;
    Era[] public eras;
    mapping(uint64 => uint256[]) public _tokensByEra;
    uint64 public nextPurchaseId = 1;
    address public minter;

    event EraCreated(uint64 indexed eraId, string title, uint256 startPrice, uint256 startTimestamp);
    event PurchaseRequested(uint64 indexed purchaseId, address indexed purchaser, uint64 eraId, uint256 price, Reward reward);
    event TokenMinted(uint256 indexed tokenId, uint64 indexed purchaseId, address minter);

    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    )
        ERC721(_name, _symbol)
        Ownable(_owner)
    {
        minter = msg.sender;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "Not minter");
        _;
    }

    function _createRewardPurcase(
        address user,
        uint64 eraId,
        Reward r
    )
        internal
        override
    {
        uint64 newId = nextPurchaseId++;
        string memory prompt = r == Reward.KING ? eras[eraId].kingPrompt :
            r == Reward.QUEEN ? eras[eraId].queenPrompt : eras[eraId].knightPrompt;
        IDtnMinter(minter).mintRequestRaw{value: msg.value}(
            newId, eraId, prompt, msg.sender, "", msg.value);

        emit PurchaseRequested(newId, user, eraId, 0, r);
    }

    function setDoublingPeriod(uint256 _val) external onlyOwner {
        doublingPeriod = _val;
    }

    function setMinter(address _val) external onlyOwner {
        minter = _val;
    }

    function rewardEligibility(address user) external view returns (bool) {
        return _determineRewardEligibility(user, _getCurrentEraId(), balanceOf(user));
    }

    function claimReward() external virtual payable {
        uint64 eraId = currentEraId();
        if (!_determineRewardEligibility(msg.sender, eraId, balanceOf(msg.sender))) {
            revert("No reward");
        }
        Reward r = _determineRewardType(msg.sender);
        if (r == Reward.NONE) {
            revert("No reward type");
        }
        userRewards[msg.sender]++;
        _createRewardPurcase(msg.sender, eraId, r);
    }

    function createEra(
        uint64 _eraId,
        string memory _title,
        string memory _eraPrompt,
        uint256 _startPrice,
        uint256 _startTimestamp,
        string memory _kingPrompt,
        string memory _queenPrompt,
        string memory _knightPrompt
    )
        external
        onlyOwner
    {
        Era memory e = Era({
            eraId: _eraId,
            title: _title,
            startPrice: _startPrice,
            startTimestamp: _startTimestamp,
            kingPrompt: _kingPrompt,
            queenPrompt: _queenPrompt,
            knightPrompt: _knightPrompt
        });
        eras.push(e);
        IDtnMinter(minter).addEra(_eraId, _eraPrompt);
        emit EraCreated(_eraId, _title, _startPrice, _startTimestamp);
    }

    function getCurrentEraId() external view returns (uint64) {
        return _getCurrentEraId();
    }

    /**
     * @dev Returns the current era id. Updates the lastEra if the currentEraId is different.
     * @return The current era id.
     */
    function currentEraId() internal returns (uint64) {
        uint64 _currentEraId = _getCurrentEraId();
        if (_currentEraId != lastEra) {
            lastEra = _currentEraId;
        }
        return _currentEraId;
    }

    function _getCurrentEraId() internal view returns (uint64) {
        uint64 eraFound = lastEra;
        uint eraLen = eras.length;
        while (eraFound < eraLen - 1) {
            if (eras[eraFound + 1].startTimestamp > block.timestamp) {
                return eraFound;
            }
            eraFound++;
        }
        return eraFound;
    }

    function purchaseMint(
        string memory _text,
        string memory _telegramId
    )
        external
        payable
    {
        uint64 _eraId = currentEraId();
        Era memory era = _getEra(_eraId);
        uint256 requiredPrice = currentPriceForEra(era);
        require(msg.value >= requiredPrice, "Not enough FRM sent");
        uint64 purchaseId = nextPurchaseId++;
        IDtnMinter(minter).mintRequest{value: msg.value}(purchaseId, _eraId, _text, msg.sender, _telegramId, msg.value);
        emit PurchaseRequested(purchaseId, msg.sender, _eraId, msg.value, Reward.NONE);
    }

    function mintTokenForPurchase(
        uint64 eraId,
        uint64 purchaseId, // The index of the purchase in the pendingPurchases array
        address purchaser,
        string memory _tokenURI
    )
        external
        onlyMinter
    {
        console.log("Minting token for purchase", purchaseId);
        uint256 newTokenId = totalSupply() + 1;
        _safeMint(purchaser, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        if (eraId != 0) {
            _tokensByEra[eraId].push(newTokenId);
        }
        emit TokenMinted(newTokenId, purchaseId, msg.sender);
    }

    function currentPriceForEraId(uint64 _eraId) external view returns (uint256) {
        Era memory _era = _getEra(_eraId);
        return currentPriceForEra(_era);
    }

    function currentPriceForEra(Era memory era) internal view returns (uint256) {
        require(block.timestamp >= era.startTimestamp, "Era not started");
        uint256 timeElapsed = block.timestamp - era.startTimestamp;
        require(timeElapsed < 32 days, "Exceeded 32 days");
        uint256 dp = doublingPeriod;
        uint256 blocks = timeElapsed / dp;
        uint256 leftover = timeElapsed % dp;
        uint256 doubledFactor = 1 << blocks;
        uint256 doubledPrice = era.startPrice * doubledFactor;
        uint256 fraction = (leftover * 1e18) / dp;
        uint256 finalPrice = (doubledPrice * (1e18 + fraction)) / 1e18;
        return finalPrice;
    }

    function getMintedTokensByEraLength(uint64 _eraId) external view returns (uint256) {
        return _tokensByEra[_eraId].length;
    }

    function getMintedTokensByEra(
        uint64 _eraId,
        uint256 startIndex,
        uint256 endIndex
    )
        external
        view
        returns (uint256[] memory result)
    {
        uint256 length = _tokensByEra[_eraId].length;
        require(startIndex < length, "startIndex out of range");
        if (endIndex == 0 || endIndex >= length) {
            endIndex = length - 1;
        }
        require(endIndex >= startIndex, "endIndex < startIndex");
        uint256 size = endIndex - startIndex + 1;
        result = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = _tokensByEra[_eraId][startIndex + i];
        }
        return result;
    }

    function sweep(address payable _to, uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Not enough balance");
        _to.transfer(_amount);
    }

    receive() external payable {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _getEra(uint64 _eraId) internal view returns (Era memory) {
        return eras[_eraId];
    }

    function _increaseBalance(address account, uint128 value) internal virtual override (ERC721, ERC721Enumerable){
        ERC721Enumerable._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override (ERC721, ERC721Enumerable)
    returns (address) {
        return ERC721Enumerable._update(to, tokenId, auth);
    }
}
