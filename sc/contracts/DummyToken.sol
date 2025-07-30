// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DummyToken
 * @notice A simple ERC20 token for testing purposes
 */
contract DummyToken is ERC20 {
    constructor() ERC20("Dummy Token", "DUMMY") {
        _mint(msg.sender, 1000000 * 10**decimals()); // Mint 1 million tokens
    }
} 