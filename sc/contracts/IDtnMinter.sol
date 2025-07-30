// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDtnMinter {
    function mintRequest(
        uint64 purchaseId, uint64 eraId, string memory text, address artist, string memory artistId, uint mintPrice
        ) external payable;
    function mintRequestRaw(
        uint64 purchaseId, uint64 eraId, string memory text, address artist, string memory artistId, uint mintPrice
        ) external payable;
    function addEra(uint64 eraId, string memory _eraPrompts) external;
}