'use client'
import type { Metadata } from "next"
import { Syne_Mono } from "next/font/google"
import "./globals.css";
import { AppWrapper } from 'web3-react-ui';
import React, { useState } from "react";
import { GLOBAL_CONFIG } from "@/types/token";
import theme from "@/lib/theme"

const syneMono = Syne_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

const syneMonoMono = Syne_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne-mono-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [error, setError] = useState<Error | null>(null);
  const [k, setKey] = useState<string>('1');
  const [initialized, setInitialized] = useState(false);
  console.log(initialized, 'initialized')

  return (
    <html lang="en">
      <body
        className={`dark ${syneMono.className} ${syneMonoMono.variable} antialiased`}
        style={{
          backgroundColor: theme.background.primary,
          color: theme.text.primary,
        }}
      >
        <AppWrapper
          onWeb3OnboardInit={() => setInitialized(true)}
          appMetadata={({
            name: "AI Donkeys",
            icon: "https://ferrum.network/wp-content/uploads/2022/07/cropped-ferrum-favicon-1-32x32.png",
            description: "AI Donkey Kingdom",
          })}
          providersConfigUrl="https://raw.githubusercontent.com/naiemk/qp-bridge/refs/heads/main/resources/configs/network-list.json"
          configUrlMaps={{
            "APP": "https://raw.githubusercontent.com/naiemk/qp-bridge/refs/heads/main/resources/configs/config.json"
          }}
          onError={(error) => setError(error)}
          onConfigLoaded={(k, v) => {
            GLOBAL_CONFIG[k] = v;
            setKey(k); // To refresh the content
          }}
        >
          {error && <div>{error.message}</div>}
          <React.Fragment key={k}>
            {initialized ? children : <div>Initializing...</div>}
          </React.Fragment>
        </AppWrapper>
      </body>
    </html>
  );
}
