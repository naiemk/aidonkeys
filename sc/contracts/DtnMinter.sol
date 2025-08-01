// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@deeptrust/contracts/with-dtn-ai.sol";
import "@deeptrust/contracts/dtn-defaults.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./IDtnMinter.sol";
import "./IEraNft.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "hardhat/console.sol";

contract DtnMinter is WithDtnAi, Ownable, IDtnMinter {
    constructor() Ownable(msg.sender) {}

    struct NftRequest {
        uint64 eraId;
        uint64 purchaseId;
        address artist;
        string artistId;
        string text;
        uint mintPrice;
    }

    mapping(bytes32 => NftRequest) public artRequests;
    mapping(bytes32 => bytes32) public nftRequests; // Point to art request
    uint public sessionId;
    address public nft;
    string public firstLine;
    string public lastLine;
    string public nftCreationPrompt;
    string public gatewayBase = "https://ipfs.io/ipfs/";

    uint public callbackGas;
    string public imageModel = "model.system.openai-gpt-o3-simpleimage";
    string public textModel = "model.system.openai-gpt-o3-simpletext";
    string public server = "node.tester.node1";
    uint public feePerByte = 1 ** 10**(18 - 6);

    event ArtRequested(uint64 indexed purchaseId, bytes32 artRequestId, string text);
    event NftRequested(uint64 indexed purchaseId, bytes32 nftRequestId, bytes32 artRequestId, string cid);
    event NftCreated(uint64 indexed purchaseId, bytes32 nftRequestId, string cid);
    event ArtError(uint64 indexed purchaseId, bytes32 requestId, string message);
    event NftError(uint64 indexed purchaseId, bytes32 requestId, bytes32 artRequestId, string message);

    function setDtn(address _dtnRouter) public onlyOwner {
        WithDtnAi.setAi(_dtnRouter);
    }

    function setNft(address _nft) public onlyOwner {
        nft = _nft;
    }

    function setGatewayBase(string memory _gatewayBase) external onlyOwner {
        gatewayBase = _gatewayBase;
    }

    function config(
        uint _callbackGas, string memory _imageModel, string memory _textModel, string memory _server, uint _feePerByte
        ) external onlyOwner {
        if (_callbackGas != 0) {
            callbackGas = _callbackGas;
        }
        if (bytes(_imageModel).length > 0) {
            imageModel = _imageModel;
        }
        if (bytes(_textModel).length > 0) {
            textModel = _textModel;
        }
        if (bytes(_server).length > 0) {
            server = _server;
        }
        if (_feePerByte != 0) {
            feePerByte = _feePerByte;
        }
    }

    function setSystmPrompts(string memory _firstLine, string memory _lastLine, string memory _nftCreationPrompt) external onlyOwner {
        firstLine = _firstLine;
        lastLine = _lastLine;
        nftCreationPrompt = _nftCreationPrompt;
    }

    function mintRequestRaw(
        uint64 purchaseId, uint64 eraId, string memory text, address artist, string memory artistId, uint mintPrice
        ) external override payable {
        require(msg.sender == nft, "Only nft can add era");
        string[] memory prompt_lines = new string[](1);
        prompt_lines[0] = text;

        _mintRequest(purchaseId, eraId, prompt_lines, artist, artistId, mintPrice);
    }

    function mintRequest(
        uint64 purchaseId, uint64 eraId, string memory text, address artist, string memory artistId, uint mintPrice
        ) external override payable {
        require(msg.sender == nft, "Only nft can add era");
        string[] memory prompt_lines = new string[](3);
        prompt_lines[0] = firstLine;
        prompt_lines[1] = text;
        prompt_lines[2] = lastLine;

        _mintRequest(purchaseId, eraId, prompt_lines, artist, artistId, mintPrice);
    }

    function _mintRequest(
        uint64 purchaseId, uint64 eraId, string[] memory prompt_lines, address artist, string memory artistId, uint mintPrice
        ) internal {
        require(msg.value >= callbackGas * 2, "Insufficient gas");
        if (sessionId == 0) {
            restartSession();
        }

        bytes32 requestId = ai.request{value: callbackGas}(
            sessionId,
            keccak256(abi.encodePacked(imageModel)), // the model ID
            DtnDefaults.defaultCustomNodesValidatedAny(DtnDefaults.singleArray(keccak256(abi.encodePacked(server)))),
            IDtnAi.DtnRequest({
                call: abi.encode(prompt_lines, 1024, 1024),
                extraParams: "",
                calltype: IDtnAi.CallType.IPFS, 
                feePerByteReq: feePerByte,
                feePerByteRes: feePerByte,
                totalFeePerRes: feePerByte * 1024 * 1024 * 10
            }),
            IDtnAi.CallBack(
                this.artCreatedCallback.selector,
                this.aiErrorArt.selector,
                address(this)
            ),
            address(this), 
            callbackGas
        );
        artRequests[requestId] = NftRequest({
            eraId: eraId,
            purchaseId: purchaseId,
            artist: artist,
            artistId: artistId,
            text: prompt_lines.length > 1 ? prompt_lines[1] : prompt_lines[0],
            mintPrice: mintPrice
        });

        emit ArtRequested(purchaseId, requestId, prompt_lines.length > 1 ? prompt_lines[1] : prompt_lines[0]);
    }

    function artCreatedCallback(bytes32 requestId) external onlyDtn {
        // Receive the IPFS CID for the art
        // Pass it to the ai to create the NFT metadata JSON along other information
        (, , bytes memory response) = ai.fetchResponse(requestId);
        string memory cid = abi.decode(response, (string)); // Image CID
        string[] memory prompt_lines = new string[](1);
        prompt_lines[0] = nftCreationPrompt;
        // We encode NFT parameters as ordered set of params here. The prompt must use the following in the right order.
        NftRequest memory request = artRequests[requestId];
        bytes memory extraParamsEncoded = abi.encode(
            cid, // {0}
            request.eraId, // {1:uint64}
            request.artist, // {2:address}
            request.artistId, // {3}
            request.text, // {4}
            request.mintPrice // {5:uint}
        );

        bytes32 nftRequestId = ai.request{value: callbackGas}(
            sessionId,
            keccak256(abi.encodePacked(textModel)), // the model ID
            DtnDefaults.defaultCustomNodesValidatedAny(DtnDefaults.singleArray(keccak256(abi.encodePacked(server)))),
            IDtnAi.DtnRequest({
                call: abi.encode(prompt_lines),
                extraParams: extraParamsEncoded,
                calltype: IDtnAi.CallType.IPFS, 
                feePerByteReq: feePerByte,
                feePerByteRes: feePerByte,
                totalFeePerRes: feePerByte * 1000000
            }),
            IDtnAi.CallBack(
                this.nftCreatedCallback.selector,
                this.aiErrorNft.selector,
                address(this)
            ),
            address(this), 
            callbackGas
        );
        nftRequests[nftRequestId] = requestId;
        emit NftRequested(request.purchaseId, nftRequestId, requestId, cid);
    }

    function nftCreatedCallback(bytes32 requestId) external onlyDtn {
        // Receive the CID for the NFT metadata JSON
        // Mint the NFT on the NFT contract
        (, , bytes memory response) = ai.fetchResponse(requestId);
        console.log("NFT created callback");
        string memory cid = abi.decode(response, (string)); // Image CID
        IEraNft(nft).mintTokenForPurchase(
            artRequests[nftRequests[requestId]].eraId,
            artRequests[nftRequests[requestId]].purchaseId,
            artRequests[nftRequests[requestId]].artist,
            string.concat(gatewayBase, cid)
        );
        emit NftCreated(artRequests[nftRequests[requestId]].purchaseId, requestId, cid);
    }

    function aiErrorArt(bytes32 requestId) external onlyDtn {
        // Handle the error
        // Reject the NFT creation request and refund the payment
        (, string memory message, ) = ai.fetchResponse(requestId);
        uint64 purchaseId = artRequests[requestId].purchaseId;
        emit ArtError(purchaseId, requestId, message);
    }

    function aiErrorNft(bytes32 requestId) external onlyDtn {
        // Handle the error
        // Reject the NFT creation request and refund the payment
        (, string memory message, ) = ai.fetchResponse(requestId);
        uint64 purchaseId = artRequests[nftRequests[requestId]].purchaseId;
        emit NftError(purchaseId, requestId, nftRequests[requestId], message);
    }

    function restartSession() public {
        if (sessionId != 0) {
            ai.closeUserSession(sessionId); // Unused funds will be refunded when we close the session
        }
        uint amount = IERC20(ai.feeToken()).balanceOf(address(this)); // Use what we have to start a session
        require(amount > 0, "Not enough tokens to start a session");
        SafeERC20.safeTransfer(IERC20(ai.feeToken()), ai.feeTarget(), amount);
        sessionId = ai.startUserSession();
    }
}
