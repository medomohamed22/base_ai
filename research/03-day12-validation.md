# يوم 12 نوفمبر — التحقق التقني + التحقق من السوق

> كل الأرقام دي اتقاست مباشرة من السلسلة ومن الـ APIs يوم 11/11/2026 الساعة 09:47 UTC، يعني والسوق الأمريكي مقفول (overnight).

## ✅ النتيجة السريعة
| السؤال | النتيجة | الحكم |
|---|---|---|
| الأسهم موجودة؟ | **338 سهم** B20 على Base في Tokenized Stocks API | ✅ |
| فيه سيولة تكفي لصفقات $1–$10؟ | **61 سهم** ليهم pools. **18 سهم** سيولتهم فوق $100K، و**4** فوق $1M. السيولة الكلية حوالي $11.8M، وحجم التداول في 24 ساعة حوالي **$97.6M** | ✅ أكتر من كفاية |
| الشراء محتاج KYC على السلسلة؟ | **لأ.** كل الأسهم اللي جربناها (NVDA وGOOGL وMETA وAAPL وMSFT وSNDK وAMD) مربوطة بـ **policy رقم 5**، و**محفظة جديدة عشوائية = authorized ✅** على sender وreceiver وexecutor | ✅ أي محفظة، حتى لو smart wallet أو عقد، تقدر تشتري وتمسك |
| Spend Permissions موجودة على Base؟ | `SpendPermissionManager` على `0xf852…67Ad`، والكود موجود (12.6KB) | ✅ |
| مصدر سعر لما السوق مقفول؟ | Hyperliquid **xyz** stock perps فيها كل الأسهم الكبيرة | ✅ |
| فرق السعر بين DEX وperp | في الـ overnight: **‎-0.6% لـ ‎+0.1%**، وأغلبها أقل من 0.25% | ⚠️ صغير. **الويك إند لسه مش مقاس** |

### أعلى الأسهم سيولة على Aerodrome (pools بـ USDC)
| السهم | السيولة | حجم 24 ساعة | عدد المعاملات في 24 ساعة |
|---|---|---|---|
| GOOGLc | $2.04M | $8.6M | 5,580 |
| SNDKc | $1.64M | $30.1M | 27,941 |
| NVDAc | $1.43M | $9.5M | 10,382 |
| METAc | $1.02M | $12.0M | 6,355 |
| SPCXc | $0.95M | $11.7M | 12,361 |
| MSFTc | $0.54M | $8.1M | 4,820 |
| AAPLc | $0.52M | $4.6M | 3,375 |
| PLTRc | $0.36M | $4.2M | 7,848 |
| AMDc | $0.34M | $5.1M | 16,436 |
| ORCLc | $0.26M | $2.2M | 9,083 |

**القرار:** نبدأ بـ **أسهم أساسية** (GOOGL وNVDA وMETA وMSFT وAAPL وAMD وPLTR وORCL وSNDK). ومعاهم ممكن **SPCX** (SpaceX)، لأنه عليه حجم تداول وناس بتدور عليه.

## 🔐 التصميم التقني المختار (non-custodial وatomic)
```
المستخدم (Base Account / Smart Wallet)
   │  توقيع مرة واحدة: SpendPermission { token: USDC, allowance: $X/يوم, period: 1 day, end: 30 يوم, spender: SahmExecutor }
   ▼
Agent (offchain) ── يقرر ──► SahmExecutor.execute(permission, amount, stock, minOut)
                               1) SpendPermissionManager.spend() → USDC من محفظة المستخدم للعقد
                               2) swap على Aerodrome (USDC → STOCKc)
                               3) السهم يروح لمحفظة المستخدم في نفس المعاملة
                               (كل ده atomic: لو فشلت أي خطوة، المعاملة كلها بتترجع)
```
- الـ Agent **عمره ما بيمسك فلوس**، والعقد ما بيحتفظش برصيد بعد المعاملة.
- السقف اليومي والمدة **السلسلة هي اللي بتفرضهم**.
- الـ Kill switch = `revoke` على الـ permission، وده بيشتغل حتى لو السيرفر واقع (نفس نمط Xorr اللي كسب).
- Builder Code (ERC-8021) بيتضاف على كل معاملة.
- **ملاحظة:** البيع (stock → USDC) محتاج permission تاني على توكن السهم. ده مرحلة 2.

## ⚠️ تعديل على الفكرة بناءً على الداتا
فرق السعر في الـ overnight صغير جدًا (أقل من 0.6%)، فـ **"صائد الويك إند" كمصدر ربح مش مضمون.**
- **نغيّر دوره:** محرك السعر العادل يبقى **حارس أمان** (Guard)، ودي ميزة "Product quality". الـ agent يرفض يشتري لو سعر الـ DEX بعيد عن السعر العادل، ومش هو اللي بيبيع "فرص".
- **نقيس الويك إند الجاي (14–16 نوفمبر)** بالـ logger. لو لقينا فرق ثابت أكبر من 1%، نرجّع ميزة "اشتري الخصم".
- الداتا دي كمان **محتوى Build in public جاهز**: "قسنا أسعار الأسهم المرمّزة على Base طول الويك إند، ودي النتايج".

## 🛠️ اللي اتعمل في الـ repo
- `scripts/gap-logger.mjs`: بيسجّل سعر DEX وسعر perp والفرق بينهم لـ 11 سهم (من غير dependencies).
- `.github/workflows/gap-logger.yml`: بيشغّله كل 15 دقيقة ويحفظ النتيجة في `data/gaps.csv`.
  - **علشان يشتغل لازم يتعمل merge على `main`**، لأن GitHub بيشغّل الـ cron من الـ default branch بس.

---

## 📋 التحقق من السوق: استبيان (20–30 شخص)
انسخه في Google Form وابعته على جروبات واتساب وتيليجرام وتويتر العربية:

```text
عنوان: استبيان سريع (دقيقة واحدة) — استثمار في الأسهم الأمريكية بالموبايل

1) سنك؟  [أقل من 18 / 18-24 / 25-34 / 35-44 / 45+]
2) بلدك؟  [مصر / السعودية / الإمارات / المغرب / بلد تاني: ___]
3) عمرك استثمرت في أسهم أمريكية (زي أبل أو إنفيديا)؟  [أيوه حاليًا / جربت قبل كده / لأ بس نفسي / لأ ومش مهتم]
4) لو "لأ"، إيه اللي مانعك؟ (اختار أكتر من واحد)
   [مش عارف أفتح حساب عند وسيط / الحد الأدنى للإيداع كبير / الرسوم عالية / مش فاهم ابدأ منين / خايف أخسر / مشكلة تحويل الفلوس / سبب تاني]
5) عندك USDC أو أي عملة رقمية؟  [أيوه / لأ بس أعرف أشتري / لأ ومعرفش]
6) لو فيه تطبيق تكلّمه بالعربي وتقوله "استثمر 5 دولار كل يوم في أبل"، وهو يعمل كده لوحده بحدود إنت اللي بتحددها وتقدر توقفه في أي لحظة، هتجربه؟
   [أكيد / غالبًا / مش متأكد / لأ]
7) أقصى مبلغ ترتاح تبدأ بيه؟  [$1-5 / $5-20 / $20-100 / أكتر من $100]
8) إيه أهم حاجة لازم تكون موجودة علشان تثق في تطبيق زي ده؟  (نص حر)
9) عايز تبقى من أول 50 واحد يجربوه (مجانًا) أثناء الهاكاثون؟ سيب يوزر X أو تيليجرام:  (نص حر — اختياري)
```
**معيار النجاح:** لو 40% أو أكتر جاوبوا "أكيد/غالبًا" في سؤال 6، و15 شخص أو أكتر سابوا يوزر في سؤال 9 → نكمّل. دول هيبقوا أول مستخدمين، وده بداية الـ traction.

---

## 💬 رسالة لجروبات الشركاء (Bankr وBaseStonk)
```text
Hi team 👋 building in the Agentic Stock Finance track.

Project: Sahm — Arabic-first agent that lets non-US users auto-invest small USDC amounts into Coinbase tokenized stocks on Base (DCA + drawdown guard), non-custodial via Spend Permissions + Aerodrome, with an off-hours fair-value guard (Hyperliquid xyz perps vs DEX).

Quick questions:
1) Can you confirm the judging weights (50% onchain traction / 25% product / 25% build-in-public)? How is traction measured — Builder Code attribution, unique wallets, repeat users, volume?
2) Does Base Stonk / Bankr offer partner prizes or integration support for agent projects in this track? Any API we should build on (e.g. Bankr agent/trading API)?
3) Our application form confirmation said "TEST registration saved… not a final submission". Is our application counted, or should we re-apply?
4) Any recommended source for off-hours reference prices besides Chainlink (which freezes outside market hours)?

Thanks!
```

---

## ✅ قائمة 13 نوفمبر
- [ ] نجمع ردود الاستبيان (الهدف 20+ رد)
- [ ] نجمع ردود الشركاء على الأسئلة الأربعة
- [ ] نسجّل المشروع على **base.dev** ونطلع **Builder Code**
- [ ] نعمل merge على `main` علشان الـ gap-logger يشتغل قبل الويك إند
- [ ] أول بوست Build in public، مثلًا: "Day 0: we checked every Coinbase tokenized stock on Base — 338 tokens, 61 with pools, $97M daily volume. Building an Arabic-first agent for it. 🧵"
- [ ] نثبّت الـ scope النهائي ونبدأ البناء (Smart contract `SahmExecutor` + agent + Mini App)
