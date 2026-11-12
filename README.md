# Sahm | سهم

**Invest in halal US stocks, in Arabic, from $1 — your money stays in your wallet.**
**استثمر في أسهم أمريكية حلال، بالعربي، من دولار واحد. فلوسك في محفظتك.**

Sahm is an Arabic-first, Shariah-aware agent for [Coinbase tokenized stocks](https://www.base.org/stocks) on Base.
Built in public for **#StocksMaxxing** (Agentic Stock Finance track) by [@buildonbase](https://x.com/buildonbase).

> Not financial advice. Coinbase tokenized stocks are available only in eligible jurisdictions outside the US.
> Halal labels are indicative screens (AAOIFI ratios), not a fatwa.

## What it does
- **Recurring buys** of $1–$20/day into a stock or a halal basket.
- **Non-custodial:** USDC is pulled per trade via Base Spend Permissions (daily cap + expiry enforced onchain). Revoke anytime.
- **Fair-price guard:** never buys when the Aerodrome price is above the Hyperliquid fair price, when liquidity is thin, or when price impact is high.
- **Halal screen:** debt, cash and interest-income ratios from SEC filings for every listed stock (`data/halal/` + `scripts/analysis/halal-screen.mjs`).
- **Arabic onboarding:** step-by-step guide to get USDC onto Base from Binance/Coinbase.
- **Public stats:** every trade is onchain and attributed with Builder Code `bc_cs3y0r48`.

## How it works
```
User (Base Account) ── signs SpendPermission(USDC, $X/day, 30d, spender = SahmExecutor)
Agent (hourly) ── guard: DEX vs Hyperliquid, liquidity, impact ── SahmExecutor.execute()
SahmExecutor ── spend USDC → swap (Kyber/Aerodrome) → stock goes straight to the user
```

## Repo
| Folder | What |
|---|---|
| `contracts/` | `SahmExecutor` (Foundry, `--hardfork base:Cobalt`) |
| `agent/` | Plans, guard, execution, Arabic explanations |
| `web/` | Next.js + OnchainKit mini app (RTL) |
| `supabase/` | Price-gap logger (every 5 min) and DB migrations |
| `data/halal/` | Halal ratio screen results |
| `research/` | Market, competitor, whale and bot research (Arabic) |
| `scripts/` | Analysis and mainnet-fork test scripts |
| `survey/` | User survey page |

## Build log
- **Day 0 (Nov 12):** research, halal screen for 20 stocks, price-gap logger live.
