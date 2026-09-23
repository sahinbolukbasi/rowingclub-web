import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Sipariş — Kürek Kulübü" }, { name: "description", content: "Siparişinizi tamamlayın." }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-2xl uppercase">Sepetin boş</p>
        <p className="text-sm text-paper/60">Sipariş oluşturmak için sepete ürün ekleyin.</p>
        <button onClick={() => router.navigate({ to: "/shop" })} className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan">Mağazaya git</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, name: i.name, price: i.price, size: i.size, color: i.color, qty: i.qty, image: i.image })),
          total, customerName: form.name, customerEmail: form.email, customerPhone: form.phone, customerAddress: form.address, note: form.note,
        }),
      });
      const order = await res.json();
      clearCart();
      router.navigate({ to: "/payment/checkout", params: {}, search: { orderId: order.id, total: String(total) } as any });
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    } finally { setSubmitting(false); }
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
      <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">— Sipariş</p>
      <h1 className="mb-8 font-display text-3xl uppercase md:text-5xl">Siparişini tamamla</h1>
      <div className="grid gap-10 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Ad Soyad *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required /></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">E-posta *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required /></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Telefon *</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required /></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Teslimat Adresi *</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required /></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Sipariş Notu</label><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" /></div>
          {error && <p className="text-sm text-crim">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-crim py-3.5 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50">{submitting ? "İşleniyor..." : `Ödemeye geç · ₺${total}`}</button>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-paper/40">iyzico güvenli ödeme altyapısı ile</p>
        </form>
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-paper/15 p-5">
            <h2 className="mb-4 font-display text-base uppercase">Sipariş Özeti</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.slug}-${item.size}-${item.color}`} className="flex justify-between text-sm">
                  <div><p className="font-display uppercase text-xs">{item.name}</p><p className="text-[10px] text-paper/50">{item.color} · {item.size} · {item.qty} adet</p></div>
                  <span className="text-cyan">₺{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-paper/15 pt-4">
              <span className="text-xs uppercase tracking-[0.18em] text-paper/60">Toplam</span>
              <span className="font-display text-xl text-paper">₺{total}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
