"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useTransition } from "react";
import { DICTS, dirOf, type Dict, type Lang } from "@/lib/i18n";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; pending: boolean };
const LangCtx = createContext<Ctx>({ lang: "ar", t: DICTS.ar, setLang: () => {}, pending: false });

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const setLang = useCallback(
    (l: Lang) => {
      document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = l;
      document.documentElement.dir = dirOf(l);
      start(() => router.refresh());
    },
    [router],
  );
  return <LangCtx.Provider value={{ lang, t: DICTS[lang], setLang, pending }}>{children}</LangCtx.Provider>;
}

export const useT = () => useContext(LangCtx);
