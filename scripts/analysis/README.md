# Market & whale analysis

Run in an empty folder, in this order (Node 22, no dependencies):

```bash
node market-snapshot.mjs     # writes market.json (all 338 stocks, pools, liquidity, 24h volume)
node whale-flows.mjs         # writes whales.json (24h Transfer flows per address, top-40 holdings)
node classify-wallets.mjs    # splits addresses into contract / bot / human / smart wallet
```

Env: `RPC` (default publicnode), `SPAN` blocks (default 43200 = 24h), `STEP` (default 5000).
Results from 2026-11-11 are summarised in `research/09-market-competitors-plan.md`.
