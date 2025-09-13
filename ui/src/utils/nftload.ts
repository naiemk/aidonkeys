import { GlobalCache } from "web3-react-ui";
import { ABI, NftMetadata } from "./conf";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function loadTokenUri(uri: string) {
  return GlobalCache.getAsync<any>(`URI${uri}`, async () => {
    const token = await fetch(uri);
    const tokenData = await token.json();
    return tokenData;
  }) as unknown as NftMetadata;
}

/**
 * Sample NFT JSON {
    "platform": "AI Donkeys",
    "eraId": "<ERA_ID>",
    "reward": "<REWARD>",
    "artist": "<ARTIST>",
    "telegramId": "<TELEGRAM>",
    "purchasePrice": "<PURCHASE_PRICE>",
    "description": "<TEXT>",
    "is_static": true,
    "external_url": "https://gateway.pinata.cloud/ipfs/<CID>",
    "image": "https://gateway.pinata.cloud/ipfs/<CID>"
}
 */
export async function loadToken(chainId: string, nftContract: string, tokenId: string,
  callMethod: (chainId: string, contract: string, method: string, params: any[]) => Promise<any>): Promise<NftMetadata> {
  const tokenURI = await GlobalCache.getAsync<any>(`CALL${chainId}-${nftContract}-ABI.tokenURI-${tokenId}`,
    async () => (await callMethod(chainId, nftContract, ABI.tokenURI, [tokenId])).toString());
    try {
  const token = await loadTokenUri(tokenURI) as any;
  const reward = token.reward || "0";
  return { ...token, id: Number(tokenId), purchaseInfo: {
    telegramId: token.telegramId || '',
    id: Number(tokenId),
    purchasePrice: token.purchasePrice || "0",
    eraId: token.eraId || "0",
    purchaser: token.artist || "",
    reward: reward === "0" ? "NONE" : reward === "1" ? "KING" : reward === "2" ? "QUEEN" : "KNIGHT",
      description: token.text || "",
    } };
  } catch (error) {
    console.error('Failed to load token', error);
    return { id: Number(tokenId), name: `NFT #${tokenId}`, description: "", image: "/placeholder.svg", external_url: "", purchaseInfo: { id: Number(tokenId), telegramId: "", purchasePrice: "0", eraId: "0", purchaser: "", reward: "NONE", description: "" } };
  }
}

export async function loadMyNfts(
  chainId: string, nftContract: string, address: string, balance: number,
  callMethod: (chainId: string, contract: string, method: string, params: any[]) => Promise<any>):
  Promise<{ nfts: NftMetadata[], rewards: { [key: string]: NftMetadata[] } }> {
  const newCollection: NftMetadata[] = [];
  const rewards: { [key: string]: NftMetadata[] } = {};
  if (!balance || !nftContract || !address) return { nfts: newCollection, rewards };
  for(let i = 0; i < balance; i++) {
    const tokenId = await GlobalCache.getAsync<any>(`CALL${chainId}-${nftContract}-ABI.tokenOfOwnerByIndex-${address}-${i}`,
      async () => (await callMethod(chainId, nftContract, ABI.tokenOfOwnerByIndex, [address, i])).toString());
    console.log("Token ID", i, tokenId);
    const token = await loadToken(chainId, nftContract, tokenId, callMethod);
    newCollection.push(token);
    if (token.purchaseInfo?.reward !== 'NONE') {
      rewards[token.purchaseInfo.reward] = rewards[token.purchaseInfo.reward] || [];
      rewards[token.purchaseInfo.reward].push(token);
    }
  }
  return { nfts: newCollection, rewards };
}

export async function loadEraNfts(
  chainId: string, nftContract: string, eraId: number, page: number, pageSize: number,
  callMethod: (chainId: string, contract: string, method: string, params: any[]) => Promise<any>):
  Promise<NftMetadata[]> {
  const newCollection: NftMetadata[] = [];
  if (!eraId || !nftContract) return newCollection;
  const eraLen = Number(await callMethod(chainId, nftContract, ABI.getMintedTokensByEraLength, [eraId]));
  if (!eraLen) return newCollection;
  // page comes down from the end
  let from = eraLen - (page + 1) * pageSize;
  const to = eraLen - page * pageSize;
  if ((to - from) < 1) return newCollection;
  if (from < 0) from = 0;
  console.log("Loading era", eraId, from, to, {page, pageSize, eraLen});
  const tokens = await GlobalCache.getAsync<any>(`CALL${chainId}-${nftContract}-ABI.getMintedTokensByEra-${eraId}-${from}-${to}`,
    async () => {
      const tokens = await callMethod(chainId, nftContract, ABI.getMintedTokensByEra, [eraId, from, to - 1]);
      console.log("Tokens", tokens);
      return tokens.map((token: any) => token.toString());
    });
  for(let i = 0; i < tokens.length; i++) {
    const token = await loadToken(chainId, nftContract, tokens[i].toString(), callMethod);
    newCollection.push(token);
  }
  return newCollection;
}