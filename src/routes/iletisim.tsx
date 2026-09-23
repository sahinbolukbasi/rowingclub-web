import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/iletisim")({
  head: () => ({ meta: [{ title: "İletişim — Kürek Kulübü" }, { name: "description", content: "Kürek Kulübü ile iletişim. Sipariş, bilgi, kulüp üyeliği." }, { property: "og:title", content: "İletişim — Kürek Kulübü" }, { property: "og:description", content: "Kürek Kulübü ile iletişim. Sipariş, bilgi, kulüp üyeliği." }] }),
  component: IletisimPage,
});

function IletisimPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Sipariş");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSent(true);
    } catch { setSent(true); }
    setSending(false);
  };

  return (
    <section className="px-6 py-12 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">— İletişim</p>
          <h1 className="font-display text-4xl uppercase leading-[0.95] md:text-7xl">Bize ulaş.</h1>
          <p className="mt-6 max-w-md leading-relaxed text-paper/70">Sipariş, beden rehberi, kulüp üyeliği veya toplu sipariş — ne isterseniz yazın. Cevap aynı gün içinde, en geç ertesi sabah küreğinden önce.</p>
          <div className="mt-10 space-y-5">
            {[{ l: "E-posta", v: "merhaba@kurekkulubu.com" }, { l: "Telefon", v: "+90 212 000 00 00" }, { l: "Atölye", v: "Boğaz İskelesi 4, İstanbul" }, { l: "Saatler", v: "Pzt–Cmt · 09:00–18:00" }].map((row) => (
              <div key={row.l} className="border-b border-paper/10 pb-4"><p className="text-[11px] uppercase tracking-[0.22em] text-paper/50">{row.l}</p><p className="mt-1 text-lg text-paper">{row.v}</p></div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-paper/15 bg-ink/50 p-6 lg:p-8">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="font-display text-5xl text-crim">✓</span>
              <h2 className="font-display text-2xl uppercase">Mesaj alındı</h2>
              <p className="text-sm text-paper/60">En kısa sürede dönüş yapacağız.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="font-display text-2xl uppercase">Mesaj gönder</h2>
              <div><label className="mb-1.5 block text-[11px] uppercase tracking-[0.22em] text-paper/50">Ad</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan" placeholder="Adınız" /></div>
              <div><label className="mb-1.5 block text-[11px] uppercase tracking-[0.22em] text-paper/50">E-posta</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan" placeholder="ornek@email.com" /></div>
              <div><label className="mb-1.5 block text-[11px] uppercase tracking-[0.22em] text-paper/50">Konu</label><select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"><option>Sipariş</option><option>Beden & kargo</option><option>Kulüp üyeliği</option><option>Toplu sipariş</option><option>Diğer</option></select></div>
              <div><label className="mb-1.5 block text-[11px] uppercase tracking-[0.22em] text-paper/50">Mesaj</label><textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan" placeholder="Mesajınız" /></div>
              <button type="submit" disabled={sending} className="w-full rounded-full bg-crim py-3.5 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50">{sending ? "Gönderiliyor..." : "Gönder"}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
