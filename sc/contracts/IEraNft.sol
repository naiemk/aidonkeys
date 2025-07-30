// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEraNft {
    function mintTokenForPurchase(
        uint64 eraId,
        uint64 purchaseId, // The index of the purchase in the pendingPurchases array
        address purchaser,
        string memory _tokenURI
    ) external;
}