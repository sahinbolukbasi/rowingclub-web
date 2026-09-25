import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/kargo-takip")({
  head: () => ({
    meta: [
      { title: "Kargo & Sipariş Takip — Kürek Kulübü" },
      {
        name: "description",
        content: "Kürek Kulübü siparişinizi ve kargonuzu 6 haneli sipariş numaranız veya e-posta adresiniz ile anında sorgulayın.",
      },
    ],
  }),
  component: KargoTakipPage,
});

const STATUS_STEPS = [
  { key: "pending", label: "Sipariş Alındı", icon: "📋" },
  { key: "paid", label: "Ödeme Onaylandı", icon: "✅" },
  { key: "preparing", label: "Hazırlanıyor", icon: "⚙️" },
  { key: "shipped", label: "Kargoya Verildi", icon: "📦" },
  { key: "delivered", label: "Teslim Edildi", icon: "🏁" },
];

function KargoTakipPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setErrorMsg("");
    setSearched(true);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        setOrder(null);
        setErrorMsg("Girdiğiniz sipariş numarası veya e-posta adresiyle eşleşen aktif sipariş bulunamadı.");
      } else {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error(err);
      setOrder(null);
      setErrorMsg("Sorgulama sırasında bir hata oluştu.");
    } finally {
      setSearching(false);
    }
  };

  const currentStatusIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const statusHistory = order?.statusHistory ?? [];

  return (
    <div className="min-h-[80vh] px-6 py-12 lg:px-10 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-cyan">— Kargo Takip</p>
        <h1 className="font-display text-4xl uppercase md:text-5xl">Sipariş & Kargo Sorgula</h1>
        <p className="mt-3 text-sm text-paper/70 max-w-md mx-auto">
          Sipariş numaranızı (Örn: 948201) veya siparişte kullandığınız e-posta adresinizi girerek kargo durumunuzu anında takip edebilirsiniz.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sipariş No veya E-posta adresi..."
            className="flex-1 rounded-full border border-paper/20 bg-ink/80 px-6 py-3.5 text-sm text-paper outline-none transition focus:border-cyan"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-full bg-crim px-8 py-3.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-ink transition hover:bg-cyan disabled:opacity-50 shadow-lg"
          >
            {searching ? "Aranıyor..." : "Sorgula"}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {searched && (
        <>
          {errorMsg ? (
            <div className="max-w-md mx-auto text-center rounded-2xl border border-crim/30 bg-crim/10 p-8 shadow-xl">
              <span className="text-4xl block mb-3">🔍</span>
              <h2 className="font-display text-xl uppercase text-crim mb-2">Sipariş Bulunamadı</h2>
              <p className="text-xs text-paper/70 leading-relaxed">{errorMsg}</p>
            </div>
          ) : order ? (
            <div className="space-y-8 animate-fadeIn">
              {/* Order Status Header */}
              <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl uppercase tracking-wider text-paper">
                      Sipariş #{order.id}
                    </span>
                    <span className="rounded-full bg-cyan/20 border border-cyan/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan">
                      {STATUS_STEPS.find((s) => s.key === order.status)?.label || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-paper/50 mt-1">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {order.cargoTrackingCode && (
                  <div className="bg-cyan/10 border border-cyan/30 p-4 rounded-xl text-right">
                    <span className="text-[10px] text-cyan font-bold uppercase tracking-widest block">Kargo Takip Bilgisi</span>
                    <p className="text-xs text-paper font-semibold mt-0.5">{order.cargoCarrier || "Kargo Kodu"}:</p>
                    <p className="font-mono text-base font-bold text-cyan">{order.cargoTrackingCode}</p>
                  </div>
                )}
              </div>

              {/* Progress Timeline */}
              <div className="rounded-2xl border border-paper/15 bg-ink/40 p-8 shadow-xl">
                <h2 className="font-display text-lg uppercase text-paper tracking-wide border-b border-paper/10 pb-4 mb-6">
                  Sipariş İlerleme Durumu
                </h2>
                <div className="relative pl-8">
                  <div className="absolute left-3.5 top-2 h-[calc(100%-1rem)] w-0.5 bg-paper/15" />
                  {STATUS_STEPS.map((step, i) => {
                    const isCompleted = i <= currentStatusIndex;
                    const isCurrent = i === currentStatusIndex;
                    const historyEntry = statusHistory.find((h: any) => h.status === step.key);

                    return (
                      <div key={step.key} className={`relative mb-8 last:mb-0 ${!isCompleted ? "opacity-40" : ""}`}>
                        <div className={`absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 ${
                          isCompleted ? "border-crim bg-crim/20 text-crim font-bold" : "border-paper/30 bg-ink text-paper/40"
                        } ${isCurrent ? "ring-4 ring-crim/30 ring-offset-2 ring-offset-ink" : ""}`}>
                          <span className="text-xs">{isCompleted ? "✓" : i + 1}</span>
                        </div>
                        <div className="ml-3">
                          <h3 className={`font-display text-base uppercase ${isCompleted ? "text-paper" : "text-paper/50"}`}>
                            {step.label}
                          </h3>
                          {historyEntry && (
                            <p className="mt-0.5 text-xs text-paper/40">
                              {new Date(historyEntry.date).toLocaleString("tr-TR", {
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                          {isCurrent && (
                            <p className="mt-1 text-xs text-cyan font-bold animate-pulse">● Güncel Durum</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items & Customer Summary */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 shadow-xl space-y-3">
                  <h3 className="font-display text-base uppercase text-paper border-b border-paper/10 pb-3">Sipariş Edilen Ürünler</h3>
                  <div className="space-y-3">
                    {(order.items ?? []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-paper/10 pb-2 last:border-0">
                        <div>
                          <p className="font-display uppercase text-sm text-paper">{item.name}</p>
                          <p className="text-paper/50">{item.color} · {item.size} · {item.qty} Adet</p>
                        </div>
                        <span className="text-cyan font-bold text-sm">₺{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-paper/15 flex justify-between font-display text-base uppercase">
                    <span>Toplam</span>
                    <span className="text-cyan font-bold">₺{order.total}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 shadow-xl space-y-2 text-xs">
                  <h3 className="font-display text-base uppercase text-paper border-b border-paper/10 pb-3 mb-3">Teslimat Adresi</h3>
                  <p><span className="text-paper/50">Alıcı:</span> <span className="font-bold text-paper">{order.customerName}</span></p>
                  <p><span className="text-paper/50">E-posta:</span> <span className="text-paper">{order.customerEmail}</span></p>
                  <p><span className="text-paper/50">Adres:</span></p>
                  <p className="bg-paper/5 p-3 rounded-xl border border-paper/10 text-paper/80 leading-relaxed font-sans">{order.customerAddress}</p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-12 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-paper/60 hover:text-paper transition">
          ← Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
