import "server-only";
import { cookies, headers } from "next/headers";
import { DICTS, isLang, type Lang } from "./i18n";

/** Cookie first; otherwise Arabic unless the browser clearly prefers English. */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  if (isLang(c)) return c;
  const al = (await headers()).get("accept-language") || "";
  return /^en\b/i.test(al) && !/\bar\b/i.test(al) ? "en" : "ar";
}

export async function getDict() {
  const lang = await getLang();
  return { lang, t: DICTS[lang] };
}
