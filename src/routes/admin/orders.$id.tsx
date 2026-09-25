import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const API_BASE = "/api/admin";
const ALL_STATUSES = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Sipariş Alındı",
  paid: "Ödeme Onaylandı",
  preparing: "Ürün Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  preparing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-cyan/20 text-cyan border-cyan/30",
  delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-crim/20 text-crim border-crim/30",
};

function getToken() {
  try {
    return localStorage.getItem("admin-token") ?? "";
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({
    meta: [
      { title: "Sipariş Detay — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cargoCode, setCargoCode] = useState("");
  const [cargoCarrier, setCargoCarrier] = useState("Yurtiçi Kargo");
  const [savingCargo, setSavingCargo] = useState(false);
  const [cargoMsg, setCargoMsg] = useState("");

  const loadOrder = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/orders?t=${token}`);
      const orders = await res.json();
      const found = Array.isArray(orders) ? orders.find((x: any) => String(x.id) === String(id)) : null;
      if (found) {
        setOrder(found);
        setCargoCode(found.cargoTrackingCode || "");
        setCargoCarrier(found.cargoCarrier || "Yurtiçi Kargo");
      }
    } catch (e) {
      console.error("Order load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleStatus = async (status: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadOrder();
    } catch (e: any) {
      alert("Durum güncellenemedi: " + e.message);
    }
  };

  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCargo(true);
    setCargoMsg("");
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cargoTrackingCode: cargoCode.trim(),
          cargoCarrier: cargoCarrier.trim(),
          status: order?.status === "pending" || order?.status === "preparing" ? "shipped" : undefined,
        }),
      });
      setCargoMsg("✓ Kargo takip bilgisi kaydedildi!");
      await loadOrder();
      setTimeout(() => setCargoMsg(""), 3000);
    } catch (e: any) {
      alert("Kargo bilgisi kaydedilemedi: " + e.message);
    } finally {
      setSavingCargo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-paper">
        <p className="text-paper/50 animate-pulse">Sipariş detayları yükleniyor...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink text-paper p-6 text-center">
        <h1 className="font-display text-2xl uppercase text-crim">Sipariş Bulunamadı</h1>
        <p className="mt-2 text-sm text-paper/60">#{id} numaralı sipariş veritabanında bulunamadı.</p>
        <button
          onClick={() => router.navigate({ to: "/admin/dashboard" })}
          className="mt-6 rounded-full bg-crim px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-cyan transition"
        >
          ← Panele Dön
        </button>
      </div>
    );
  }

  const statusHistory: { status: string; date: string }[] = order.statusHistory ?? [];

  return (
    <div className="min-h-screen bg-ink text-paper pb-16">
      <header className="flex items-center justify-between border-b border-paper/15 px-6 py-4 lg:px-10 sticky top-0 bg-ink/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <span className="size-2.5 rounded-full bg-crim" />
          <h1 className="font-display text-lg tracking-wide uppercase">
            Sipariş Detayı <span className="text-cyan font-mono">#{order.id}</span>
          </h1>
        </div>
        <button
          onClick={() => router.navigate({ to: "/admin/dashboard" })}
          className="rounded-full border border-paper/20 px-4 py-1.5 text-xs uppercase tracking-wider text-paper/70 transition hover:border-paper hover:text-paper"
        >
          ← Panele Dön
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10 space-y-6">
        {/* Order Header Summary */}
        <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl uppercase tracking-wider text-paper">
                Sipariş #{order.id}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-paper/10 text-paper"}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <p className="text-xs text-paper/50 mt-1">
              Oluşturulma Tarihi: {new Date(order.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-paper/50 uppercase tracking-wider block">Toplam Tutar</span>
            <span className="font-display text-3xl text-cyan">₺{order.total}</span>
            {order.couponCode && (
              <span className="mt-1.5 inline-block text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                🏷️ İndirim Kodu: <strong>{order.couponCode}</strong> (-₺{order.discountAmount || 0})
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Müşteri ve Teslimat Bilgileri */}
          <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 border-b border-paper/10 pb-3">
              <span className="size-2 rounded-full bg-cyan" />
              <h2 className="font-display text-base uppercase text-paper tracking-wide">Müşteri ve Teslimat Bilgileri</h2>
            </div>
            <div className="space-y-2 text-sm pt-1">
              <p><span className="text-paper/50 w-24 inline-block font-semibold">Ad Soyad:</span> <span className="font-bold text-paper">{order.customerName}</span></p>
              <p><span className="text-paper/50 w-24 inline-block font-semibold">E-posta:</span> <a href={`mailto:${order.customerEmail}`} className="text-cyan hover:underline">{order.customerEmail}</a></p>
              <p><span className="text-paper/50 w-24 inline-block font-semibold">Telefon:</span> <a href={`tel:${order.customerPhone}`} className="text-cyan hover:underline">{order.customerPhone}</a></p>
              <div className="pt-2 border-t border-paper/10">
                <span className="text-paper/50 block font-semibold mb-1">Teslimat Adresi:</span>
                <p className="text-paper/90 bg-paper/5 p-3 rounded-xl border border-paper/10 leading-relaxed text-xs font-sans">
                  {order.customerAddress}
                </p>
              </div>
              {order.note && (
                <div className="pt-1">
                  <span className="text-paper/50 block font-semibold mb-1">Sipariş Notu:</span>
                  <p className="text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-xs italic">
                    "{order.note}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kargo Takip Bilgileri Girişi */}
          <div className="rounded-2xl border border-cyan/30 bg-ink/60 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-paper/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" />
                <h2 className="font-display text-base uppercase text-paper tracking-wide">Kargo Takip Yönetimi</h2>
              </div>
              <span className="text-[10px] text-cyan font-mono uppercase bg-cyan/10 px-2 py-0.5 rounded border border-cyan/30">Müşteri Görebilir</span>
            </div>

            <form onSubmit={handleSaveCargo} className="space-y-4 pt-1">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                  Kargo Firması
                </label>
                <select
                  value={cargoCarrier}
                  onChange={(e) => setCargoCarrier(e.target.value)}
                  className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-cyan"
                >
                  <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                  <option value="MNG Kargo">MNG Kargo</option>
                  <option value="Aras Kargo">Aras Kargo</option>
                  <option value="Sürat Kargo">Sürat Kargo</option>
                  <option value="PTT Kargo">PTT Kargo</option>
                  <option value="Trendyol Express">Trendyol Express</option>
                  <option value="HepsiJET">HepsiJET</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                  Kargo Takip / Takip Kodu
                </label>
                <input
                  type="text"
                  value={cargoCode}
                  onChange={(e) => setCargoCode(e.target.value)}
                  placeholder="Örn: 10849203819"
                  className="w-full rounded-xl border border-paper/20 bg-transparent px-3 py-2.5 text-sm font-mono text-paper outline-none focus:border-cyan"
                />
              </div>

              {cargoMsg && (
                <div className="text-xs text-emerald-400 font-bold animate-pulse">
                  {cargoMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={savingCargo}
                className="w-full rounded-full bg-cyan py-3 font-display text-xs uppercase tracking-wider text-ink font-bold transition hover:bg-paper disabled:opacity-50 shadow-md"
              >
                {savingCargo ? "Kaydediliyor..." : "Kargo Takip Kodunu Kaydet"}
              </button>
            </form>
          </div>
        </div>

        {/* Sipariş Edilen Ürünler */}
        <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 shadow-lg">
          <div className="flex items-center gap-2 border-b border-paper/10 pb-3 mb-4">
            <span className="size-2 rounded-full bg-emerald-400" />
            <h2 className="font-display text-base uppercase text-paper tracking-wide">Sipariş Edilen Ürünler ({order.items?.length || 0})</h2>
          </div>

          <div className="divide-y divide-paper/10">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={idx} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-16 rounded-xl object-cover border border-paper/20 flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-display text-base uppercase text-paper">{item.name}</h3>
                  <p className="text-xs text-paper/60 mt-0.5">
                    Beden: <span className="text-paper font-semibold">{item.size}</span> &nbsp;·&nbsp; Renk: <span className="text-paper font-semibold">{item.color}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-paper/50 block">{item.qty} Adet x ₺{item.price}</span>
                  <span className="font-display text-lg text-cyan font-bold">₺{item.price * item.qty}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-paper/15 pt-4 flex justify-between items-center text-sm">
            <span className="text-paper/60 uppercase text-xs tracking-wider">Genel Toplam</span>
            <span className="font-display text-2xl text-paper">₺{order.total}</span>
          </div>
        </div>

        {/* Sipariş Durum Güncelleme Butonları */}
        <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-4 shadow-lg">
          <h2 className="font-display text-base uppercase text-paper tracking-wide border-b border-paper/10 pb-3">
            Sipariş Durumunu Değiştir
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleStatus("paid")}
              className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${order.status === "paid" ? "bg-green-500 text-ink ring-2 ring-green-400" : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-ink"}`}
            >
              ✓ Ödendi
            </button>
            <button
              onClick={() => handleStatus("preparing")}
              className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${order.status === "preparing" ? "bg-blue-500 text-ink ring-2 ring-blue-400" : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-ink"}`}
            >
              ⚙️ Hazırlanıyor
            </button>
            <button
              onClick={() => handleStatus("shipped")}
              className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${order.status === "shipped" ? "bg-cyan text-ink ring-2 ring-cyan" : "bg-cyan/20 text-cyan border border-cyan/30 hover:bg-cyan hover:text-ink"}`}
            >
              📦 Kargoya Verildi
            </button>
            <button
              onClick={() => handleStatus("delivered")}
              className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${order.status === "delivered" ? "bg-emerald-500 text-ink ring-2 ring-emerald-400" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-ink"}`}
            >
              🏁 Teslim Edildi
            </button>
            <button
              onClick={() => handleStatus("cancelled")}
              className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition ${order.status === "cancelled" ? "bg-crim text-paper ring-2 ring-crim" : "bg-crim/20 text-crim border border-crim/30 hover:bg-crim hover:text-paper"}`}
            >
              ✕ İptal Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
