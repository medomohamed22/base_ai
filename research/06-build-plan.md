# خطة البناء: 13 نوفمبر → 5 ديسمبر (23 يوم)

## مبادئ (من دروس الفايزين)
1. **نطلع على mainnet يوم 20 نوفمبر بالكتير.** كل يوم قبل التاريخ ده بيضيّع traction.
2. **MVP صغير شغال أحسن من منتج كبير ناقص.**
3. **بوست كل يوم** (25% من الدرجة + جائزة $6K).
4. **Builder Code على كل معاملة من أول يوم.**

## نطاق الـ MVP (اللي هيتسلّم)
| جوه الـ MVP ✅ | بعدين ⏭️ |
|---|---|
| تسجيل دخول بـ Base Account (إيميل/passkey) | البيع التلقائي (stop-loss) |
| Agent **"المُدّخر"**: شراء يومي/أسبوعي ($1–$20) لسهم واحد أو سلة | Agent "صائد الويك إند" (حسب داتا الـ logger) |
| Spend Permission: سقف يومي + مدة + Kill switch | API x402 للـ fair value |
| **الحارس**: يرفض الشراء لو سعر DEX بعيد عن السعر العادل بأكتر من X% | واجهة chat كاملة بالعربي (نبدأ بأوامر بسيطة) |
| 10 أسهم أساسية (GOOGL وNVDA وMETA وMSFT وAAPL وAMD وPLTR وORCL وSNDK وSPCX) | محافظ جاهزة متوازنة (زي Neo) |
| Paymaster (gas مجاني للمستخدم) | |
| صفحة Stats عامة (المستخدمين والمعاملات والحجم) + Audit trail | |
| واجهة عربي/إنجليزي (Mini App) | |

## المعمارية
```
Mini App (Next.js + OnchainKit, عربي/إنجليزي)
   └─ Base Account → توقيع SpendPermission (USDC, $X/day, 30 days, spender = SahmExecutor)
Agent service (Node, cron كل ساعة)
   ├─ يقرأ الخطط من DB
   ├─ Guard: سعر DEX (DexScreener/Kyber) مقابل fair value (Hyperliquid xyz + BaseStonk) → يكمّل أو يرفض
   └─ ينادي SahmExecutor.execute()  ← المعاملة فيها Builder Code
SahmExecutor (Solidity, Foundry, hardfork base:Cobalt)
   1) SpendPermissionManager.spend(...)  → USDC يدخل العقد
   2) swap (Kyber router calldata أو Aerodrome مباشرة) مع minOut
   3) السهم يروح لمحفظة المستخدم مباشرة، والعقد عمره ما بيحتفظ برصيد
Indexer/Stats: أحداث العقد → صفحة /stats العامة
```

## الجدول اليومي
| الأيام | الهدف | علامة إن الهدف اتحقق |
|---|---|---|
| **13–14 نوفمبر** | Skeleton: repo structure، والعقد على الـ fork، وتجربة spend→swap→user | تست ناجح على الـ fork ✅ |
| **15–16** (ويك إند) | العقد على Sepolia + Spend Permission حقيقية من Base Account. **نحلّل داتا الويك إند** | تست end-to-end على Sepolia |
| **17–19** | الـ Agent service + Guard + Mini App (أول نسخة) | مستخدم تجريبي يعمل خطة من الواجهة |
| **20 نوفمبر** | 🚀 **إطلاق mainnet** (حد أقصى $20/يوم للمستخدم) + أول 10 مستخدمين من الاستبيان | أول 10 معاملات حقيقية |
| **21–27** | تحسين من feedback المستخدمين + صفحة Stats + الواجهة بالعربي + أول 50 مستخدم | 50 محفظة، معاملات يومية متكررة |
| **28 نوفمبر – 2 ديسمبر** | ميزة إضافية واحدة بس (حسب الداتا: صائد الويك إند أو محافظ جاهزة) + polish + أمان | 100 محفظة |
| **3–4 ديسمبر** | فيديو الديمو (Loom، دقيقتين) + فيديو technical + README + بوست التسليم | جاهزين |
| **5 ديسمبر** | 📤 التسليم: بوست X فيه فيديو + منشن @buildonbase + الفورم | ✅ |

## خطة الـ Traction (50%)
- **مصدر المستخدمين:** الاستبيان وجروبات عربية (واتساب وتيليجرام وفيسبوك) ومجتمع Base العربي وBaseStonk.
- **ليه هيرجعوا كل يوم:** الـ DCA بيعمل معاملة تلقائية كل يوم، وده بالظبط مقياس "repeat users".
- **حافز:** أول 100 مستخدم بنغطّي عنهم الـ gas، وممكن كمان نديهم أول $1 هدية (لو الميزانية تسمح).
- **قابلية الإثبات:** صفحة Stats عامة، وكل معاملة ليها رابط Basescan.

## خطة Build in public (25% + $6K)
- **يوميًا:** بوست قصير (صورة/فيديو + سطرين) بالإنجليزي، ونسخة عربي.
- **مرتين في الأسبوع:** thread فيه داتا (فرق الأسعار في الويك إند، وأرقام الاستخدام).
- **الـ Repo public** من أول يوم، وكل commit واضح.
- هاشتاج ومنشن ثابت: `@buildonbase #StocksMaxxing`

## بوست اليوم 0 (جاهز للنشر)
```text
Day 0 of building Sahm for #StocksMaxxing @buildonbase 🧵

We checked every Coinbase tokenized stock on Base:
• 338 tokens live
• 61 with DEX pools, 18 with >$100K liquidity
• ~$97M traded in 24h on Aerodrome

But 400M+ Arabic speakers still have no simple way in.

Building: an Arabic-first AI agent that auto-invests $1–$20/day into US stocks on Base.
Non-custodial. Onchain spend limits. One-tap kill switch.

Already did a test buy of $5 → NVDAc on a mainnet fork ✅
Logging Aerodrome vs Hyperliquid prices every 15 min to see what happens on weekends 👀

Building fully in public. Follow along 👇
```
النسخة العربي:
```text
اليوم 0 من بناء "سهم" لمسابقة #StocksMaxxing من @buildonbase 🧵

راجعنا كل الأسهم الأمريكية المرمّزة على Base:
• 338 سهم
• 61 سهم عليهم سيولة، منهم 18 فوق 100 ألف دولار
• حوالي 97 مليون دولار تداول في 24 ساعة

ومع كده العالم العربي (400+ مليون) معندوش طريقة سهلة يدخل بيها.

بنبني: Agent بالعربي يستثمرلك من 1 لـ 20 دولار يوميًا في الأسهم الأمريكية.
فلوسك في محفظتك، وحدود صرف السلسلة هي اللي بتفرضها، وتوقفه بضغطة.

هنبني كل حاجة قدامكم. تابعونا 👇
```
