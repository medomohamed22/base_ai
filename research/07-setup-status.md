# حالة التجهيز — 11 نوفمبر ✅

| الحاجة | الحالة | ملاحظة |
|---|---|---|
| CDP Portal | ✅ مشروع Sahm + API Key + Wallet Secret + Faucet (Sepolia) | **Paymaster من غير policy لسه.** هنضيف allowlist لعقد `SahmExecutor` بعد ما نعمله deploy |
| base.dev | ✅ مشروع Sahm + **Builder Code `bc_cs3y0r48`** + محفظة الدفع مربوطة | الكود عام ومش سر، وبيتحط على كل معاملة |
| Alchemy | ✅ تطبيق Sahm (Mainnet + Sepolia) | يتحط في `.env` بس |
| محفظة الاختبار | ✅ منفصلة، ومسجّلة كمحفظة الدفع | |
| **Vercel** | ✅ مشروع `sahm` مربوط بـ `medomohamed22/base_ai` | Root Directory = `web/`، وFramework = Next.js، وNode 22. أي push لـ `main` بيعمل deploy production. الـ build بيتخطّى لو مفيش تغيير في `web/`، ودي حماية من commits الـ gap-logger كل 15 دقيقة |
| الأسرار | محفوظة محليًا عند صاحب المشروع | `.env` متضاف في `.gitignore`، والقالب في `.env.example` |

## تسليم لجلسة البناء (13 نوفمبر)
1. ابدأ من `research/06-build-plan.md` (النطاق + المعمارية + الجدول).
2. المرجع التقني: `research/03-day12-validation.md` و`research/04-sandbox-guide.md` و`scripts/fork-swap-test.sh`.
3. أول مهمة: عقد `SahmExecutor` (Foundry ≥1.8.4، `hardfork = "base:Cobalt"`) + تست على fork: SpendPermission → swap → السهم يروح للمستخدم، مع Builder Code (ERC-8021) على المعاملة.
4. موقع/Mini App: يتبني جوه `web/` (Next.js). المتغيرات العامة (`NEXT_PUBLIC_*`) تتحط في Vercel → Settings → Environment Variables، مش في الكود.
5. ممنوع أي private key أو secret في الكود أو الشات. كله في `.env` المحلي.
