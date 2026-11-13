// Generated from data/halal/ratios-2026-11-12.json + Coinbase tokenized-stocks list (2026-11-13).
// Indicative screen, not a fatwa.

export type Verdict = "ok" | "edge" | "no" | "na";

export type Stock = {
  ticker: string;
  nameAr: string;
  nameEn: string;
  address: `0x${string}`;
  activityAr: string;
  verdict: Verdict;
  noteAr: string;
  debtPct: number | null;
  cashPct: number | null;
  intPct: number | null;
  asOf: string | null;
};

export const STOCKS: Stock[] = [
  {
    "ticker": "NVDA",
    "nameAr": "إنفيديا",
    "nameEn": "NVIDIA Corporation",
    "address": "0xb20000000000000000000078ee7ce2fE4908108C",
    "activityAr": "شرائح",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 0.89,
    "cashPct": 0.58,
    "intPct": 1.07,
    "asOf": "2026-07-26"
  },
  {
    "ticker": "GOOGL",
    "nameAr": "ألفابت (جوجل)",
    "nameEn": "Alphabet Inc.",
    "address": "0xb2000000000000000000002D0BA3164cc74f58B7",
    "activityAr": "إعلانات وسحابة",
    "verdict": "ok",
    "noteAr": "مع تطهير",
    "debtPct": 3.46,
    "cashPct": 7.28,
    "intPct": 1.08,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "META",
    "nameAr": "ميتا",
    "nameEn": "Meta Platforms Inc.",
    "address": "0xb2000000000000000000008bC8786B856E61707C",
    "activityAr": "إعلانات",
    "verdict": "ok",
    "noteAr": "مع تطهير",
    "debtPct": 5.18,
    "cashPct": 5.11,
    "intPct": 1.06,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "AAPL",
    "nameAr": "أبل",
    "nameEn": "Apple Inc.",
    "address": "0xb200000000000000000000C2e324d24d7eEcd1fb",
    "activityAr": "أجهزة",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 1.55,
    "cashPct": 1.1,
    "intPct": 0.78,
    "asOf": "2026-09-26"
  },
  {
    "ticker": "MSFT",
    "nameAr": "مايكروسوفت",
    "nameEn": "Microsoft Corporation",
    "address": "0xB200000000000000000000Ab99cFa739E253872B",
    "activityAr": "برمجيات",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 0.92,
    "cashPct": 1.67,
    "intPct": 0.2,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "AMD",
    "nameAr": "إيه إم دي",
    "nameEn": "Advanced Micro Devices, Inc.",
    "address": "0xB2000000000000000000000d8Ce462E99ee7A47B",
    "activityAr": "شرائح",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 0.76,
    "cashPct": 1.7,
    "intPct": 0.01,
    "asOf": "2026-09-26"
  },
  {
    "ticker": "ORCL",
    "nameAr": "أوراكل",
    "nameEn": "Oracle Corporation",
    "address": "0xb200000000000000000000347AFbA223D7B6b63C",
    "activityAr": "برمجيات",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 1.91,
    "cashPct": 9.83,
    "intPct": 1.16,
    "asOf": "2026-08-31"
  },
  {
    "ticker": "SNDK",
    "nameAr": "سانديسك",
    "nameEn": "Sandisk Corporation",
    "address": "0xb200000000000000000000397293Cb8cda9a10c5",
    "activityAr": "ذاكرة",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 0,
    "cashPct": 3.85,
    "intPct": 0.35,
    "asOf": "2026-10-02"
  },
  {
    "ticker": "AVGO",
    "nameAr": "برودكوم",
    "nameEn": "Broadcom Inc.",
    "address": "0xB200000000000000000000Fc737aeA6196aB5a4c",
    "activityAr": "شرائح",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 3.7,
    "cashPct": 1.44,
    "intPct": 0.54,
    "asOf": "2026-08-02"
  },
  {
    "ticker": "TSLA",
    "nameAr": "تسلا",
    "nameEn": "Tesla Inc.",
    "address": "0xb2000000000000000000001e800a7f5189430cD0",
    "activityAr": "سيارات",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 0.09,
    "cashPct": 2.97,
    "intPct": 1.77,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "AMZN",
    "nameAr": "أمازون",
    "nameEn": "Amazon.com Inc.",
    "address": "0xb200000000000000000000d9192b6B456483C2E8",
    "activityAr": "تجارة وسحابة",
    "verdict": "ok",
    "noteAr": "مع تطهير",
    "debtPct": 6.27,
    "cashPct": 3.97,
    "intPct": 0.61,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "BE",
    "nameAr": "بلوم إنرجي",
    "nameEn": "Bloom Energy Corporation",
    "address": "0xb20000000000000000000016f9dfe862feBA122b",
    "activityAr": "طاقة",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 4.14,
    "cashPct": 4.16,
    "intPct": 1.68,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "MU",
    "nameAr": "ميكرون",
    "nameEn": "Micron Technology Inc.",
    "address": "0xb200000000000000000000Fd2f87532B90095211",
    "activityAr": "ذاكرة",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 0.06,
    "cashPct": 4.91,
    "intPct": 0.01,
    "asOf": "2026-09-03"
  },
  {
    "ticker": "INTC",
    "nameAr": "إنتل",
    "nameEn": "Intel Corporation",
    "address": "0xB2000000000000000000004AFF16039bA04bdFBc",
    "activityAr": "شرائح",
    "verdict": "ok",
    "noteAr": "النسب أعلى من غيره",
    "debtPct": 15.6,
    "cashPct": 16.8,
    "intPct": 1.91,
    "asOf": "2026-09-26"
  },
  {
    "ticker": "LLY",
    "nameAr": "إيلاي ليلي",
    "nameEn": "Eli Lilly & Co",
    "address": "0xB200000000000000000000f1a0F91e34892E4718",
    "activityAr": "أدوية",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 3.63,
    "cashPct": 0.36,
    "intPct": 0.27,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "MRVL",
    "nameAr": "مارفل",
    "nameEn": "Marvell Technology, Inc.",
    "address": "0xB200000000000000000000eC3c4c7395Cc609813",
    "activityAr": "شرائح",
    "verdict": "ok",
    "noteAr": "",
    "debtPct": 3.48,
    "cashPct": 2.76,
    "intPct": 0.18,
    "asOf": "2026-08-01"
  },
  {
    "ticker": "PLTR",
    "nameAr": "بالانتير",
    "nameEn": "Palantir Technologies Inc.",
    "address": "0xb2000000000000000000007d16372840dF4dAbbe",
    "activityAr": "برمجيات",
    "verdict": "edge",
    "noteAr": "إيراد الفوايد 5.12%: على الحد",
    "debtPct": 0.05,
    "cashPct": 2.42,
    "intPct": 5.12,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "NFLX",
    "nameAr": "نتفليكس",
    "nameEn": "Netflix Inc",
    "address": "0xb20000000000000000000058B8c947e44011dFE6",
    "activityAr": "محتوى ترفيهي",
    "verdict": "edge",
    "noteAr": "مختلف عليه: طبيعة المحتوى",
    "debtPct": 5.73,
    "cashPct": 3.11,
    "intPct": 0.65,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "MSTR",
    "nameAr": "ستراتيجي",
    "nameEn": "Strategy Inc.",
    "address": "0xb2000000000000000000004884b426556b92883d",
    "activityAr": "برمجيات وخزينة بيتكوين",
    "verdict": "edge",
    "noteAr": "مختلف عليه: ديون قابلة للتحويل",
    "debtPct": 13.39,
    "cashPct": 11.78,
    "intPct": 0.1,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "CRCL",
    "nameAr": "سيركل",
    "nameEn": "Circle Internet Group Inc.",
    "address": "0xB20000000000000000000019f6E7C675b73C2e4D",
    "activityAr": "فوائد على احتياطيات USDC",
    "verdict": "no",
    "noteAr": "إيرادها الأساسي فوايد",
    "debtPct": 0,
    "cashPct": 9.71,
    "intPct": null,
    "asOf": "2026-09-30"
  },
  {
    "ticker": "SPCX",
    "nameAr": "سبيس إكس",
    "nameEn": "Space Exploration Technologies Corp.",
    "address": "0xb2000000000000000000007b9fcbd005511aCBd5",
    "activityAr": "فضاء",
    "verdict": "na",
    "noteAr": "شركة خاصة، مفيش بيانات SEC",
    "debtPct": null,
    "cashPct": null,
    "intPct": null,
    "asOf": null
  }
];

export const HALAL_BASKET = ["NVDA", "MSFT", "AAPL", "GOOGL"] as const;

export const HALAL_AS_OF = "2026-11-12";
