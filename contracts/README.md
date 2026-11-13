# contracts: SahmExecutor

عقد واحد بيشتري سهم مرمّز للمستخدم في معاملة واحدة: يسحب USDC بالـ Spend Permission، ويعمل swap، والسهم يروح لمحفظة المستخدم مباشرة. العقد عمره ما بيحتفظ برصيد.

One contract. Pulls USDC with the user's Spend Permission, swaps on an allow-listed router, and the stock lands directly in the user's wallet. It never holds funds.

| | |
|---|---|
| `src/SahmExecutor.sol` | `execute(...)`: onlyAgent, whenNotPaused, nonReentrant |
| `test/SahmExecutor.fork.t.sol` | 13 fork tests on Base mainnet: real USDC, SpendPermissionManager, Coinbase Smart Wallet, NVDAc and its Aerodrome pool |
| `test/SahmExecutor.sepolia.t.sol` | End-to-end buy on a Base Sepolia fork with the mock stock |
| `script/Deploy.s.sol` | Mainnet deploy + allow-list stocks and routers |
| `script/DeploySepolia.s.sol` | Sepolia: mock NVDA (`tNVDA`, $180) + mock router + SahmExecutor |
| `src/mocks/` | Testnet-only mock stock and router |

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
AGENT_ADDRESS=0x... forge script script/DeploySepolia.s.sol \
  --rpc-url https://sepolia.base.org --account sahm-deployer --broadcast
```
