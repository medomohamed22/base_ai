import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "سهم | Sahm",
  description: "استثمر في أسهم أمريكية حلال، بالعربي، من دولار واحد. فلوسك في محفظتك. Arabic-first agent for tokenized US stocks on Base.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F6F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1513" },
  ],
};

const NAV = [
  { href: "/stocks", label: "الأسهم" },
  { href: "/plan", label: "خطتي" },
  { href: "/portfolio", label: "محفظتي" },
  { href: "/start", label: "إزاي أبدأ" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={plex.className}>
        <header className="top">
          <div className="wrap top-in">
            <Link href="/" className="brand">
              سهم <span className="brand-en">Sahm</span>
            </Link>
            <nav className="nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="foot wrap">
          <p>
            مش نصيحة مالية. الأسهم المرمّزة متاحة بس خارج أمريكا للمؤهلين. فحص الحلال استرشادي، مش فتوى.
          </p>
          <p dir="ltr">
            Not financial advice. Tokenized stocks are available only to eligible users outside the US. Halal screen
            is indicative, not a fatwa. · <Link href="/stats">/stats</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
