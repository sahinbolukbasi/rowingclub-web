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
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-paper/50">Yükleniyor...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl uppercase text-crim">Sipariş bulunamadı</h1>
        <p className="text-sm text-paper/60">Bu sipariş numarası ile kayıt bulunamadı.</p>
        <Link to="/" className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan">Ana sayfa</Link>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const statusHistory = order.statusHistory ?? [];

  return (
    <section className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl uppercase md:text-4xl">Sipariş Takip</h1>
        <p className="mt-2 font-mono text-sm text-crim">#{order.id}</p>
        <p className="mt-1 text-xs text-paper/40">
          {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Progress Steps — uses provided design */}
      <div className="relative mb-12">
        {/* Vertical timeline */}
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-2 h-[calc(100%-1rem)] w-0.5 bg-paper/15" />

          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;
            const historyEntry = statusHistory.find((h: any) => h.status === step.key);

            return (
              <div key={step.key} className={`relative mb-8 last:mb-0 ${!isCompleted ? "opacity-40" : ""}`}>
                {/* Dot */}
                <div className={`absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 ${
                  isCompleted ? "border-crim bg-crim/10" : "border-paper/30 bg-ink"
                } ${isCurrent ? "ring-2 ring-crim/30 ring-offset-2 ring-offset-ink" : ""}`}>
                  <span className="text-xs">{isCompleted ? "✓" : i + 1}</span>
                </div>

                {/* Content */}
                <div className="ml-2">
                  <h3 className={`font-display text-base uppercase ${isCompleted ? "text-paper" : "text-paper/50"}`}>
                    {step.label}
                  </h3>
                  {historyEntry && (
                    <p className="mt-0.5 text-[11px] text-paper/40">
                      {new Date(historyEntry.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  {isCurrent && (
                    <p className="mt-1 text-xs text-crim animate-pulse">● İşlemde</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-lg border border-paper/15 p-5">
        <h2 className="mb-4 font-display text-base uppercase">Sipariş Özeti</h2>
        <div className="space-y-3">
          {(order.items ?? []).map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <p className="font-display uppercase text-xs">{item.name}</p>
                <p className="text-[10px] text-paper/50">{item.color} · {item.size} · {item.qty} adet</p>
              </div>
              <span className="text-cyan">₺{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        {order.couponCode && (
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-400 font-semibold border-t border-paper/10 pt-3">
            <span>Uygulanan İndirim ({order.couponCode})</span>
            <span className="font-mono">-₺{order.discountAmount || 0}</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-paper/15 pt-3">
          <span className="text-xs uppercase tracking-[0.18em] text-paper/60">Toplam Ödenen</span>
          <span className="font-display text-xl text-paper">₺{order.total}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-4 rounded-lg border border-paper/15 p-5">
        <h2 className="mb-3 font-display text-base uppercase">Teslimat Bilgileri</h2>
        <p className="text-sm"><span className="text-paper/50">Ad:</span> {order.customerName}</p>
        <p className="text-sm"><span className="text-paper/50">Adres:</span> {order.customerAddress}</p>
        {order.note && <p className="mt-2 text-sm"><span className="text-paper/50">Not:</span> {order.note}</p>}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan">Ana sayfaya dön</Link>
      </div>
    </section>
  );
}