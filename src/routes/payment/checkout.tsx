import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/payment/checkout")({
  head: () => ({
    meta: [
      { title: "Ödeme Durumu — Kürek Kulübü" },
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

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-ink/80 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mb-5 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-amber-500/15 border-2 border-amber-500/40 animate-pulse">
            <span className="text-4xl">⚠️</span>
          </div>
        </div>

        <h1 className="font-display text-2xl uppercase tracking-wide text-amber-400 sm:text-3xl">
          Şu An Ödeme Alınamıyor
        </h1>
        
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Ödeme altyapımızda yapılan sistem güncellemesi ve bakım çalışması nedeniyle online kredi kartı ödemeleri geçici olarak durdurulmuştur.
        </p>

        <div className="my-6 rounded-xl border border-paper/15 bg-paper/5 p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-paper/60 uppercase tracking-wider">Sipariş Numarası:</span>
            <span className="font-mono text-sm text-cyan font-bold">#{orderId || "—"}</span>
          </div>
          {total !== "0" && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-paper/60 uppercase tracking-wider">Toplam Tutar:</span>
              <span className="font-display text-base text-paper font-bold">₺{total}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-paper/60 uppercase tracking-wider">Durum:</span>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Sipariş Alındı (Ödeme Bekliyor)
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 mb-6 text-xs text-amber-300/90 text-left">
          💡 <strong>Bilgilendirme:</strong> Siparişiniz sisteme kaydedilmiştir. Müşteri temsilcimiz alternatif ödeme yöntemleri ve teslimat süreci hakkında en kısa sürede sizinle iletişime geçecektir.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {orderId && (
            <button
              onClick={() => router.navigate({ to: `/siparis/${orderId}` })}
              className="flex-1 rounded-full bg-crim py-3.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-ink transition hover:bg-cyan shadow-lg"
            >
              Siparişi Takip Et ↗
            </button>
          )}
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="flex-1 rounded-full border border-paper/30 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-paper hover:text-ink"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}

