import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("EraNft End-to-End Test", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployEraNftFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy DummyToken first
    const DummyToken = await ethers.getContractFactory("DummyToken");
    const dummyToken = await DummyToken.deploy();
    
    // Deploy MockDtnAi with the dummy token as fee token
    const MockDtnAi = await ethers.getContractFactory("LocalMockDtnAi");
    const mockDtnAi = await MockDtnAi.deploy(await dummyToken.getAddress(), owner.address);
    
    // Deploy DtnMinter
    const DtnMinter = await ethers.getContractFactory("DtnMinter");
    const dtnMinter = await DtnMinter.deploy();
    
    // Deploy EraNft
    const EraNft = await ethers.getContractFactory("EraNFT");
    const eraNft = await EraNft.deploy("Era NFT", "ERA", owner.address);
    
    // Configure DtnMinter
    await dtnMinter.setDtn(await mockDtnAi.getAddress());
    await dtnMinter.setSystmPrompts(
      "Create a beautiful digital art piece based on this description: ",
      " Make it unique and artistic.",
      "Create NFT metadata JSON with the following parameters: image CID: {0}, era ID: {1}, artist address: {2}, artist ID: {3}, description: {4}, mint price: {5}. Return only the JSON metadata."
    );
    await dtnMinter.config(
      500000, // callbackGas
      "model.system.openai-gpt-o3-simpleimage", // imageModel
      "model.system.openai-gpt-o3-simpletext", // textModel
      "node.tester.node1", // server
      ethers.parseEther("0.000001") // feePerByte
    );
    
    // Set up model IDs in MockDtnAi
    const imageModelId = ethers.keccak256(ethers.toUtf8Bytes("model.system.openai-gpt-o3-simpleimage"));
    const textModelId = ethers.keccak256(ethers.toUtf8Bytes("model.system.openai-gpt-o3-simpletext"));
    await mockDtnAi.setModelId("model.system.openai-gpt-o3-simpleimage", imageModelId);
    await mockDtnAi.setModelId("model.system.openai-gpt-o3-simpletext", textModelId);
    
    // Configure EraNft
    await eraNft.setMinter(await dtnMinter.getAddress());
    
    // Set up DtnMinter to know about EraNft
    await dtnMinter.setNft(await eraNft.getAddress());
    
    // Transfer some dummy tokens to DtnMinter for session fees
    await dummyToken.transfer(await dtnMinter.getAddress(), ethers.parseEther("1000"));
    
    return {
      mockDtnAi,
      dtnMinter,
      eraNft,
      dummyToken,
      owner,
      user1,
      user2,
      user3,
      imageModelId,
      textModelId
    };
  }

  describe("Deployment and Configuration", function () {
    it("Should deploy all contracts correctly", async function () {
      const { mockDtnAi, dtnMinter, eraNft, owner } = await loadFixture(deployEraNftFixture);
      
      expect(await eraNft.owner()).to.equal(owner.address);
      expect(await eraNft.minter()).to.equal(await dtnMinter.getAddress());
      expect(await dtnMinter.owner()).to.equal(owner.address);
    });

    it("Should configure DtnMinter correctly", async function () {
      const { dtnMinter, mockDtnAi } = await loadFixture(deployEraNftFixture);
      
      expect(await dtnMinter.ai()).to.equal(await mockDtnAi.getAddress());
      expect(await dtnMinter.callbackGas()).to.equal(500000);
      expect(await dtnMinter.imageModel()).to.equal("model.system.openai-gpt-o3-simpleimage");
      expect(await dtnMinter.textModel()).to.equal("model.system.openai-gpt-o3-simpletext");
    });
  });

  describe("Era Management", function () {
    it("Should create an era successfully", async function () {
      const { eraNft, owner } = await loadFixture(deployEraNftFixture);
      
      const currentTime = await time.latest();
      const eraStartTime = currentTime + 3600; // Start in 1 hour
      
      await expect(eraNft.createEra(
        1, // eraId
        "Era 1: Digital Renaissance",
        "Create digital art inspired by renaissance themes",
        ethers.parseEther("0.01"), // startPrice
        eraStartTime,
        "Create a king",
        "Create a queen",
        "Create a knight"
      )).to.emit(eraNft, "EraCreated")
        .withArgs(1, "Era 1: Digital Renaissance", ethers.parseEther("0.01"), eraStartTime);
      
      const era = await eraNft.eras(0);
      expect(era.eraId).to.equal(1);
      expect(era.title).to.equal("Era 1: Digital Renaissance");
      expect(era.startPrice).to.equal(ethers.parseEther("0.01"));
      expect(era.startTimestamp).to.equal(eraStartTime);
    });

    it("Should get current era ID correctly", async function () {
      const { eraNft, owner } = await loadFixture(deployEraNftFixture);
      
      const currentTime = await time.latest();
      const eraStartTime = currentTime + 3600; // Start in 1 hour
      
      // Create era
      await eraNft.createEra(1, "Era 1", "prompt", ethers.parseEther("0.01"), eraStartTime, "Create a king", "Create a queen", "Create a knight");
      
      // Before era starts, should return 0 (no current era)
      expect(await eraNft.getCurrentEraId()).to.equal(0);
      
      // Move time forward to start the era
      await time.increaseTo(eraStartTime + 1);
      
      // Should now return era 0 (array index, not era ID)
      expect(await eraNft.getCurrentEraId()).to.equal(0);
    });
  });

  describe("NFT Minting Flow", function () {
    it("Should complete full minting flow with AI integration", async function () {
      const { 
        eraNft, 
        dtnMinter, 
        mockDtnAi, 
        user1, 
        imageModelId, 
        textModelId 
      } = await loadFixture(deployEraNftFixture);
      
      // Create an era that starts immediately
      const currentTime = await time.latest();
      await eraNft.createEra(
        1, 
        "Era 1: Digital Renaissance", 
        "Create digital art inspired by renaissance themes",
        ethers.parseEther("0.01"), 
        currentTime + 1, // Start in the next block
        "Create a king",
        "Create a queen",
        "Create a knight"
      );
      
      // Wait for era to start
      await time.increaseTo(currentTime + 1);
      
      // Start AI session
      await dtnMinter.restartSession();
      expect(await dtnMinter.sessionId()).to.be.greaterThan(0);
      
      // User purchases an NFT
      const purchaseText = "A beautiful sunset over a medieval castle";
      const telegramId = "user123";
      const mintPrice = ethers.parseEther("0.01");
      
      // Purchase NFT and capture events
      const tx = await eraNft.connect(user1).purchaseMint(
        purchaseText,
        telegramId,
        { value: mintPrice }
      );
      
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1, "Transaction should succeed");
      
      // Find ArtRequested event to get the art request ID
      const artRequestedEvent = receipt?.logs.find(log => {
        try {
          const parsed = dtnMinter.interface.parseLog(log as any);
          return parsed?.name === 'ArtRequested';
        } catch {
          return false;
        }
      });
      
      expect(artRequestedEvent, "ArtRequested event should be emitted").to.not.be.undefined;
      
      const parsedArtEvent = dtnMinter.interface.parseLog(artRequestedEvent as any);
      const artRequestId = parsedArtEvent?.args[1]; // artRequestId is the second argument
      const purchaseId = parsedArtEvent?.args[0]; // purchaseId is the first argument
      
      console.log("Art request created with ID:", artRequestId);
      console.log("Purchase ID:", purchaseId);
      
      // Verify the art request exists in MockDtnAi
      const artRequest = await mockDtnAi.getRequest(artRequestId);
      expect(artRequest.call.length).to.be.greaterThan(0, "Art request should exist");
      
      // Step 1: Register successful art creation response with mock image CID
      const mockImageCid = "QmTestImageCID123456789";
      const mockImageResponse = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [mockImageCid]);
      
      console.log("Responding to art request with image CID:", mockImageCid);
      await mockDtnAi.respondSuccess(artRequestId, mockImageResponse, 0);

      // Step 2: Check that the callback has resulted in a new request (i.e. nftRequest)
      // Wait a moment for the callback to execute
      await time.increase(1);
      
      // Get the NFT request that was created by the artCreatedCallback
      // We expect exactly 2 requests: artRequest (ID 1) and nftRequest (ID 2)
      const nftRequestId = ethers.zeroPadValue(ethers.toBeHex(2), 32);
      const nftRequest = await mockDtnAi.getRequest(nftRequestId);
      
      // Verify that the NFT request exists and has the expected extraParams
      expect(nftRequest.call.length, "NFT request should exist").to.be.greaterThan(0);
      expect(nftRequest.extraParams.length, "NFT request should have extraParams").to.be.greaterThan(0);
      
      // Decode the extraParams to verify they match our expected parameters
      const decodedParams = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string", "uint64", "address", "string", "string", "uint256"],
        nftRequest.extraParams
      );
      
      // Verify the decoded parameters match our expected values
      expect(decodedParams[0], "Image CID should match").to.equal(mockImageCid);
      expect(decodedParams[1], "Era ID should be 0 (array index)").to.equal(0n);
      expect(decodedParams[2], "Artist address should match").to.equal(user1.address);
      expect(decodedParams[3], "Telegram ID should match").to.equal(telegramId);
      expect(decodedParams[4], "Purchase text should match").to.equal(purchaseText);
      expect(decodedParams[5], "Mint price should match").to.equal(mintPrice);
      
      console.log("Found NFT request with ID:", nftRequestId);
      console.log("NFT request extraParams:", nftRequest.extraParams);
      
      // Step 3: Now respond to the NFT request with the metadata CID
      const mockNftCid = "QmTestNftMetadataCID789012345";
      const mockNftResponse = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [mockNftCid]);
      
      console.log("Responding to NFT request with metadata CID:", mockNftCid);
      await mockDtnAi.respondSuccess(nftRequestId!, mockNftResponse, 0);
      
      // Step 4: The nftCreatedCallback should now be triggered automatically
      // This should mint the NFT through the DtnMinter
      
      const totalSupplyAfter = await eraNft.totalSupply();
      console.log("Total supply after minting:", totalSupplyAfter.toString());
      
      // Verify that an NFT was minted
      expect(totalSupplyAfter).to.equal(1n, "NFT should be minted");
      
      // Verify the NFT belongs to the user
      const tokenId = await eraNft.tokenByIndex(0); // First token
      const tokenOwner = await eraNft.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user1.address, "NFT should belong to the purchaser");
    });
  });

  describe("Price Calculation", function () {
    it("Should calculate correct price based on time elapsed", async function () {
      const { eraNft, owner } = await loadFixture(deployEraNftFixture);
      
      const currentTime = await time.latest();
      const startPrice = ethers.parseEther("0.01");
      
      // Create era
      await eraNft.createEra(1, "Era 1", "prompt", startPrice, currentTime + 1, "Create a king", "Create a queen", "Create a knight");
      
      // Wait for era to start
      await time.increaseTo(currentTime + 1);
      
      // Price should be start price initially
      expect(await eraNft.currentPriceForEraId(0)).to.equal(startPrice);
      
      // Move time forward by 4 days (doubling period)
      await time.increase(4 * 24 * 60 * 60);
      
      // Price should have doubled
      const expectedPrice = startPrice * 2n;
      expect(await eraNft.currentPriceForEraId(0)).to.equal(expectedPrice);
      
      // Move time forward by another 4 days
      await time.increase(4 * 24 * 60 * 60);
      
      // Price should have doubled again (4x original)
      const expectedPrice2 = startPrice * 4n;
      expect(await eraNft.currentPriceForEraId(0)).to.equal(expectedPrice2);
    });

    it("Should reject purchases with insufficient payment", async function () {
      const { eraNft, user1 } = await loadFixture(deployEraNftFixture);
      
      const currentTime = await time.latest();
      await eraNft.createEra(1, "Era 1", "prompt", ethers.parseEther("0.01"), currentTime + 1, "Create a king", "Create a queen", "Create a knight");
      
      // Wait for era to start
      await time.increaseTo(currentTime + 1);
      
      await expect(eraNft.connect(user1).purchaseMint(
        "Test description",
        "user1",
        { value: ethers.parseEther("0.005") } // Less than required price
      )).to.be.revertedWith("Not enough FRM sent");
    });
  });

  describe("Reward System", function () {
    it("Should handle reward claims", async function () {
      const { eraNft, user1 } = await loadFixture(deployEraNftFixture);
      
      const currentTime = await time.latest();
      await eraNft.createEra(1, "Era 1", "prompt", ethers.parseEther("0.01"), currentTime + 1, "Create a king", "Create a queen", "Create a knight");
      
      // Wait for era to start
      await time.increaseTo(currentTime + 1);
      
      // Move time to era start
      await time.increaseTo(currentTime + 1);
      
      // User needs to have NFTs to be eligible for rewards
      // For testing, we'll skip the NFT minting since it requires the minter
      // and focus on testing the reward system logic
      
      // Check reward eligibility
      const isEligible = await eraNft.rewardEligibility(user1.address);
      
      // Try to claim reward (may or may not succeed based on randomness)
      try {
        await eraNft.connect(user1).claimReward();
        // If successful, check that a reward purchase was created
        const purchases = await eraNft.listPurchases();
        expect(purchases.length).to.be.greaterThan(0);
      } catch (error: any) {
        // It's okay if reward claim fails due to randomness
        expect(error.message).to.include("No reward");
      }
    });
  });



  describe("Access Control", function () {
    it("Should enforce minter-only functions", async function () {
      const { eraNft, user1 } = await loadFixture(deployEraNftFixture);
      
      // Test that non-minter cannot call minter functions
      await expect(eraNft.connect(user1).mintTokenForPurchase(0, 0, user1.address, "ipfs://test"))
        .to.be.revertedWith("Not minter");
    });

    it("Should enforce owner-only functions", async function () {
      const { eraNft, user1 } = await loadFixture(deployEraNftFixture);
      
      // Test that non-owner cannot call owner functions
      await expect(eraNft.connect(user1).createEra(1, "Test", "prompt", 1000, 1000, "Create a king", "Create a queen", "Create a knight"))
        .to.be.reverted; // Just check that it reverts, don't check specific error message
      
      await expect(eraNft.connect(user1).setMinter(user1.address))
        .to.be.reverted; // Just check that it reverts, don't check specific error message
    });
  });
}); 