# Stocks Maxxing — Agentic Stock Finance: دليل الفوز

> بحث بتاريخ 11 نوفمبر 2026. الهدف: نفهم إيه اللي خلّى المشاريع تكسب في الهاكاثونات اللي فاتت ونطبّقه على مشروعنا.

---

## 1. القواعد اللي هنتحكم بيها

| المعيار | الوزن | يعني إيه عمليًا |
|---|---|---|
| **Traction حقيقي على السلسلة** | **50%** | عدد مستخدمين ومعاملات حقيقية على Base خلال الفترة من 13 نوفمبر لـ 5 ديسمبر |
| جودة المنتج | 25% | المنتج شغال كامل من أوله لآخره، ومريح للمستخدم، وآمن |
| البناء العلني (Build in public) | 25% | بوستات على X، وrepo مفتوح، وتحديثات يومية. وفيه كمان جائزة منفصلة **$6,000** لأفضل Build in public |

الأوزان دي مصدرها README مشروع StockPilot ومقال واحد في Crypto Briefing، والقواعد الرسمية بتقول إن المعايير موجودة في "صفحة الـ Quest". **لازم نتأكد منها في جروبات الشركاء.**

**التسليم:** بوست على X فيه فيديو ديمو مع منشن لـ @buildonbase، وبعدها نملأ الـ Form. البناء على Testnet مقبول، لكن الـ traction الحقيقي بيتحسب على mainnet.

### إزاي Base بتقيس الـ traction؟ (من Onchain Summer Awards 2025، وكان هاكاثون بيتحكم بالـ traction بالكامل)
- الطلب على Blockspace في Base، يعني عدد المعاملات والـ gas.
- **المستخدمين اللي بيرجعوا** (Repeat users).
- المستخدمين اللي عندهم **Trust score عالي**، يعني مش bots.
- المستخدمين الجداد على Base.
- حجم التداول.
- إن كود العقود يكون **Open source**.
- بيانات الجلسات في Base App وFarcaster للـ mini apps.
- لازم المشروع يتسجّل على **base.dev**، ولازم **Builder Code** علشان النشاط يتنسب لينا.

> النتيجة: الأهم إن **مستخدمين حقيقيين يرجعوا كل يوم ويعملوا معاملات صغيرة**، مش صفقة واحدة كبيرة ولا bots.

---

## 2. أقرب هاكاثون لينا: Stocklana (Solana، سبتمبر 2026)
نفس الفكرة بالظبط (أسهم مرمّزة). اتقدّم فيه 604 مشروع، والجوايز كانت $126K. سؤال التحكيم كان:
**"هل ممكن ده يبقى تطبيق حقيقي الناس هتستخدمه فعلًا؟"**، يعني مستخدم حقيقي ومشكلة حقيقية، وديمو شغال كامل، وسبب مقنع إنه على الشبكة دي، وجودة تنفيذ.

| المركز | المشروع | الفكرة | ليه كسب |
|---|---|---|---|
| 🥇 $35K | **Roster Finance** | Options على الأسهم بضمان كامل، وأقصى خسارة هي الـ premium، ومفيش liquidation | حل مشكلة هيكلية، وهي الـ liquidation على أسعار غلط. الـ settlement ما بيعتمدش على oracle. 14 سوق شغالين |
| 🥈 $20K | **Draw** | تصرف من أسهمك من غير ما تبيعها | فكرة بسيطة وقيمتها واضحة للمستخدم العادي |
| 🥉 $15K | **Neo** | تطبيق مالي لغير الأمريكيين: محافظ أسهم جاهزة وrebalance تلقائي، ومفيش seed phrase | سوق ضخم ما حدّش بيخدمه. الأمان متعدد الطبقات. مفيش تعقيد كريبتو |
| 🥉 $15K | **CRESCO** | الشباب يدير فلوسه جوه حدود بتحطها العيلة | حدود بتفرضها السلسلة، ورفض بيتشرح للمستخدم |
| 🥉 $15K | **Xorr Finance** ⭐ (نفس فكرة مسارنا) | AI agents بتتداول الأسهم للمستخدم. كل agent ليه محفظة وقواعد، وفيه Kill switch بضغطة واحدة | **شغال على mainnet بفلوس حقيقية**، والـ bot عمره ما بيمسك فلوس المستخدم، وفيه Off-hours guard، وAudit trail |

### تفاصيل Xorr، أقرب مشروع كسب لفكرتنا
- تسجيل دخول بالإيميل أو Google عن طريق Privy، من غير محفظة.
- توقيع واحد بيدّي سقف صرف (USDC) يومي ومدة انتهاء، والسلسلة هي اللي بتفرض السقف.
- 4 agents شخصياتهم واضحة: **Momentum Scout** و**Yield Keeper** و**Drawdown Guard** و**Earnings Desk**.
- **Off-hours guard**: لو سعر الـ pool بعد عن سعر Pyth والسوق الأمريكي مقفول، الـ agent بيوقف دخول الصفقات.
- Kill switch بيلغي كل الصلاحيات، وبيشتغل حتى لو السيرفر واقع.
- كل الأفعال وكل حالات الرفض متسجلة في Audit trail مربوط بالـ hash، مع روابط على الـ explorer.
- سلّموا فيديوين: pitch وtechnical، وrepo فيه طريقة لإعادة إثبات المعاملات.

**الدرس:** فكرة "agent بيتداول" لوحدها مش كفاية. اللي كسب هو **agent آمن، المستخدم متحكم فيه، شغال بفلوس حقيقية، ومثبت على السلسلة.**

---

## 3. هاكاثونات تانية والدروس منها

| الهاكاثون | الفايزين في AI/Trading | الدرس |
|---|---|---|
| **Solana AI Hackathon** (يناير 2025) | الجائزة الكبرى ($60K) راحت لـ **The Hive**، وهو DeFi aggregator بواجهة chat. Trading: **Project Plutus**، وفيه trading agent وanalysis agent. DeFi: **Cleopetra**، agent بيدير LP | واجهة chat سهلة بتكسب. Agent بينفّذ فعلًا أحسن من agent بيحلل بس |
| **BNB Hack: AI Trading Agent** | Neural Alpha وGenesis وGridora وGuarded Alpha. وفيه track منفصل للـ "Strategy Skills" | معيار الحكام كان قد إيه الـ agent بيفهم السوق وبينفذ لوحده. والـ skills اللي ممكن تتعاد استخدامها ليها قيمة |
| **ETHGlobal Agentic Ethereum** (2025) | YieldSeeker وStreme.fun وPvPvAI من ضمن الـ finalists العشرة من 518 مشروع | ETHGlobal بيحب الـ agents اللي فيها جانب اجتماعي أو لعبة أو yield |
| **Circle USDC OpenClaw** | ClawRouter (agent بيدفع USDC لكل طلب)، وClawShield (أمان) | **الالتزام بالفورمات**: مشاريع قوية خسرت بسبب تسليم ناقص |
| **Base Onchain Summer Awards** (2025) | — | ⚠️ اتعملت ضجة لأن مشاريع "شكلية" كسبت. **خلّي كل حاجة قابلة للإثبات**: روابط معاملات ولوحة أرقام عامة |
| **Base Batches** | Onit (agent لأسواق التنبؤ)، وJesseXBT وTrendSage | Base بتحب الـ agents اللي ليها شخصية اجتماعية على X وFarcaster |

---

## 4. أنماط الفوز اللي اتكررت (ولازم مشروعنا يعمل كلها)

1. **شغال على mainnet بفلوس حقيقية** من أول أسبوع. Xorr وRoster وJOJO كلهم كانوا live.
2. **بيحل مشكلة هيكلية موثّقة**، زي الـ liquidation أو الأوراكل اللي بيقف أو صعوبة الوصول. في Base: Chainlink بيقف بره ساعات السوق، والـ DEX شغال 24/7، والـ multiplier بيتغير.
3. **المستخدم متحكم والأمان ظاهر**: non-custodial، وحدود بتفرضها السلسلة، وKill switch، وAudit trail. الحكام بيدوروا على ده في أي حاجة فيها agent.
4. **مستخدم مستهدف واضح ومحروم من الخدمة**: غير الأمريكيين اللي مش بيعرفوا يفتحوا حساب عند وسيط، زي Neo. **إحنا في مصر والعالم العربي، وده بالظبط السوق ده.**
5. **تجربة من غير تعقيد كريبتو**: إيميل بدل seed phrase، والـ gas مدفوع عن المستخدم، وواجهة chat.
6. **أسماء ونماذج بسيطة للـ agents** ("Drawdown Guard"). الحكام يفهموا الفكرة في 10 ثواني.
7. **نستخدم أدوات الشركاء** علشان ندخل في أكتر من جائزة. Xorr وRoster قدّموا في 3 tracks في نفس الوقت.
8. **التسليم احترافي**: فيديو pitch وفيديو technical، وrepo مفتوح، وطريقة لإعادة الإثبات، ولوحة أرقام عامة.
9. **Traction بيتكرر**: معاملات صغيرة متكررة من نفس المستخدمين (repeat users) أحسن من حجم تداول كبير مرة واحدة.

## 5. أسباب الخسارة (الدرس من AdMorph)
- فكرة بعيدة عن الحاجة الأساسية للراعي أو عن الـ narrative بتاع الهاكاثون.
- Demo أو slides من غير استخدام حقيقي.
- مستخدم مستهدف مش واضح.
- التسليم ناقص أو مش ملتزم بالفورمات.
- البناء بيتعمل في السر ونطلع آخر يوم، فبنخسر 25% (Build in public) وكمان الـ traction.

---

## 6. المنافسين في Base لحد دلوقتي
- **StockPilot**: DCA على 5 أسهم عن طريق Aerodrome. شغال على mainnet من 10 نوفمبر. بسيط.
- **Bankr** (شريك): Agent بيدير LP، وتداول بالأوامر النصية. التحقق مطلوب للأسهم B20 عن طريقه.
- لسه **مفيش "Xorr" على Base**، ومفيش منتج **عربي**، ومفيش **Off-hours fair value** على Base.

---

## 7. الفكرة المرشّحة بعد البحث

### **"Sahm" (سهم): Arabic-first Agentic Stock Desk on Base** (الاسم مبدئي)
بنجمع أنجح 3 أنماط: **Xorr** (agents آمنة بقواعد) و**Neo** (لغير الأمريكيين ومن غير تعقيد) والفجوة اللي على **Base** (الأوراكل بيقف بره ساعات السوق)، وبنضيف عليهم ميزة محدش عنده: **السوق العربي**.

**المنتج:**
- Mini App على Base App، ودخول بالإيميل بـ Smart Wallet، وGas مدفوع عن المستخدم عن طريق Paymaster.
- المستخدم يكلّم الـ agent بالعربي، مثلًا: "استثمر 5 دولار كل يوم في NVDA وأبل، ووقف لو نزلوا 10%".
- **Spend Permissions** في Coinbase Smart Wallet: سقف يومي ومدة، والسلسلة هي اللي بتفرضه، وKill switch بضغطة.
- 3 agents أسماؤهم بالعربي: **المُدّخر** (DCA ذكي) و**الحارس** (stop-loss وحماية من الهبوط) و**صائد الويك إند** (يشتري لما سعر الـ DEX يكون أقل من السعر العادل والسوق مقفول).
- **محرك Off-hours Fair Value**: ده الجزء التقني المميز. بيتعرض للـ agents التانيين كـ API بالدفع لكل طلب (x402)، وده مصدر traction تاني.
- Audit trail عام، وصفحة Stats مفتوحة فيها المستخدمين والمعاملات، وBuilder Code.

**ليه نسبة الفوز عالية:**
- الـ **50% traction**: معاملات يومية صغيرة متكررة من مستخدمين حقيقيين عن طريق الـ DCA، وده بالظبط مقياس الـ repeat users. ومعانا شبكة عربية نوصل لها.
- الـ **25% منتج**: نفس نمط Xorr اللي كسب، ومعاه ميزة تقنية جديدة (fair value).
- الـ **25% build in public**: محتوى بالعربي والإنجليزي، وبوست كل ويك إند "توقعنا للافتتاح مقابل الحقيقة".
- **قصة قوية للحكام**: "مليار دولار volume والعرب برا اللعبة. إحنا بنجيب الـ 400 مليون الجايين".

**مخاطر لازم نتأكد منها (12–13 نوفمبر):**
- [ ] هل شراء B20 من Aerodrome مباشرة محتاج verification؟ (الوثائق بتقول إن التداول permissionless)
- [ ] هل Spend Permissions شغالة مع الأسهم B20؟ (فيه transfer policy على `isAuthorized`)
- [ ] السيولة في الـ pools: كام سهم عليه سيولة كفاية لصفقات $1–$10؟
- [ ] مصدر السعر العادل في الويك إند: Hyperliquid stock perps / futures
- [ ] نسأل في جروب Bankr وBaseStonk عن معايير التحكيم الرسمية وهل فيه جوائز شركاء للـ agents
- [ ] الامتثال: نقفل الخدمة على US وUK، ونكتب disclaimer واضح

## 8. الخطة لحد 13 نوفمبر
- **11 نوفمبر**: البحث ده ✅
- **12 نوفمبر**: نتحقق من المخاطر اللي فوق تقنيًا. ونعمل استبيان سريع لـ 20–30 شخص عربي: "لو فيه تطبيق كده، هتستخدمه؟". ونسأل في جروبات الشركاء.
- **13 نوفمبر**: نثبّت الفكرة والـ scope، ونقدّم في الـ Form، وننشر أول بوست Build in public، ونسجّل في base.dev ونجيب Builder Code.

## المصادر
- Stocklana winners: https://hackathons.solana.com/hackathons/stocklana
- Xorr Finance: https://hackathons.solana.com/hackathons/stocklana/projects/743b365c-56a1-47d2-b27d-bd9aa5837018
- Roster Finance: https://hackathons.solana.com/hackathons/stocklana/projects/a3436f56-dc4f-4454-9405-533b48823a52
- Neo: https://hackathons.solana.com/hackathons/stocklana/projects/018d4a14-6216-4b33-9c76-f903c6d0eee6
- Onchain Summer Awards criteria: https://onchain-summer-awards.devfolio.co/
- Base hackathon controversy: https://www.bitdegree.org/crypto/news/employees-won-with-ai-shell-projects-the-base-hackathon-controversy
- Solana AI Hackathon winners: https://www.coinlive.com/news/a-quick-look-at-the-21-winning-projects-at-the
- BNB AI Trading Agent winners: https://www.bnbchain.org/en/blog/meet-the-winners-of-bnb-hack-ai-trading-agent-edition
- Circle OpenClaw lessons: https://www.circle.com/blog/meet-the-winners-of-our-first-usdc-openclaw-hackathon----and-what-we-learned
- ETHGlobal Agentic Ethereum finalists: https://x.com/ETHGlobal/status/1890448806975795550
- Base Batches 001 recap: https://devfolio.co/blog/base-batches-2025-recap/
- StockPilot (competitor + weights): https://github.com/Heryp0401/stockpilot
- B20 spec: https://docs.base.org/specifications/b20/tokenized-stocks-on-base
- Forkast market data: https://forkast.news/coinbase-tokenized-stocks-just-passed-1b-in-volume-on-base-the-real-story-is-what-comes-next/
