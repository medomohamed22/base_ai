"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ConnectButton from "./ConnectButton";
import { useT } from "./LangProvider";

export default function Header() {
  const { t, lang, setLang, pending } = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const nav = [
    { href: "/stocks", label: t.nav.stocks },
    { href: "/plan", label: t.nav.plan },
    { href: "/portfolio", label: t.nav.portfolio },
    { href: "/ask", label: t.nav.ask },
  ];

  return (
    <header className={`hdr ${scrolled ? "hdr-s" : ""} ${open ? "hdr-open" : ""}`}>
      <div className="wrap hdr-in">
        <Link href="/" className="logo" aria-label={t.brand}>
          <span className="logo-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17 L10 11 L14 14 L20 7" />
              <path d="M15 7 H20 V12" />
            </svg>
          </span>
          <span>{t.brand}</span>
        </Link>

        <nav className="hdr-nav" aria-label="main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={path === n.href ? "on" : ""}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hdr-act">
          <button
            type="button"
            className="lang"
            aria-label={lang === "ar" ? "Switch to English" : "التحويل للعربية"}
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            disabled={pending}
          >
            <span className={lang === "en" ? "on" : ""}>EN</span>
            <span className={lang === "ar" ? "on" : ""}>AR</span>
          </button>
          <ConnectButton />
          <button type="button" className="burger" aria-label={open ? t.nav.close : t.nav.menu} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className="sheet" aria-hidden={!open}>
        <nav className="wrap">
          {[...nav, { href: "/start", label: t.nav.start }, { href: "/stats", label: t.nav.stats }].map((n, i) => (
            <Link key={n.href} href={n.href} style={{ transitionDelay: `${open ? 40 + i * 35 : 0}ms` }} tabIndex={open ? 0 : -1}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
