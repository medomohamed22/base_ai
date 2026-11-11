#!/usr/bin/env bash
# Test-buy a Coinbase tokenized stock on a LOCAL fork of Base mainnet (fake money, real pools).
# Needs: Foundry >= 1.8.4 (anvil, cast), curl, python3, openssl.
# Usage: scripts/fork-swap-test.sh [SYMBOL] [USDC_AMOUNT]     e.g.  scripts/fork-swap-test.sh NVDA 5
set -euo pipefail
SYM="${1:-NVDA}"; AMT="${2:-5}"
FORK_RPC="${FORK_RPC:-https://mainnet.base.org}"   # set to an Alchemy/QuickNode URL if rate-limited
R=http://127.0.0.1:8545
USDC=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
UNITS=$(python3 -c "print(int(float('$AMT')*1e6))")

STOCK=$(curl -sS "https://api.coinbase.com/v1/tokenized-stocks?page_size=500" | python3 -c "
import json,sys; t=[x for x in json.load(sys.stdin)['tokens'] if x['symbol']=='${SYM}c']
print(t[0]['contract_address'] if t else '')")
[ -n "$STOCK" ] || { echo "No tokenized stock ${SYM}c"; exit 1; }
# Largest USDC pool for this stock = a USDC holder we can borrow test USDC from on the fork.
WHALE=$(curl -sS "https://api.dexscreener.com/tokens/v1/base/$STOCK" | python3 -c "
import json,sys; ps=[p for p in json.load(sys.stdin) if p['quoteToken']['symbol']=='USDC']
ps.sort(key=lambda p:-(p.get('liquidity') or {}).get('usd',0)); print(ps[0]['pairAddress'])")
echo "== ${SYM}c $STOCK | USDC source (pool) $WHALE"

anvil --fork-url "$FORK_RPC" --hardfork base:Cobalt --port 8545 --silent & ANVIL=$!
trap 'kill $ANVIL 2>/dev/null' EXIT
until cast chain-id --rpc-url $R >/dev/null 2>&1; do sleep 1; done

PK=0x$(openssl rand -hex 32); ME=$(cast wallet address "$PK")
cast rpc anvil_setBalance "$ME" 0xDE0B6B3A7640000 --rpc-url $R >/dev/null
cast rpc anvil_setBalance "$WHALE" 0xDE0B6B3A7640000 --rpc-url $R >/dev/null
cast rpc anvil_impersonateAccount "$WHALE" --rpc-url $R >/dev/null
cast send $USDC "transfer(address,uint256)" "$ME" "$UNITS" --from "$WHALE" --unlocked --rpc-url $R >/dev/null
echo "== test wallet $ME funded with $AMT USDC (fork only)"

ROUTE=$(curl -sS "https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=$USDC&tokenOut=$STOCK&amountIn=$UNITS" -H "x-client-id: fork-test")
ROUTER=$(python3 -c "import json,sys;d=json.loads(sys.argv[1])['data'];print(d['routerAddress'])" "$ROUTE")
BODY=$(python3 -c "import json,sys;d=json.loads(sys.argv[1])['data'];print(json.dumps({'routeSummary':d['routeSummary'],'sender':'$ME','recipient':'$ME','slippageTolerance':100}))" "$ROUTE")
DATA=$(curl -sS -X POST "https://aggregator-api.kyberswap.com/base/api/v1/route/build" -H "x-client-id: fork-test" -H 'content-type: application/json' -d "$BODY" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['data'])")

cast send $USDC "approve(address,uint256)" "$ROUTER" "$UNITS" --private-key "$PK" --rpc-url $R >/dev/null
cast send "$ROUTER" "$DATA" --private-key "$PK" --rpc-url $R --gas-limit 3000000 | grep -E "^(status|gasUsed)"
RAW=$(cast call "$STOCK" 'balanceOf(address)(uint256)' "$ME" --rpc-url $R | awk '{print $1}')
# balanceOfUI is not available on the Cobalt fork; read the live multiplier from mainnet instead.
MULT=$(cast call "$STOCK" 'uiMultiplier()(uint256)' --rpc-url https://mainnet.base.org | awk '{print $1}')
python3 -c "raw=$RAW; m=$MULT/1e18; print(f'== bought {raw/1e8:.8f} ${SYM}c tokens = {raw/1e8*m:.8f} shares (multiplier {m:.6f}) for $AMT USDC')"
