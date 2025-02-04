#!/usr/bin/env node
import OpenAI from "openai";
import axios from "axios";
import pinataSDK from '@pinata/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import { Readable } from 'stream';
dotenv.config({path: './localConfig/.env'});

/**
 * Ethers v6 imports
 */
import {
  Wallet,
  Contract,
  JsonRpcProvider,
  // BigNumberish, // if needed
} from "ethers";

// ------ Types, Interfaces, and Enums ------ //

const DEFAULT_CONFIG_FILE = "./localConfig/config.json";

// Matches the on-chain enum Reward
enum Reward {
  NONE,
  KING,
  QUEEN,
  KNIGHT
}

// Matches the on-chain struct Purchase
interface Purchase {
  id: number;
  text: string;
  telegramId: string;
  purchasePrice: string; // or number | BigNumber, depending on usage
  eraId: string;
  purchaser: string;
  reward: Reward;
}

// Our configuration interface
interface Config {
  providers: Record<string, string>;
  contract: Record<string, string>;
  execution: string[];
  api: {
    openai: string;
    pinata_key: string;
    pinata_secret: string;
  };
  promptTemplateForEra: Record<string, string>; // e.g. { 1: "Era1 Prompt: <<>>", 2: "Era2 Prompt: <<>>" }
  descriptionForEra: Record<string, string>; // e.g. { 1: "Era1 Description: ", 2: "Era2 Description: " }
  specialPrompts: {
    king: string;
    queen: string;
    knight: string;
  };
  img: {
    width: number;
    height: number;
  };
}

function loadConfig(): Config {
  const configFile = process.env.CONFIG_FILE || DEFAULT_CONFIG_FILE;
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  return config;
}

// ------ Example local config (adapt to your needs) ------ //
const config: Config = loadConfig();

// ------ Contract ABI ------ //

// Minimal ABI for the two functions we need:
const CONTRACT_ABI = [
  "function listPurchases() external view returns (tuple(uint64 id, string text, string telegramId, uint256 purchasePrice, uint64 eraId, address purchaser, uint8 reward)[] memory)",
  "function multipleMintTokenForPurchase(uint64 fromIndex, uint64 toIndexInclusive, string[] calldata _tokenURIs) external",
];

// ------ Environment variables ------ //
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set");
}

function setupForChain(chainId: string) {
  console.log(`Setting up for chain ${chainId}: ${config.providers[chainId]}`);
  const providerUrl = config.providers[chainId];
  if (!providerUrl) {
    throw new Error(`Provider URL for chain ${chainId} not found`);
  }
  const provider = new JsonRpcProvider(providerUrl);
  const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
  const contract = new Contract(config.contract[chainId], CONTRACT_ABI, wallet) as any;
  return { provider, wallet, contract };
}

// ------ OpenAI Setup ------ //
const openai = new OpenAI({
  apiKey: config.api.openai
});

// ------ Pinata Setup ------ //
const pinata = new pinataSDK(config.api.pinata_key, config.api.pinata_secret);

// Helper: Sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ------ Generate Prompt for a Purchase ------ //
async function generatePromptForPurchase(purchase: Purchase): Promise<string> {
  if (purchase.reward == Reward.NONE) {
    // Use era-based prompt
    const eraPromptTemplate = config.promptTemplateForEra[purchase.eraId];
    if (!eraPromptTemplate) {
      throw new Error(`Prompt template for era ${purchase.eraId} not found`);
    }
    return eraPromptTemplate.replace("<<>>", purchase.text);
  } else {
    // Use special prompt based on reward
    switch (Number(purchase.reward)) {
      case Reward.KING:
        return config.specialPrompts.king;
      case Reward.QUEEN:
        return config.specialPrompts.queen;
      case Reward.KNIGHT:
        return config.specialPrompts.knight;
      default:
        throw new Error(`Invalid reward: ${purchase.reward}`);
    }
  }
}

// ------ Create DALL·E Image ------ //
async function createDalleImage(prompt: string, width: number, height: number): Promise<string> {
  const sizeString = `${width}x${height}` as any;
  
  const response = await openai.images.generate({
    prompt,
    n: 1,
    size: sizeString
  });

  // The URL to the generated image
  const imageUrl = response.data[0]?.url;
  if (!imageUrl) {
    throw new Error("Failed to get image URL from OpenAI response");
  }
  return imageUrl;
}

// ------ Upload Image to Pinata ------ //
async function uploadImageToPinata(imageUrl: string): Promise<{
  ipfsHash: string;
  ipfsUrl: string;
  httpUrl: string;
}> {
  // 1) Download the image from OpenAI
  const imageResp = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer" });
  const file = Buffer.from(imageResp.data);
  const tmpFile = '/tmp/node_temp_storage.png';
  fs.writeFileSync(tmpFile, file);

  // 2) Pin file to IPFS via Pinata
  let pinataRes;
  try {
    pinataRes = await pinata.pinFromFS(tmpFile, {
      pinataMetadata: { name: `ai-donkey-${Date.now()}.png` },
      pinataOptions: {
          cidVersion: 0
      }});
    console.log('pinataRes', pinataRes);
  } catch (err) {
    console.error('Error pinning file to IPFS:', err);
    throw err;
  }

  const ipfsHash = pinataRes.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;
  // Or a gateway-based URL:
  const httpUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  return { ipfsHash, ipfsUrl, httpUrl };
}

function nftName(purchase: Purchase) {
  if (purchase.reward == Reward.NONE)
  {
    return `AI Donkey By #${purchase.purchaser}`;
  }
  switch (purchase.reward) {
    case Reward.KING:
      return "His Majesty the King";
    case Reward.QUEEN:
      return "Her Majesty the Queen";
    case Reward.KNIGHT:
      return "Protector of the Kingdom";
  }
}

// ------ Build NFT Metadata ------ //
function buildNftMetadata(
  purchase: Purchase,
  imageHttpUrl: string,
  imageIpfsUrl: string
): any {
  return {
    name: nftName(purchase),
    description: config.descriptionForEra[purchase.eraId] + purchase.text,
    image: imageIpfsUrl, // Some prefer ipfs://... but you can also use the gateway link
    external_url: imageHttpUrl,
    attributes: [
      {
        trait_type: "Era",
        value: purchase.eraId
      },
      {
        trait_type: "Reward",
        value: Reward[purchase.reward] // e.g. "KING", "QUEEN", etc.
      }
    ],
    purchaseInfo: {
      id: purchase.id,
      telegramId: purchase.telegramId,
      purchasePrice: purchase.purchasePrice,
      eraId: purchase.eraId,
      purchaser: purchase.purchaser,
      reward: Reward[purchase.reward]
    }
  };
}

// ------ Upload Metadata to Pinata ------ //
async function uploadMetadataToPinata(metadata: any): Promise<string> {
  console.log('metadata', metadata);
  const pinataRes = await pinata.pinJSONToIPFS(metadata, {
    pinataMetadata: { name: `nft-metadata-${Date.now()}` }
  });

  const ipfsHash = pinataRes.IpfsHash;
  // You can return IPFS URI or HTTP gateway:
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
}

// ------ Process a Batch of Purchases ------ //
async function processPurchases(fromPurchaseId: number, toPurchaseId: number, purchases: Purchase[], chainId: string): Promise<void> {
  const purchaseIds: number[] = [];
  const tokenURIs: string[] = [];

  for (const purchase of purchases) {
    try {
      // 1) Generate prompt
      const prompt = await generatePromptForPurchase(purchase);
      console.log(`[Purchase #${purchase.id}] Generated prompt: "${prompt}"`);

      // 2) Create image with DALL·E
      const imageUrl = await createDalleImage(prompt, config.img.width, config.img.height);
      console.log(`[Purchase #${purchase.id}] Created image with DALL·E: "${imageUrl}"`);

      // 3) Upload image to IPFS
      console.log(`[Purchase #${purchase.id}] Uploading image to IPFS...`);
      const { ipfsUrl: imageIpfsUrl, httpUrl: imageHttpUrl } = await uploadImageToPinata(imageUrl);
      console.log(`[Purchase #${purchase.id}] Uploaded image to IPFS: "${imageIpfsUrl}"`);

      // 4) Create metadata
      const nftMetadata = buildNftMetadata(purchase, imageHttpUrl, imageIpfsUrl);
      console.log(`[Purchase #${purchase.id}] Created metadata: "${JSON.stringify(nftMetadata)}"`);

      // 5) Upload metadata to IPFS
      console.log(`[Purchase #${purchase.id}] Uploading metadata to IPFS...`);
      const metadataUri = await uploadMetadataToPinata(nftMetadata);
      console.log(`[Purchase #${purchase.id}] Uploaded metadata to IPFS: "${metadataUri}"`);

      // Accumulate purchaseIds and tokenURIs for batch mint
      purchaseIds.push(purchase.id);
      tokenURIs.push(metadataUri);
    } catch (err) {
      console.error(`[Purchase #${purchase.id}] Error processing purchase:`, err);
      // In production, consider robust retries or error handling
    }
  }

  const { wallet, contract } = setupForChain(chainId);
  // 6) Mint in batch if we have any successful URIs
  if (purchaseIds.length > 0) {
    console.log(`Minting ${purchaseIds.length} tokens in batch...`);
    console.log('purchaseIds', purchaseIds);
    console.log('tokenURIs', tokenURIs);
    const txResponse = await contract.connect(wallet).multipleMintTokenForPurchase(
      fromPurchaseId, toPurchaseId, tokenURIs, {gasLimit: 7000000});
    console.log("Waiting for transaction receipt...", txResponse.hash);
    const receipt = await txResponse.wait();
    console.log(`Batch mint succeeded in block #${receipt.blockNumber}. Tx Hash: ${receipt.transactionHash}`);
  }
}

async function runOnce(chainId: string) {
  try {
    // 1) Fetch all purchases (if your contract returns only unminted, that's simpler)
    console.log("Calling listPurchases()...");
    const { wallet, contract } = setupForChain(chainId);
    const onChainPurchases: any[] = await contract.connect(wallet).listPurchases();

    // 2) Map them to our TS interface
    const purchases: Purchase[] = onChainPurchases.map((p) => ({
      id: Number(p.id),
      text: p.text,
      telegramId: p.telegramId,
      purchasePrice: p.purchasePrice.toString(),
      eraId: Number(p.eraId).toString(),
      purchaser: p.purchaser,
      reward: p.reward
    }));

    if (purchases.length === 0) {
      console.log("No purchases found. Sleeping...");
      await sleep(15000); // 15 sec
      return;
    }

    // 3) Process in batches (up to 20)
    const BATCH_SIZE = 20;
    for (let i = 0; i < purchases.length; i += BATCH_SIZE) {
      const batch = purchases.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch of size ${batch.length}...`);
      await processPurchases(i, Math.min(i + BATCH_SIZE - 1, purchases.length - 1), batch, chainId);
    }
  } catch (err) {
    console.error("Error in mainLoop:", err);
    throw err;
  }
}

// ------ Main Loop ------ //
async function mainLoop(): Promise<void> {
  while (true) {
    for (const chainId of config.execution) {
      await runOnce(chainId);
    }
    // 4) Wait before next iteration
    console.log("Waiting 60 seconds before next loop...");
    await sleep(60000);
  }
}

// const IM_URL = "https://oaidalleapiprodscus.blob.core.windows.net/private/org-ioCcRDMl9Kr8lh1UpqJYop2y/user-q3YwHbOmj7GgvitBRcnkEb1q/img-Q6cFwTvOUWR5AJrpyabRjMKG.png?st=2025-01-31T22%3A20%3A35Z&se=2025-02-01T00%3A20%3A35Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-01-31T19%3A20%3A04Z&ske=2025-02-01T19%3A20%3A04Z&sks=b&skv=2024-08-04&sig=giWIyjN2d%2BDoJvInX3qKPSKr0cL08ACNoWOZGSBOpfU%3D";
// uploadImageToPinata(IM_URL).then((res) => {
//   console.log(res);
// });

// ------ Entry Point ------ //
(async () => {
  if (process.argv.find((arg) => arg === "once")) {
    await runOnce(config.execution[0]);
  } else {
    await mainLoop();
  }
})();
