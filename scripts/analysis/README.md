# Market & whale analysis

Run in an empty folder, in this order (Node 22, no dependencies):

```bash
node market-snapshot.mjs     # writes market.json (all 338 stocks, pools, liquidity, 24h volume)
node whale-flows.mjs         # writes whales.json (24h Transfer flows per address, top-40 holdings)
node classify-wallets.mjs    # splits addresses into contract / bot / human / smart wallet
node bot-strategies.mjs 0xADDR [0xADDR...]  # per-wallet strategy: price vs Hyperliquid, lead-lag, LP activity, holding time
```

Env: `RPC` (default publicnode), `SPAN` blocks (default 432000 = 24h; Base blocks are 0.2s), `STEP` (default 5000).
Results from 2026-11-11 are summarised in `research/09-market-competitors-plan.md` and `research/10-trading-bots.md`.

## Halal screen (AAOIFI ratios from SEC XBRL)

```bash
cp ciks.json <workdir>/ && cd <workdir>
SEC_UA="Your Name you@example.com" node halal-screen.mjs   # writes halal.json
```
Result from 2026-11-12: `data/halal-ratios-2026-11-12.json`, verdicts in `research/11-build-spec.md`.
