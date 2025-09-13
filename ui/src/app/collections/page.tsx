"use client"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EraCollection } from "@/components/era-collection"
import { NftPlaceholder } from "@/components/nft-placeholder"
import { DoubleBorder } from "@/components/double-border"
import theme from "@/lib/theme"
import { useState, useEffect } from "react"
import { ABI, Era, useConfig, useGeneralInfo } from "@/utils/conf"
import { GlobalCache, useConnectWalletSimple, useContracts } from "web3-react-ui"

export default function CollectionsPage() {
  const [value, setValue] = useState("my-collection");
  const [eras, setEras] = useState<Era[]>([]);
  const { chainId, address } = useConnectWalletSimple();
  const { nftContract } = useConfig(chainId);
  const [myTokenIds, setMyTokenIds] = useState<string[]>([]);
  const { callMethod } = useContracts();
  const generalInfo = useGeneralInfo();
  const [loadingTokenIds, setLoadingTokenIds] = useState(false);

  useEffect(() => {
    // Load my collection token IDs only
    const loadTokenIds = async () => {
      if (chainId && address && generalInfo.balance && nftContract) {
        setLoadingTokenIds(true);
        try {
          const tokenIds: string[] = [];
          for(let i = 0; i < generalInfo.balance; i++) {
            const tokenId = await GlobalCache.getAsync<string>(`CALL${chainId}-${nftContract}-ABI.tokenOfOwnerByIndex-${address}-${i}`,
              async () => (await callMethod(chainId, nftContract, ABI.tokenOfOwnerByIndex, [address, i])).toString());
            tokenIds.push(tokenId);
          }
          console.log('token IDs loaded', tokenIds);
          setMyTokenIds(tokenIds);
        } finally {
          setLoadingTokenIds(false);
        }
      }
    };
    loadTokenIds();
  }, [chainId, address, callMethod, generalInfo.balance, nftContract]);

  useEffect(() => {
    // Load eras
    const loadCollection = async () => {
      if (chainId && nftContract && generalInfo.currentEra.id) {
        try {
        const newEras: Era[] = [];
        for (let i = 1; i <= generalInfo.currentEra.id; i++) {
          const theEra: Era | null = await GlobalCache.getAsync<Era>(`CALL${chainId}-${nftContract}-ABI.eras-${i}-Eras`,
            async () => {
              const era = await callMethod(chainId, nftContract, ABI.eras, [i]);
              return ({
                id: era.eraId.toString(),
                title: era.title,
                startPrice: era.startPrice.toString(),
                startTimestamp: era.startTimestamp.toString(),
                }) as Era; });
          if (!!theEra?.id) {
            const totalMinted = await callMethod(chainId, nftContract, ABI.getMintedTokensByEraLength, [theEra.id]);
            theEra.totalMinted = totalMinted;
            newEras.push(theEra);
          }
        }
        setEras(newEras);
        } finally {
        }
      }
    };
    loadCollection();
  }, [chainId, callMethod, nftContract, generalInfo.currentEra.id]);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 w-full max-w-[950px] mx-auto">
        <Tabs defaultValue="my-collection" className="w-full" onValueChange={setValue}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-transparent p-0">
            <TabsTrigger
              value="my-collection"
              className={`py-2 px-4 text-lg transition-all border-4 border-solid border-r-0 rounded-none first:rounded-l-sm data-[state=active]:bg-[${theme.button.background}] data-[state=active]:text-[${theme.button.text}]`}
              style={{
                borderColor: theme.border.default,
                color: theme.button.text,
                ...(value === 'my-collection' ? { backgroundColor: theme.button.background } : {})
              }}
            >
              My Collection
            </TabsTrigger>
            <TabsTrigger
              value="full-collection"
              className={`py-2 px-4 text-lg transition-all border-4 border-solid rounded-none last:rounded-r-sm data-[state=active]:bg-[${theme.button.background}] data-[state=active]:text-[${theme.button.text}]`}
              style={{
                borderColor: theme.border.default,
                color: theme.button.text,
                ...(value === 'full-collection' ? { backgroundColor: theme.button.background } : {})
              }}
            >
              Full Collection
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-collection">
            <DoubleBorder>
              <div style={{ backgroundColor: theme.card.background }} className="p-4">
                <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
                  My Collection
                </h2>
                {loadingTokenIds && (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-center">
                      <div className="text-lg mb-2">Loading your collection...</div>
                      <div className="text-sm" style={{ color: theme.text.secondary }}>
                        Fetching token IDs...
                      </div>
                    </div>
                  </div>
                )}
                {!loadingTokenIds && myTokenIds.length === 0 && (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-center">
                      <div className="text-lg mb-2">No NFTs found</div>
                      <div className="text-sm" style={{ color: theme.text.secondary }}>
                        You don&apos;t have any NFTs in your collection yet.
                      </div>
                    </div>
                  </div>
                )}
                {!loadingTokenIds && myTokenIds.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {myTokenIds.map((tokenId, index) => (
                      <NftPlaceholder
                        key={tokenId}
                        tokenId={tokenId}
                        chainId={chainId!}
                        nftContract={nftContract}
                        address={address!}
                        callMethod={callMethod}
                        collectionSize={myTokenIds.length}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            </DoubleBorder>
          </TabsContent>
          <TabsContent value="full-collection">
            <div className="space-y-6">
              {eras.reverse().map(era => (
                <EraCollection key={era.id} era={era} eraId={era.id.toString()} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
