# مواصفات البناء (جاهزة لـ 13 نوفمبر)

> الملف ده هو المرجع الوحيد وقت البناء. أي حاجة مش هنا تبقى برّه نطاق الـ MVP.
> مبني على: `09` (السوق والخطة)، و`10` (قواعد الـ Agent)، و`08` (مشكلة المستخدم).

---

## 1. جدول الحلال (النسخة 1) — اتحسب من بيانات SEC الرسمية

**المنهجية (AAOIFI، معيار 21، مبسّطة):**
| المعيار | الحد | المصدر |
|---|---|---|
| الديون ÷ القيمة السوقية | < 30% | آخر 10-Q/10-K: الديون طويلة وقصيرة الأجل |
| النقد والاستثمارات قصيرة الأجل ÷ القيمة السوقية | < 30% | آخر ميزانية |
| إيراد الفوائد ÷ الإيرادات | < 5% | آخر 10-K. **ده مؤشر تقريبي** لنسبة الدخل غير المباح |
| نشاط الشركة | مش (بنوك ربوية، وخمور، وقمار، وترفيه محرّم، ...) | مراجعة يدوية |

القيمة السوقية = عدد الأسهم × سعر Hyperliquid يوم 12/11. البيانات في `data/halal/ratios-2026-11-12.json`، والسكريبت `scripts/analysis/halal-screen.mjs`.

| السهم | الديون % | النقد % | فوائد/إيراد % | النشاط | الحكم المبدئي |
|---|---|---|---|---|---|
| NVDA | 0.9 | 0.6 | 1.07 | شرائح | ✅ متوافق |
| GOOGL | 3.5 | 7.3 | 1.08 | إعلانات وسحابة | ✅ متوافق (مع تطهير) |
| META | 5.2 | 5.1 | 1.06 | إعلانات | ✅ متوافق (مع تطهير) |
| AAPL | 1.6 | 1.1 | 0.78 | أجهزة | ✅ متوافق |
| MSFT | 0.9 | 1.7 | 0.20 | برمجيات | ✅ متوافق |
| AMD | 0.8 | 1.7 | 0.01 | شرائح | ✅ متوافق |
| ORCL | 1.9 | 9.8 | 1.16 | برمجيات | ✅ متوافق |
| SNDK | 0.0 | 3.9 | 0.35 | ذاكرة | ✅ متوافق |
| AVGO | 3.7 | 1.4 | 0.54 | شرائح | ✅ متوافق |
| TSLA | 0.1 | 3.0 | 1.77 | سيارات | ✅ متوافق |
| AMZN | 6.3 | 4.0 | 0.61 | تجارة وسحابة (فيها مبيعات خمور بنسبة صغيرة) | ✅ متوافق (مع تطهير) |
| BE | 4.1 | 4.2 | 1.68 | طاقة | ✅ متوافق |
| MU | 0.1 | 4.9 | 0.01 | ذاكرة | ✅ متوافق |
| INTC | 15.6 | 16.8 | 1.91 | شرائح | ✅ متوافق (النسب أعلى من غيره) |
| LLY | 3.6 | 0.4 | 0.27 | أدوية | ✅ متوافق |
| MRVL | 3.5 | 2.8 | 0.18 | شرائح | ✅ متوافق |
| **PLTR** | 0.05 | 2.4 | **5.12** | برمجيات (فيها عقود دفاع) | ⚠️ **على الحد**: فوايد أكتر من 5% |
| **NFLX** | 5.7 | 3.1 | 0.65 | محتوى ترفيهي | ⚠️ **مختلف عليه**: طبيعة المحتوى |
| **MSTR** | 13.4 | 11.8 | 0.10 | برمجيات + خزينة بيتكوين بديون قابلة للتحويل | ⚠️ **مختلف عليه** |
| **CRCL** | 0 | 9.7 | — | **إيرادها الأساسي فوايد على احتياطيات USDC** | ❌ **غير متوافق** |
| SPCX | — | — | — | شركة خاصة، مفيش بيانات SEC | ⚪ **غير مصنّف** |

**تحفظات (تتكتب في الموقع):**
- ده **مؤشر استرشادي، مش فتوى**. المستخدم يراجع عالم أو هيئة شرعية.
- الدخل غير المباح محسوب من إيراد الفوايد بس. ممكن يكون فيه مصادر تانية.
- القيمة السوقية بالسعر الحالي، مش متوسط 36 شهر.
- التحديث: كل ربع سنة بعد نتايج الشركات.

**سلة "حلال فقط":** NVDA وMSFT وAAPL وGOOGL (أعلى سيولة ومتوافقين).

---

## 2. رحلة المستخدم (MVP)
```
1. الرئيسية ──► "ابدأ بـ 5 دولار"
2. تسجيل الدخول (Base Account: passkey)
3. عندك USDC على Base؟
     لأ ──► الدليل (/start) ──► بنراقب المحفظة ونقول "وصلت ✅"
     آه ──► كمّل
4. اختار: سهم واحد أو سلة (الحلال جاهزة أول اختيار)
5. المبلغ ($1–$20) والتكرار (يومي/أسبوعي) + "اشتري أكتر لما ينزل" (اختياري)
6. شاشة مراجعة: "هتصرف بحد أقصى $X في اليوم لمدة 30 يوم. توقفه في أي وقت."
7. توقيع Spend Permission (مرة واحدة)
8. أول شراء فوري ──► رابط Basescan ──► "مبروك، بقيت مالك 0.028 سهم NVIDIA 🎉"
9. محفظتي: الأسهم، والسجل، وزر الإيقاف
```

## 3. الشاشات (5 + صفحة عامة)
| # | الشاشة | المحتوى | النص الأساسي (عربي) |
|---|---|---|---|
| 1 | **الرئيسية** `/` | الرسالة، و3 مميزات، وأرقام حية من /stats، وزر | "استثمر في أسهم أمريكية حلال، بالعربي، من دولار واحد. فلوسك في محفظتك." |
| 2 | **الدليل** `/start` | 3 تبويبات: Binance، وCoinbase، ومحفظة تانية. صور الخطوات، وتحذير الشبكة، وعنوان المحفظة مع زر نسخ وQR، وحالة "مستني الفلوس..." | "⚠️ اختار شبكة **Base** بس. لو اخترت شبكة تانية الفلوس ممكن تضيع." |
| 3 | **الأسهم** `/stocks` | بطاقة لكل سهم: الاسم بالعربي، والسعر، وعلامة الحلال، وشريط السيولة، وحالة السوق (مفتوح/مقفول) | "✅ متوافق مبدئيًا · سيولة عالية" |
| 4 | **الخطة** `/plan` | السهم أو السلة، والمبلغ، والتكرار، و"اشتري أكتر لما ينزل"، والمراجعة، والتوقيع | "سهم مش بيتنبأ بالسوق. بيشتريلك بانتظام وبالسعر العادل." |
| 5 | **محفظتي** `/portfolio` | الأسهم بالقيمة، والخطة، والسجل (كل عملية ليها سبب بالعربي ورابط Basescan)، وزر **إيقاف كل حاجة** | "اتأجّل شراء النهارده: السعر كان أعلى من العادل بـ 0.4%. هنحاول تاني بعد ساعة." |
| — | **الأرقام** `/stats` (عامة) | المحافظ، والمعاملات، والحجم، والمستخدمين المتكررين، وآخر 20 عملية | للجنة التحكيم |

**التصميم:** RTL، وخط IBM Plex Sans Arabic، وألوان هادية (أخضر للنمو، ومن غير أحمر صريخ)، وموبايل أولًا، وإنجليزي كخيار.

---

## 4. العقد `SahmExecutor`
### الهدف
ينفّذ شراء نيابة عن المستخدم في معاملة واحدة atomic: يسحب USDC بالـ Spend Permission، ويشتري السهم، والسهم يروح **لمحفظة المستخدم مباشرة**. العقد **عمره ما يحتفظ برصيد**.

### الحالة (state)
| المتغير | النوع | ملاحظات |
|---|---|---|
| `SPM` | immutable | `0xf85210B21cC50302F477BA56686d2019dC9b67Ad` |
| `USDC` | immutable | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `owner` | address | محفظتنا (بعدين multisig) |
| `agent` | address | محفظة الـ agent، وهي الوحيدة اللي تنفّذ |
| `allowedStock[address]` | bool | الأسهم المسموحة (owner يحدّثها) |
| `allowedRouter[address]` | bool | KyberSwap router وAerodrome router |
| `paused` | bool | إيقاف طوارئ |

### الدوال
```solidity
function execute(
    SpendPermission calldata p,   // spender == address(this), token == USDC
    bytes calldata signature,     // لو أول مرة: approveWithSignature، غير كده فاضي
    uint160 amount,               // USDC (6 decimals)
    address stock,
    uint256 minOut,               // من quote الـ agent بعد الحارس
    address router,
    bytes calldata swapData,      // recipient = p.account
    uint256 deadline
) external onlyAgent whenNotPaused;

function setAgent(address) external onlyOwner;
function setStock(address, bool) external onlyOwner;
function setRouter(address, bool) external onlyOwner;
function pause() / unpause() external onlyOwner;
function rescue(address token, address to) external onlyOwner; // للفتافيت بس
event Executed(address indexed user, address indexed stock, uint256 usdcIn, uint256 stockOut, uint256 refund);
```

### خطوات `execute`
1. `block.timestamp <= deadline`، والـ stock والـ router مسموحين، و`p.spender == this`، و`p.token == USDC`.
2. لو فيه توقيع وأول مرة: `SPM.approveWithSignature(p, signature)`.
3. `SPM.spend(p, amount)`، فالـ USDC يدخل العقد.
4. نقرا رصيد السهم عند المستخدم (`before`).
5. `USDC.approve(router, amount)` ← `router.call(swapData)` ← `USDC.approve(router, 0)`.
6. `after - before >= minOut`، وإلا revert.
7. أي USDC فاضل يرجع للمستخدم (refund).
8. `emit Executed(...)`. والـ Builder Code (ERC-8021) بيتضاف في آخر الـ calldata من الـ agent.

### اختبارات (fork، `--hardfork base:Cobalt`)
| الاختبار | المتوقع |
|---|---|
| شراء NVDA بـ $5 | السهم في محفظة المستخدم، والعقد رصيده صفر |
| `minOut` أعلى من الممكن | revert، ومفيش USDC اتسحب |
| حد غير الـ agent ينادي | revert |
| سهم أو router مش مسموح | revert |
| مبلغ أكبر من السقف اليومي | revert (من SPM) |
| بعد ما المستخدم يعمل revoke | revert |
| `paused` | revert |
| router بيرجّع أقل | revert |
| تنفيذ مرتين في نفس اليوم في حدود السقف | ينجح |

---

## 5. الـ Agent
| الجزء | التفاصيل |
|---|---|
| التشغيل | كل ساعة (Vercel Cron أو Supabase pg_cron) |
| الخطط المستحقة | من جدول `sahm_plans` |
| **الحارس** | (1) السعر: DEX ≤ Hyperliquid × 1.003. (2) السيولة ≥ $100K. (3) أثر السعر ≤ 0.5%. لو فشل: يأجّل ساعة، لحد 6 مرات |
| اشتري أكتر لما ينزل | لو السعر أقل من أعلى سعر في 30 يوم بـ 10% أو أكتر: المبلغ ×1.5، والسقف على السلسلة هو الحد |
| التنفيذ | Kyber `route/build` (recipient = المستخدم) ← `SahmExecutor.execute` ← Builder Code suffix |
| السجل | كل قرار (نفّذ/أجّل/رفض + السبب) في `sahm_executions` |
| **الذكاء الاصطناعي** | **Meta Llama API** (نفس الموديل اللي بنستخدمه دايمًا، والاسم في `LLAMA_MODEL`). استخدامه: (1) يكتب سبب كل قرار بالعربي البسيط، (2) ملخص الأخبار اليومي (المرحلة 2)، (3) يحوّل كلام المستخدم لخطة JSON (المرحلة 2). **الـ LLM عمره ما بيقرر الشراء.** القرار بالقواعد |

`.env` (محلي بس): `LLAMA_API_KEY`، `LLAMA_MODEL`، `AGENT_PRIVATE_KEY`، `CDP_API_KEY_*`، `ALCHEMY_URL`، `SUPABASE_SERVICE_ROLE_KEY`، `KYBER_CLIENT_ID=sahm`، `BUILDER_CODE=bc_cs3y0r48`.

---

## 6. البيانات (Supabase، مشروع DalilPi، بادئة `sahm_`)
| الجدول | الأعمدة الأساسية |
|---|---|
| `sahm_users` | wallet، lang، created_at |
| `sahm_plans` | user، stock أو basket، amount_usd، frequency، dip_boost، permission (json)، status، next_run |
| `sahm_executions` | plan_id، decision (executed/deferred/rejected)، reason_ar، usdc_in، stock_out، tx_hash، gap_pct |
| `sahm_halal` | ticker، debt_pct، cash_pct، interest_pct، verdict، note_ar، as_of |
| `sahm_gap_log` | ✅ **اتعمل وشغال** كل 5 دقايق |

---

## 7. هيكل الـ repo
**القرار (12 نوفمبر):** كل حاجة في نفس الـ repo `base_ai`. ⚠️ لو هيتعمل public، ملفات البحث (ومنها `05-partners.md` و`02-application-form.md`) هتبقى ظاهرة هي والـ git history بتاعها.
```
base_ai/
├── research/           البحث والخطط (موجود)
├── scripts/            التحليل واختبار الـ fork (موجود)
├── survey/             الاستبيان (موجود)
├── contracts/          Foundry: src/SahmExecutor.sol، test/، script/
├── agent/              Node + viem: guard.ts، executor.ts، plans.ts، llama.ts
├── web/                Next.js + OnchainKit (RTL)
├── supabase/           migrations + functions (gap-logger اتنقل هنا)
├── data/halal/         جدول الحلال + المنهجية
└── README.md           عربي + إنجليزي، ومعاه روابط /stats وBasescan
```

---

## 8. خطة 13 نوفمبر (يوم البناء الأول)
| الوقت | المهمة | علامة النجاح |
|---|---|---|
| الصبح | Foundry في `contracts/` + Next.js في `web/` | `forge build` و`next build` ينجحوا |
| الضهر | `SahmExecutor` + اختبارات الـ fork | 9 اختبارات ✅ |
| العصر | Deploy على Sepolia (بـ mock stock) | عنوان العقد على sepolia.basescan |
| بالليل | بوست اليوم 0 (عربي + إنجليزي) | منشور ✅ |
