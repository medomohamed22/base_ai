"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";
import { CHAIN } from "@/lib/chain";

// Base Account (passkey smart wallet) is the user connector: Spend Permissions are a Base Account feature.
// `injected` is only used by the owner on /deploy (MetaMask / wallet in-app browser).
const wagmiConfig = createConfig({
  chains: [CHAIN, ...(CHAIN.id === base.id ? [baseSepolia] : [base])] as const,
  connectors: [baseAccount({ appName: "Sahm سهم" }), injected()],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
  },
  ssr: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={CHAIN}
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          config={{ appearance: { name: "Sahm", mode: "auto" } }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
