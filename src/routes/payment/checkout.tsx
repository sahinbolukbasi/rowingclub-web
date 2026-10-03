import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/checkout")({
  head: () => ({
    meta: [
      { title: "Güvenli Ödeme — Kürek Kulübü" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentCheckoutPage,
});

function PaymentCheckoutPage() {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(4);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);

  // Read search params in browser
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const paramOrderId = searchParams?.get("orderId") ?? "";
  const paramTotal = searchParams?.get("total") ?? "0";
  const paramPaymentUrl = searchParams?.get("paymentUrl") ?? "";

  const [paymentUrl, setPaymentUrl] = useState(paramPaymentUrl);

  // If paymentUrl wasn't passed in query or order needs to be verified, fetch order
  useEffect(() => {
    if (!paramOrderId) return;
    fetch(`/api/orders/${encodeURIComponent(paramOrderId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setOrder(data);
          if (data.paymentUrl && !paymentUrl) {
            setPaymentUrl(data.paymentUrl);
          }
        }
      })
      .catch((e) => console.error("Fetch order error:", e));
  }, [paramOrderId]);

  // Countdown timer for automatic redirect to iyzico payment link
  useEffect(() => {
    if (!paymentUrl || autoRedirectPaused) return;

    if (countdown <= 0) {
      window.location.href = paymentUrl;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [paymentUrl, countdown, autoRedirectPaused]);

  const activeTotal = order?.total ?? paramTotal;
  const activeOrderId = order?.id ?? paramOrderId;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-paper/20 bg-ink/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        {paymentUrl ? (
          <>
            {/* iyzico Payment Ready Card */}
            <div className="mb-6 flex justify-center">
              <div className="relative flex size-20 items-center justify-center rounded-2xl bg-cyan/15 border-2 border-cyan/40 shadow-[0_0_30px_rgba(18,112,127,0.3)]">
                <span className="text-4xl">💳</span>
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-ink font-bold shadow-md">
                  ✓
                </span>
              </div>
            </div>

            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan font-bold mb-1">
              — iyzico Güvenli Ödeme
            </p>
            <h1 className="font-display text-2xl uppercase tracking-wide text-paper sm:text-3xl">
              Ödemeye Yönlendiriliyorsunuz
            </h1>

            <p className="mt-2 text-xs text-paper/70 leading-relaxed">
              Sepet tutarınıza özel <strong>iyzico Ödeme Linki</strong> başarıyla oluşturuldu. Kredi veya banka kartınızla güvenle ödemenizi tamamlayabilirsiniz.
            </p>

            {/* Sipariş Özeti Kutusu */}
            <div className="my-6 rounded-2xl border border-paper/15 bg-paper/5 p-5 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-paper/50 uppercase tracking-wider">Sipariş No:</span>
                <span className="font-mono text-sm text-cyan font-bold">#{activeOrderId || "—"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-paper/50 uppercase tracking-wider">Ödenecek Tutar:</span>
                <span className="font-display text-2xl text-paper font-bold">₺{activeTotal}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-paper/10 pt-2.5">
                <span className="text-paper/50 uppercase tracking-wider">Ödeme Altyapısı:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  iyzico Link ile Korumalı Ödeme
                </span>
              </div>
            </div>

            {/* Otomatik Yönlendirme Bildirimi */}
            {!autoRedirectPaused && countdown > 0 ? (
              <div className="mb-6 flex items-center justify-between rounded-xl bg-cyan/10 border border-cyan/30 px-4 py-2.5 text-xs text-cyan">
                <span>
                  <strong>{countdown} saniye</strong> içinde iyzico'ya aktarılıyorsunuz...
                </span>
                <button
                  type="button"
                  onClick={() => setAutoRedirectPaused(true)}
                  className="text-[11px] uppercase tracking-wider text-paper/70 hover:text-paper underline cursor-pointer"
                >
                  Durdur
                </button>
              </div>
            ) : null}

            {/* Butonlar */}
            <div className="space-y-3">
              <a
                href={paymentUrl}
                className="flex items-center justify-center gap-2 w-full rounded-full bg-crim py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-ink transition hover:bg-cyan shadow-xl shadow-crim/20 cursor-pointer"
              >
                <span>Hemen iyzico ile Öde (₺{activeTotal})</span>
                <span>→</span>
              </a>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {activeOrderId && (
                  <button
                    onClick={() => router.navigate({ to: `/siparis/${activeOrderId}` })}
                    className="flex-1 rounded-full border border-paper/20 py-2.5 font-display text-[11px] uppercase tracking-[0.18em] text-paper/70 transition hover:border-paper/40 hover:text-paper cursor-pointer"
                  >
                    Siparişi Takip Et
                  </button>
                )}
                <button
                  onClick={() => router.navigate({ to: "/" })}
                  className="flex-1 rounded-full border border-paper/20 py-2.5 font-display text-[11px] uppercase tracking-[0.18em] text-paper/70 transition hover:border-paper/40 hover:text-paper cursor-pointer"
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            </div>

            {/* Güvenlik Rozetleri */}
            <div className="mt-8 pt-6 border-t border-paper/10 flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-paper/40 font-mono">
              <span className="flex items-center gap-1.5">
                <span>🔒</span> 256-Bit SSL
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span>🛡️</span> 3D Secure
              </span>
              <span>·</span>
              <span>Mastercard & Visa & Troy</span>
            </div>
          </>
        ) : (
          <>
            {/* Fallback / Order Received Card */}
            <div className="mb-5 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-cyan/15 border-2 border-cyan/40">
                <span className="text-4xl">📋</span>
              </div>
            </div>

            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan font-bold mb-1">
              — Sipariş Alındı
            </p>
            <h1 className="font-display text-2xl uppercase tracking-wide text-paper sm:text-3xl">
              Siparişiniz Başarıyla Alındı
            </h1>

            <p className="mt-3 text-xs leading-relaxed text-paper/70">
              Sipariş kaydınız oluşturuldu. Sipariş detaylarını ve durumunu sipariş takip sayfasından dilediğiniz zaman inceleyebilirsiniz.
            </p>

            <div className="my-6 rounded-2xl border border-paper/15 bg-paper/5 p-5 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-paper/50 uppercase tracking-wider">Sipariş No:</span>
                <span className="font-mono text-sm text-cyan font-bold">#{activeOrderId || "—"}</span>
              </div>
              {activeTotal !== "0" && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-paper/50 uppercase tracking-wider">Toplam Tutar:</span>
                  <span className="font-display text-xl text-paper font-bold">₺{activeTotal}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-paper/50 uppercase tracking-wider">Durum:</span>
                <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                  Sipariş Alındı (Beklemede)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {activeOrderId && (
                <button
                  onClick={() => router.navigate({ to: `/siparis/${activeOrderId}` })}
                  className="flex-1 rounded-full bg-crim py-3.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-ink transition hover:bg-cyan shadow-lg cursor-pointer"
                >
                  Siparişi Takip Et ↗
                </button>
              )}
              <button
                onClick={() => router.navigate({ to: "/" })}
                className="flex-1 rounded-full border border-paper/30 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-paper hover:text-ink cursor-pointer"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
