import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/checkout")({
  head: () => ({ meta: [{ title: "Ödeme — Kürek Kulübü" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PaymentCheckoutPage,
});

function PaymentCheckoutPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const orderId = searchParams.get("orderId") ?? "";
  const total = searchParams.get("total") ?? "0";
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "paid", paymentId: `pay_${Date.now()}` }),
    });
    setDone(true);
    setProcessing(false);
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center" style={{background: 'linear-gradient(to bottom, #0a0a0a, #1a1a2e)'}}>
        {/* Success animation */}
        <div className="relative mb-8">
          <div className="flex size-24 items-center justify-center rounded-full bg-crim/10 border-2 border-crim">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e23a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h1 className="font-display text-4xl uppercase tracking-wide text-paper">Siparişin alındı!</h1>
        <p className="mt-4 max-w-md text-lg text-paper/60 leading-relaxed">
          Teşekkürler! Siparişin başarıyla oluşturuldu. Sipariş numaran ile takip edebilirsin.
        </p>

        {/* Order number box */}
        <div className="mt-8 rounded-2xl border border-paper/15 bg-paper/5 px-10 py-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-paper/50 mb-2">Sipariş Numarası</p>
          <p className="font-mono text-2xl tracking-wider text-crim font-bold">{orderId}</p>
        </div>

        <p className="mt-6 text-sm text-paper/40">
          Sipariş detayları e-posta adresine gönderildi.
        </p>

        <div className="mt-10 flex gap-4">
          <button onClick={() => router.navigate({ to: `/siparis/${orderId}` })} className="rounded-full bg-crim px-8 py-3 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan">
            Siparişi takip et
          </button>
          <button onClick={() => router.navigate({ to: "/" })} className="rounded-full border border-paper/30 px-8 py-3 font-display text-sm uppercase tracking-[0.15em] text-paper transition hover:bg-paper hover:text-ink">
            Ana sayfa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-paper/15 p-8 text-center">
        <div className="mb-4 flex justify-center"><div className="flex size-14 items-center justify-center rounded-full bg-cyan/20"><span className="text-2xl text-cyan">₺</span></div></div>
        <h1 className="font-display text-2xl uppercase">Ödeme</h1>
        <p className="mt-2 text-sm text-paper/60">iyzico güvenli ödeme sayfası</p>
        <div className="my-6 rounded-lg bg-paper/5 p-4">
          <div className="flex justify-between text-sm"><span className="text-paper/60">Sipariş</span><span className="font-mono text-xs">{orderId}</span></div>
          <div className="mt-2 flex justify-between"><span className="font-display text-base uppercase">Toplam</span><span className="font-display text-2xl text-cyan">₺{total}</span></div>
        </div>
        <div className="mb-6 space-y-3 text-left">
          <div><label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-paper/50">Kart Üzerindeki İsim</label><input type="text" placeholder="Ad Soyad" className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none transition focus:border-cyan" /></div>
          <div><label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-paper/50">Kart Numarası</label><input type="text" placeholder="1234 5678 9012 3456" className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none transition focus:border-cyan" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-paper/50">Son Kullanma</label><input type="text" placeholder="MM/YY" className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none transition focus:border-cyan" /></div><div><label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-paper/50">CVV</label><input type="text" placeholder="123" className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none transition focus:border-cyan" /></div></div>
        </div>
        <button onClick={handlePay} disabled={processing} className="w-full rounded-full bg-crim py-3.5 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50">{processing ? "İşleniyor..." : `₺${total} öde`}</button>
        <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-paper/30">Sandbox ortamı · Gerçek ödeme alınmaz</p>
      </div>
    </div>
  );
}
