// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract RewardBase is Ownable {
    enum Reward { NONE, KING, QUEEN, KNIGHT }

    mapping(Reward => string) public rewardURIs;
    mapping(address => uint64) public userRewards;
    uint256 public REWARD_CHANCE_BPS = 1000;
    uint256 public KING_BPS = 200;
    uint256 public QUEEN_BPS = 1000;
    uint256 public KNIGHT_BPS = 8800;

    function updateRewardRatiosX10000(uint _chance, uint _king, uint _queen, uint _knight) external onlyOwner {
        REWARD_CHANCE_BPS = _chance;
        KING_BPS = _king;
        QUEEN_BPS = _queen;
        KNIGHT_BPS = _knight;
    }

    function _determineRewardEligibility(address user, uint64 eraId, uint balanceOf)
        internal
        view
        returns (bool)
    {
        if (balanceOf == 0) {
            return false;
        }
        uint256 rand = uint256(keccak256(abi.encodePacked(user, eraId, balanceOf, userRewards[user]))) % 10000;
        return (rand < REWARD_CHANCE_BPS);
    }

    function _determineRewardType(address user)
        internal
        view
        returns (Reward)
    {
        // Create random seed
        bytes32 seed = keccak256(abi.encodePacked(user, block.timestamp, block.prevrandao));
        uint256 rand = uint256(seed) % 10000;
        if (rand < KING_BPS) {
            return Reward.KING;
        } else if (rand < (KING_BPS + QUEEN_BPS)) {
            return Reward.QUEEN;
        } else {
            return Reward.KNIGHT;
        }
    }

    function _createRewardPurcase(
        address user,
        uint64 eraId,
        Reward r
    )
        internal
        virtual;
}