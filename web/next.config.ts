import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // The Base Account SDK's "node" entry pulls in the CDP server SDK (x402 etc.). The wallet only ever
    // runs in the browser, so resolve the browser build everywhere, including during SSR.
    resolveAlias: {
      "@base-org/account": "@base-org/account/browser",
      "@base-org/account/spend-permission": "@base-org/account/spend-permission/browser",
    },
  },
};

export default nextConfig;
