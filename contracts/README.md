# contracts: SahmExecutor

عقد واحد بيشتري سهم مرمّز للمستخدم في معاملة واحدة: يسحب USDC بالـ Spend Permission، ويعمل swap، والسهم يروح لمحفظة المستخدم مباشرة. العقد عمره ما بيحتفظ برصيد.

One contract. Pulls USDC with the user's Spend Permission, swaps on an allow-listed router, and the stock lands directly in the user's wallet. It never holds funds.

| | |
|---|---|
| `src/SahmExecutor.sol` | `execute(...)`: onlyAgent, whenNotPaused, nonReentrant |
| `test/SahmExecutor.fork.t.sol` | 13 fork tests on Base mainnet: real USDC, SpendPermissionManager, Coinbase Smart Wallet, NVDAc and its Aerodrome pool |
| `script/Deploy.s.sol` | Deploy + allow-list stocks and routers |

## Run
Needs Foundry ≥ 1.8.4 (`hardfork = "base:Cobalt"` is set in `foundry.toml`).
```sh
git submodule update --init
forge build
BASE_RPC_URL=https://mainnet.base.org forge test -vv   # or an Alchemy URL
```

## Deploy (Base Sepolia)
Keys stay in Foundry's encrypted keystore, never in files:
```sh
cast wallet import sahm-deployer --interactive
AGENT_ADDRESS=0x... USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e \
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org \
forge script script/Deploy.s.sol --rpc-url base_sepolia --account sahm-deployer --broadcast
```
