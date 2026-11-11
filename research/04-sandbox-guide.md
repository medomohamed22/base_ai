# بيئة التجربة قبل البناء (Sandbox Guide)

> **الخلاصة:** الأسهم المرمّزة **مش موجودة على Base Sepolia (التست نت)**. اتأكدت من ده على السلسلة: عقد الـ PolicyRegistry وعقود الأسهم مش موجودين هناك.
> علشان كده التجربة بتتعمل على **4 مستويات**، كل مستوى ليه استخدامه.

| المستوى | فيه أسهم حقيقية؟ | فلوس حقيقية؟ | بنجرّب فيه إيه |
|---|---|---|---|
| **0. APIs للقراءة** | ✅ | ❌ (مفيش محفظة) | الأسعار، والسيولة، وقائمة الأسهم، والـ quotes |
| **1. نسخة محلية من mainnet (Fork)** ⭐ | ✅ pools حقيقية | ❌ فلوس وهمية | شراء وبيع حقيقي على Aerodrome، والعقود بتاعتنا |
| **2. Base Sepolia (التست نت)** | ❌ (نعمل سهم وهمي) | ❌ من الـ faucet | Smart Wallet، وSpend Permissions، وتجربة المستخدم، والـ Paymaster |
| **3. Mainnet بمبلغ صغير ($5)** | ✅ | ✅ | التجربة الأخيرة قبل الإطلاق، ودي أول traction |

---

## المستوى 0: APIs للقراءة (من غير حساب، اتجربت ✅)
| الـ API | بيدّي إيه | مثال |
|---|---|---|
| Coinbase Tokenized Stocks | 338 سهم، والعقود، والـ multiplier | `curl "https://api.coinbase.com/v1/tokenized-stocks?page_size=500"` |
| DexScreener | سعر DEX والسيولة والحجم | `curl https://api.dexscreener.com/tokens/v1/base/<STOCK_ADDRESS>` |
| Hyperliquid xyz | سعر الـ perp 24/7، ده السعر العادل | `curl -X POST https://api.hyperliquid.xyz/info -H 'content-type: application/json' -d '{"type":"allMids","dex":"xyz"}'` |
| KyberSwap Aggregator | Quote وcalldata جاهزة للشراء | `curl "https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=<USDC>&tokenOut=<STOCK>&amountIn=5000000" -H "x-client-id: sahm"` |

**نتيجة حقيقية:** $5 USDC بيشتروا 0.02836 NVDAc (حوالي $4.998)، والـ gas حوالي **$0.012**.

## المستوى 1: Fork من mainnet ⭐ (اتجرب ونجح ✅)
بنشغّل نسخة من Base mainnet على جهازك. الـ pools والأسعار حقيقية، والفلوس وهمية.

```bash
# مرة واحدة: تثبيت Foundry (لازم v1.8.4 أو أحدث علشان أسهم B20)
curl -L https://foundry.paradigm.xyz | bash && foundryup

# تجربة شراء: سهم + مبلغ بالدولار
scripts/fork-swap-test.sh NVDA 5
scripts/fork-swap-test.sh META 3
```
**نتايج حقيقية من الـ fork:**
- NVDA: دفعنا $5 وأخدنا `0.02832647 NVDAc` ✅، والـ gas حوالي 439K
- META: دفعنا $3 وأخدنا `0.00462889 METAc` = `0.00463034` سهم (multiplier 1.000314) ✅

**ملاحظات مهمة:**
- لازم `--hardfork base:Cobalt`، من غيره الأسهم مش هتشتغل.
- `balanceOfUI` و`toUIAmount` **مش شغالين على الـ fork** في Foundry 1.8.6، لكنهم شغالين على mainnet. احسبها كده: `raw × uiMultiplier` (والـ multiplier نقراه من mainnet).
- الـ RPC العام `mainnet.base.org` بيعمل rate limit. لو حصل، اعمل حساب مجاني على Alchemy أو QuickNode، وشغّل `FORK_RPC=<url> scripts/fork-swap-test.sh`.
- KyberSwap بيرفض عناوين anvil الافتراضية (0xf39F…)، فالسكريبت بيعمل محفظة عشوائية جديدة كل مرة.

## المستوى 2: Base Sepolia (التست نت)
لتجربة **المحفظة وتجربة المستخدم**: Smart Wallet، وSpend Permissions (العقد موجود على Sepolia ✅ `0xf852…67Ad`)، والـ Paymaster.
- **ETH + USDC تجريبي:** [CDP Faucet](https://portal.cdp.coinbase.com/onchain-tools/faucet) (0.1 ETH + USDC كل 24 ساعة)، أو [Circle Faucet](https://faucet.circle.com) (اختار Base Sepolia).
- **السهم:** بنعمل توكن وهمي `mNVDA` وpool صغيرة، أو بنحاكي الـ swap.
- Explorer: https://sepolia.basescan.org

## المستوى 3: Mainnet بـ $5 حقيقية
آخر خطوة بعد ما الـ fork والتست نت يشتغلوا. محفظة فيها $10 USDC و$1 ETH على Base كفاية لأول 20 تجربة.

---

## ✅ حسابات تعملها النهارده (تجهيز من غير بناء)
| الحساب | ليه | الرابط |
|---|---|---|
| **Coinbase Developer Platform (CDP)** | API keys، وFaucet، وPaymaster (gas مجاني للمستخدمين)، وOnchainKit | https://portal.cdp.coinbase.com |
| **Base Build** | تسجيل المشروع + **Builder Code**، وده لازم علشان الـ traction يتحسب | https://base.dev |
| **Alchemy أو QuickNode** (مجاني) | RPC من غير rate limit للـ fork والـ logs | https://www.alchemy.com |
| **محفظة تجريبية** (Base App / Coinbase Wallet) | تجربة Sepolia وبعدها mainnet. **محفظة منفصلة عن محفظتك الأساسية** | Base App |
| Hyperliquid وKyberSwap وDexScreener | **مش محتاجين حساب** | — |

> ⚠️ أمان: عمرك ما تحط private key أو seed phrase في الكود ولا الشات. في الـ fork بنستخدم مفاتيح عشوائية مؤقتة بس.
