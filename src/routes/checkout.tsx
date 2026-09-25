import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { TURKEY_CITIES } from "@/lib/turkey-locations";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Sipariş — Kürek Kulübü" },
      { name: "description", content: "Siparişinizi tamamlayın." },
    ],
  }),
  component: CheckoutPage,
});

const cities = Object.keys(TURKEY_CITIES);

function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "Türkiye",
    city: "İstanbul",
    district: "Kadıköy",
    addressDetail: "",
    note: "",
  });

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-2xl uppercase">Sepetin boş</p>
        <p className="text-sm text-paper/60">
          Sipariş oluşturmak için sepete ürün ekleyin.
        </p>
        <button
          onClick={() => router.navigate({ to: "/shop" })}
          className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan"
        >
          Mağazaya git
        </button>
      </div>
    );
  }

  const handleCityChange = (newCity: string) => {
    const dists = TURKEY_CITIES[newCity] || [];
    setForm((prev) => ({
      ...prev,
      city: newCity,
      district: dists[0] || "",
    }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          items,
          total,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(data.message || "Geçersiz indirim kodu.");
      }
    } catch {
      setCouponError("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput("");
    setCouponError("");
  };

  const finalTotal = Math.max(0, total - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const fullAddress = `${form.addressDetail.trim()}, ${form.district} / ${form.city}, ${form.country}`;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            slug: i.slug,
            name: i.name,
            price: i.price,
            size: i.size,
            color: i.color,
            qty: i.qty,
            image: i.image,
          })),
          total: finalTotal,
          originalTotal: total,
          couponCode: appliedCoupon?.code || "",
          discountAmount: discountAmount,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          customerAddress: fullAddress,
          note: form.note,
        }),
      });
      const order = await res.json();
      clearCart();
      router.navigate({
        to: "/payment/checkout",
        params: {},
        search: { orderId: order.id, total: String(finalTotal) } as any,
      });
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const availableDistricts = TURKEY_CITIES[form.city] || [];

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
      <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">
        — Sipariş
      </p>
      <h1 className="mb-8 font-display text-3xl uppercase md:text-5xl">
        Siparişini tamamla
      </h1>

      <div className="grid gap-10 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Ad Soyad *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
                E-posta *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
                Telefon *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
                required
              />
            </div>
          </div>

          {/* Ülke Seçimi (Türkiye Seçili) */}
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Ülke *
            </label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
              required
            >
              <option value="Türkiye">Türkiye</option>
            </select>
          </div>

          {/* İl ve İlçe Seçimi */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
                İl *
              </label>
              <select
                value={form.city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
                required
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
                İlçe *
              </label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
                required
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Açık Adres */}
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Açık Adres (Mahalle, Cadde, Sokak, No, Daire) *
            </label>
            <textarea
              value={form.addressDetail}
              onChange={(e) =>
                setForm({ ...form, addressDetail: e.target.value })
              }
              rows={3}
              placeholder="Örn: Moda Cad. Güneş Apt. No: 12 D: 4"
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition placeholder:text-paper/30 focus:border-cyan"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Sipariş Notu (Opsiyonel)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Kargo görevlisi için not vb."
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition placeholder:text-paper/30 focus:border-cyan"
            />
          </div>

          {error && <p className="text-sm text-crim">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-crim py-3.5 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50"
          >
            {submitting ? "İşleniyor..." : `Ödemeye geç · ₺${finalTotal}`}
          </button>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-paper/40">
            iyzico güvenli ödeme altyapısı ile
          </p>
        </form>

        {/* Sipariş Özeti */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-paper/15 p-5">
            <h2 className="mb-4 font-display text-base uppercase">
              Sipariş Özeti
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.slug}-${item.size}-${item.color}`}
                  className="flex items-center gap-3 text-sm"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const sibling = target.nextElementSibling as HTMLElement;
                        if (sibling) sibling.style.display = "flex";
                      }}
                      className="h-12 w-10 flex-shrink-0 rounded object-cover bg-teal/20"
                    />
                  ) : null}
                  <div
                    className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded bg-teal/20 text-[10px] font-bold uppercase text-paper/40"
                    style={{ display: item.image ? "none" : "flex" }}
                  >
                    {item.name ? item.name.slice(0, 2) : "KK"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xs uppercase">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-paper/50">
                      {item.color} · {item.size} · {item.qty} adet
                    </p>
                  </div>
                  <span className="text-cyan font-mono">
                    ₺{item.price * item.qty}
                  </span>
                </div>
              ))}
            </div>

            {/* İndirim Kodu Uygulama */}
            <div className="mt-4 border-t border-paper/15 pt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-paper/50 font-semibold">
                  İndirim Kodu / Kampanya Kodu
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                      <span>✓</span>
                      <span className="font-bold">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-paper/60">(-₺{discountAmount})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] uppercase tracking-wider text-paper/40 hover:text-crim"
                    >
                      Kaldır ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="Örn: KUREK10"
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-1.5 text-xs text-paper uppercase outline-none focus:border-cyan placeholder:normal-case placeholder:text-paper/25"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCodeInput.trim()}
                      className="rounded-lg bg-cyan/20 px-3 py-1.5 font-display text-xs uppercase text-cyan transition hover:bg-cyan hover:text-ink disabled:opacity-40"
                    >
                      {validatingCoupon ? "..." : "Uygula"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1 text-[11px] text-crim">{couponError}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-paper/60 pt-1">
                <span>Ara Toplam</span>
                <span className="font-mono">₺{total}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>İndirim ({appliedCoupon?.code})</span>
                  <span className="font-mono">-₺{discountAmount}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-paper/15 pt-3">
                <span className="text-xs uppercase tracking-[0.18em] text-paper/60">
                  Ödenecek Tutar
                </span>
                <span className="font-display text-xl text-paper">
                  ₺{finalTotal}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
