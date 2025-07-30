// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@deeptrust/contracts/idtn-ai.sol";
import "@deeptrust/contracts/dtn-defaults.sol";
import "@deeptrust/contracts/MockDtnAi.sol";

/**
 * @title LoadRefs
 * @notice This contract serves as a reference loader for @deeptrust contracts
 * @dev This file ensures that Hardhat can find and compile the @deeptrust contracts
 */
contract LoadRefs {
    // This contract is intentionally empty - it just serves to load the references
    // The actual contracts are imported from @deeptrust/contracts/
    
    constructor() {
        // Empty constructor
    }
} 