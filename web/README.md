# web
Next.js 16 app, Arabic RTL first (IBM Plex Sans Arabic). Deployed by the Vercel project `sahm` (root = `web/`).

| Route | |
|---|---|
| `/` | Home |
| `/stocks` | Tokenized stocks + halal screen (`lib/stocks.ts`, from `data/halal/`) |
| `/start` | USDC on Base guide |
| `/plan` | Plan builder (signing enabled after the Sepolia deploy) |
| `/portfolio` | Holdings and history (after wallet connect) |
| `/stats` | Public onchain stats |

```sh
npm ci && npm run dev
```
