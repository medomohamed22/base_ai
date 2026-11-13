import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import Link from "next/link";
import Header from "@/components/Header";
import { LangProvider } from "@/components/LangProvider";
import { CHAIN } from "@/lib/chain";
import { dirOf } from "@/lib/i18n";
import { getDict } from "@/lib/lang.server";
import Providers from "./providers";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--f-ar",
});
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--f-en" });

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getDict();
  return lang === "ar"
    ? {
        title: { default: "سهم | استثمر في أسهم أمريكية حلال", template: "%s | سهم" },
        description: "استثمر في أسهم أمريكية حلال، بالعربي، من دولار واحد. فلوسك في محفظتك.",
      }
    : {
        title: { default: "Sahm | Halal US stocks from $1", template: "%s | Sahm" },
        description: "Invest in halal US stocks from one dollar, in Arabic or English. Your money stays in your wallet.",
      };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${plex.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <LangProvider lang={lang}>
            {CHAIN.testnet && <div className="banner">{t.testnet}</div>}
            <Header />
            <main>{children}</main>
            <footer className="foot">
              <div className="wrap">
                <nav>
                  <Link href="/stocks">{t.nav.stocks}</Link>
                  <Link href="/plan">{t.nav.plan}</Link>
                  <Link href="/portfolio">{t.nav.portfolio}</Link>
                  <Link href="/ask">{t.nav.ask}</Link>
                  <Link href="/start">{t.nav.start}</Link>
                  <Link href="/stats">{t.nav.stats}</Link>
                </nav>
                <p>{t.footer.l1}</p>
                <p>{t.footer.l2}</p>
                <p className="ltr">© 2026 Sahm · Built on Base</p>
              </div>
            </footer>
          </LangProvider>
        </Providers>
      </body>
    </html>
  );
}
