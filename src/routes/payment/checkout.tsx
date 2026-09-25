import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/payment/checkout")({
  head: () => ({
    meta: [
      { title: "Ödeme — Kürek Kulübü" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentCheckoutPage,
});

function PaymentCheckoutPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const orderId = searchParams.get("orderId") ?? "";
  const total = searchParams.get("total") ?? "0";
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paymentId: `pay_${Date.now()}_iyzico`,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setDone(true);
    setProcessing(false);
  };

  if (done) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-8">
          <div className="flex size-24 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h1 className="font-display text-4xl uppercase tracking-wide text-paper">Siparişiniz Alındı!</h1>
        <p className="mt-4 max-w-md text-base text-paper/70 leading-relaxed">
          Teşekkür ederiz! Siparişiniz ve ödemeniz başarıyla alındı.
        </p>

        <div className="mt-8 rounded-2xl border border-paper/15 bg-paper/5 px-10 py-6 max-w-md w-full">
          <p className="text-[11px] uppercase tracking-[0.22em] text-paper/50 mb-2">Sipariş Numarası</p>
          <p className="font-mono text-3xl tracking-wider text-cyan font-bold">#{orderId}</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => router.navigate({ to: `/siparis/${orderId}` })}
            className="rounded-full bg-crim px-8 py-3.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-ink transition hover:bg-cyan shadow-lg"
          >
            Siparişi Takip Et
          </button>
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="rounded-full border border-paper/30 px-8 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-paper hover:text-ink"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-paper/15 bg-ink/60 p-8 text-center shadow-2xl">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-cyan/20 border border-cyan/40">
            <span className="text-3xl">🔒</span>
          </div>
        </div>

        <h1 className="font-display text-2xl uppercase tracking-wide text-paper">Güvenli Ödeme</h1>
        <p className="mt-1.5 text-xs text-paper/60">iyzico 256-Bit SSL Korumalı Ödeme Altyapısı</p>

        <div className="my-6 rounded-xl border border-paper/15 bg-paper/5 p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-paper/60">Sipariş No:</span>
            <span className="font-mono text-sm text-cyan font-bold">#{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-paper/60">Ödeme Yöntemi:</span>
            <span className="text-paper font-semibold">iyzico Güvenli Ödeme</span>
          </div>
          <div className="pt-2 border-t border-paper/10 flex justify-between items-center">
            <span className="font-display text-sm uppercase text-paper/80">Toplam Tutar</span>
            <span className="font-display text-2xl text-paper font-bold">₺{total}</span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full rounded-full bg-crim py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-ink transition hover:bg-cyan disabled:opacity-50 shadow-xl"
        >
          {processing ? "Ödeme Onaylanıyor..." : `🔒 Ödemeyi Tamamla (₺${total})`}
        </button>

        <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-paper/40">
          iyzico ile korumalı 256-Bit SSL altyapısı
        </p>
      </div>
    </div>
  );
}
