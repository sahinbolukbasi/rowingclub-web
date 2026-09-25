import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/siparis/$id")({
  head: () => ({ meta: [{ title: "Sipariş Takip — Kürek Kulübü" }] }),
  component: SiparisTakipPage,
});

const STATUS_STEPS = [
  { key: "pending", label: "Sipariş alındı", icon: "📋" },
  { key: "paid", label: "Ödeme onaylandı", icon: "✅" },
  { key: "preparing", label: "Ürün hazırlanıyor", icon: "⚙️" },
  { key: "shipped", label: "Kargoya verildi", icon: "📦" },
  { key: "delivered", label: "Teslim edildi", icon: "🏁" },
];

function SiparisTakipPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data || data.error || !data.id) {
          setOrder(null);
        } else {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch order error:", err);
        setOrder(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-paper/50 animate-pulse">Sipariş bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!order || !order.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-crim/15 border-2 border-crim/30">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="font-display text-3xl uppercase text-crim">Sipariş Bulunamadı</h1>
        <p className="text-sm text-paper/60 max-w-md">
          #{id} numaralı sipariş kaydı sistemimizde bulunamadı. Lütfen sipariş numaranızı kontrol edin veya kargo takip sayfasından e-posta adresinizle sorgulama yapın.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <Link to="/kargo-takip" className="rounded-full border border-paper/30 px-6 py-2.5 text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-paper hover:text-ink">
            Kargo Takip Sayfası
          </Link>
          <Link to="/" className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.18em] text-ink transition hover:bg-cyan font-bold">
            Ana Sayfa
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const effectiveIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;
  const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <section className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-cyan mb-1">— Sipariş Detayı</p>
        <h1 className="font-display text-3xl uppercase md:text-4xl">Sipariş Takip</h1>
        <p className="mt-2 font-mono text-sm text-crim font-bold">#{order.id}</p>
        {formattedDate && <p className="mt-1 text-xs text-paper/40">{formattedDate}</p>}
      </div>

      {/* Progress Steps */}
      <div className="relative mb-12 rounded-2xl border border-paper/15 bg-ink/60 p-6 sm:p-8">
        <div className="relative pl-8">
          <div className="absolute left-3.5 top-2 h-[calc(100%-1rem)] w-0.5 bg-paper/15" />

          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= effectiveIndex;
            const isCurrent = i === effectiveIndex;
            const historyEntry = statusHistory.find((h: any) => h.status === step.key);

            return (
              <div key={step.key} className={`relative mb-8 last:mb-0 ${!isCompleted ? "opacity-40" : ""}`}>
                <div className={`absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 ${
                  isCompleted ? "border-crim bg-crim text-ink font-bold" : "border-paper/30 bg-ink text-paper/40"
                } ${isCurrent ? "ring-2 ring-crim/40 ring-offset-2 ring-offset-ink" : ""}`}>
                  <span className="text-xs">{isCompleted ? "✓" : i + 1}</span>
                </div>

                <div className="ml-2">
                  <h3 className={`font-display text-base uppercase ${isCompleted ? "text-paper" : "text-paper/50"}`}>
                    {step.label}
                  </h3>
                  {historyEntry && historyEntry.date && (
                    <p className="mt-0.5 text-[11px] text-paper/40">
                      {new Date(historyEntry.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  {isCurrent && (
                    <p className="mt-1 text-xs text-crim animate-pulse font-semibold">● Güncel Durum: {step.label}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 mb-4">
        <h2 className="mb-4 font-display text-base uppercase text-paper/80 tracking-wider">Sipariş Özeti</h2>
        <div className="space-y-3">
          {(order.items ?? []).map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm border-b border-paper/10 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-display uppercase text-sm font-semibold">{item.name}</p>
                <p className="text-[11px] text-paper/50 mt-0.5">
                  {item.color ? `${item.color} · ` : ""}{item.size ? `Beden: ${item.size} · ` : ""}{item.qty} Adet
                </p>
              </div>
              <span className="font-display text-cyan font-bold">₺{(item.price || 0) * (item.qty || 1)}</span>
            </div>
          ))}
        </div>
        {order.couponCode && (
          <div className="mt-4 flex items-center justify-between text-xs text-emerald-400 font-semibold border-t border-paper/10 pt-3">
            <span>Uygulanan İndirim ({order.couponCode})</span>
            <span className="font-mono">-₺{order.discountAmount || 0}</span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-paper/15 pt-3">
          <span className="text-xs uppercase tracking-[0.18em] text-paper/60 font-semibold">Toplam Tutar</span>
          <span className="font-display text-2xl text-paper font-bold">₺{order.total}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-2">
        <h2 className="mb-3 font-display text-base uppercase text-paper/80 tracking-wider">Teslimat & İletişim Bilgileri</h2>
        <p className="text-xs text-paper/70"><span className="text-paper/40 uppercase tracking-wider font-semibold">Alıcı:</span> {order.customerName}</p>
        <p className="text-xs text-paper/70"><span className="text-paper/40 uppercase tracking-wider font-semibold">Adres:</span> {order.customerAddress}</p>
        {order.customerPhone && <p className="text-xs text-paper/70"><span className="text-paper/40 uppercase tracking-wider font-semibold">Telefon:</span> {order.customerPhone}</p>}
        {order.note && <p className="text-xs text-paper/70"><span className="text-paper/40 uppercase tracking-wider font-semibold">Not:</span> {order.note}</p>}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="rounded-full bg-crim px-8 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-ink transition hover:bg-cyan font-bold shadow-lg">
          Ana Sayfaya Dön
        </Link>
      </div>
    </section>
  );
}