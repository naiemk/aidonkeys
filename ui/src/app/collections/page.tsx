"use client"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EraCollection } from "@/components/era-collection"
import { MyCollection } from "@/components/my-collection"
import theme from "@/lib/theme"
import { useState, useEffect } from "react"
import { ABI, Era, NftMetadata, useConfig, useGeneralInfo } from "@/utils/conf"
import { GlobalCache, useConnectWalletSimple, useContracts } from "web3-react-ui"
import { loadMyNfts } from "@/utils/nftload"
import { LoadingButton } from '@/components/ui/loading-button';

export default function CollectionsPage() {
  const [value, setValue] = useState("my-collection");
  const [eras, setEras] = useState<Era[]>([]);
  const { chainId, address } = useConnectWalletSimple();
  const { nftContract } = useConfig(chainId);
  const [myCollection, setMyCollection] = useState<NftMetadata[]>([]);
  const { callMethod } = useContracts();
  const generalInfo = useGeneralInfo();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load my collection
    const loadCollection = async () => {
      if (chainId && address && generalInfo.balance && nftContract) {
        setLoading(true);
        try {
          const { nfts, } = await loadMyNfts(chainId, nftContract, address, generalInfo.balance, callMethod);
          console.log('nfts loaded', nfts);
          setMyCollection(nfts);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCollection();
  }, [chainId, address, callMethod, generalInfo.balance, nftContract]);

  useEffect(() => {
    // Load eras
    const loadCollection = async () => {
      if (chainId && nftContract && generalInfo.currentEra.id) {
        try {
        const newEras: Era[] = [];
        for (let i = 1; i <= generalInfo.currentEra.id; i++) {
          const theEra: Era | null = await GlobalCache.getAsync<any>(`CALL${chainId}-${nftContract}-ABI.eras-${i}-Eras`,
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
          {!loading && <div className="flex justify-center items-center h-full"><LoadingButton size="large" /></div>}
            <MyCollection nfts={myCollection} loading={loading}/>
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
