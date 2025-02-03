import { GlobalCache } from "web3-react-ui";
import { ABI, NftMetadata } from "./conf";

async function loadTokenUri(uri: string) {
  return GlobalCache.getAsync<any>(`URI${uri}`, async () => {
    const token = await fetch(uri);
    const tokenData = await token.json();
    return tokenData;
  }) as unknown as NftMetadata;
}

export async function loadToken(chainId: string, nftContract: string, tokenId: string,
  callMethod: (chainId: string, contract: string, method: string, params: any[]) => Promise<any>): Promise<NftMetadata> {
  const tokenURI = await GlobalCache.getAsync<any>(`CALL${chainId}-${nftContract}-ABI.tokenURI-${tokenId}`,
    async () => (await callMethod(chainId, nftContract, ABI.tokenURI, [tokenId])).toString());
  const token = await loadTokenUri(tokenURI);
  return { ...token, id: Number(tokenId) };
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
    if (token.purchaseInfo?.reward) {
      rewards[token.purchaseInfo.reward.toString()] = rewards[token.purchaseInfo.reward.toString()] || [];
      rewards[token.purchaseInfo.reward.toString()].push(token);
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
  let to = eraLen - page * pageSize;
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