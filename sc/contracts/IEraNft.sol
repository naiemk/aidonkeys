// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEraNft {
    function mintTokenForPurchase(
        uint64 pruchaseIndex, // The index of the purchase in the pendingPurchases array
        string memory _tokenURI
    );
}