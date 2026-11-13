"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "./LangProvider";

type Msg = { role: "user" | "assistant"; content: string };

export default function AskChat() {
  const { t, lang } = useT();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ask")
      .then((r) => r.json())
      .then((j) => setEnabled(!!j.enabled))
      .catch(() => setEnabled(false));
  }, []);
  useEffect(() => {
    // Block body on purpose: newer browsers return a Promise from scrollIntoView, which React must not receive.
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setMsgs([...next, { role: "assistant", content: j.answer }]);
    } catch (e) {
      setErr(e instanceof Error && e.message === "not_configured" ? t.ask.off : t.ask.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {enabled === false && <p className="note mt24">{t.ask.off}</p>}

      {msgs.length === 0 && (
        <div className="chips">
          {t.ask.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} disabled={!enabled}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "me" : "ai"}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="msg ai typing" aria-label={t.ask.thinking}>
            <span />
            <span />
            <span />
          </div>
        )}
        {err && <p className="err">{err}</p>}
        <div ref={end} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.ask.placeholder} aria-label={t.ask.placeholder} maxLength={500} />
        <button className="btn" type="submit" disabled={busy || !input.trim() || !enabled} style={{ height: 42 }}>
          {t.ask.send}
        </button>
      </form>
      <p className="tiny muted mt16">{t.ask.note}</p>
    </>
  );
}
