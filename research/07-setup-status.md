# حالة التجهيز — 11 نوفمبر ✅

| الحاجة | الحالة | ملاحظة |
|---|---|---|
| CDP Portal | ✅ مشروع Sahm + API Key + Wallet Secret + Faucet (Sepolia) | **Paymaster من غير policy لسه.** هنضيف allowlist لعقد `SahmExecutor` بعد ما نعمله deploy |
| base.dev | ✅ مشروع Sahm + **Builder Code `bc_cs3y0r48`** + محفظة الدفع مربوطة | الكود عام ومش سر، وبيتحط على كل معاملة |
| Alchemy | ✅ تطبيق Sahm (Mainnet + Sepolia) | يتحط في `.env` بس |
| محفظة الاختبار | ✅ منفصلة، ومسجّلة كمحفظة الدفع | |
| الأسرار | محفوظة محليًا عند صاحب المشروع | `.env` متضاف في `.gitignore`، والقالب في `.env.example` |

## تسليم لجلسة البناء (13 نوفمبر)
1. ابدأ من `research/06-build-plan.md` (النطاق + المعمارية + الجدول).
2. المرجع التقني: `research/03-day12-validation.md` و`research/04-sandbox-guide.md` و`scripts/fork-swap-test.sh`.
3. أول مهمة: عقد `SahmExecutor` (Foundry ≥1.8.4، `hardfork = "base:Cobalt"`) + تست على fork: SpendPermission → swap → السهم يروح للمستخدم، مع Builder Code (ERC-8021) على المعاملة.
4. ممنوع أي private key أو secret في الكود أو الشات. كله في `.env` المحلي.
