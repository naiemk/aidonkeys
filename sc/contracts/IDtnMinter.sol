// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDtnMinter {
    function mintRequest(uint64 purchaseId, uint64 eraId, string memory text) external;
    function addEra(uint64 eraId, string memory eraPrompts) external;
}