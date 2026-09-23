import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider, useCart } from "../lib/cart";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center text-paper">
      <h1 className="font-display text-8xl uppercase leading-none text-crim">404</h1>
      <h2 className="mt-4 font-display text-2xl uppercase tracking-wide">Sayfa bulunamadı</h2>
      <p className="mt-2 text-sm text-paper/60">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan"
      >
        Ana sayfa
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center text-paper">
      <h1 className="font-display text-2xl uppercase tracking-wide">Sayfa yüklenemedi</h1>
      <p className="mt-2 text-sm text-paper/60">Bir şeyler ters gitti. Yeniden deneyin veya ana sayfaya dönün.</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan"
        >
          Yeniden dene
        </button>
        <Link
          to="/"
          className="rounded-full border border-paper/40 px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-ink"
        >
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}

function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQty, total, count } =
    useCart();
  const router = useRouter();

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-paper/15 bg-ink transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-paper/15 px-6 py-5">
          <h2 className="font-display text-xl uppercase tracking-wide">
            Sepet ({count})
          </h2>
          <button
            onClick={close}
            className="text-xs uppercase tracking-[0.22em] text-paper/60 transition hover:text-paper"
            aria-label="Sepeti kapat"
          >
            Kapat ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-paper/60">Sepetiniz boş.</p>
            <Link
              to="/shop"
              onClick={close}
              className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan"
            >
              Mağazaya git
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <div
                  key={`${item.slug}-${item.size}-${item.color}`}
                  className="flex gap-4 border-b border-paper/10 py-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-24 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base uppercase">
                        {item.name}
                      </h3>
                      <button
                        onClick={() =>
                          removeItem(item.slug, item.size, item.color)
                        }
                        className="text-xs text-paper/40 transition hover:text-crim"
                        aria-label="Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-paper/50">
                      {item.color} · {item.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQty(
                              item.slug,
                              item.size,
                              item.color,
                              item.qty - 1,
                            )
                          }
                          className="flex size-7 items-center justify-center rounded-full border border-paper/20 text-sm transition hover:bg-paper hover:text-ink"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm">{item.qty}</span>
                        <button
                          onClick={() =>
                            updateQty(
                              item.slug,
                              item.size,
                              item.color,
                              item.qty + 1,
                            )
                          }
                          className="flex size-7 items-center justify-center rounded-full border border-paper/20 text-sm transition hover:bg-paper hover:text-ink"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-cyan">
                        ₺{item.price * item.qty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-paper/15 px-6 py-5">
              <div className="flex items-center justify-between pb-4">
                <span className="text-xs uppercase tracking-[0.22em] text-paper/60">
                  Toplam
                </span>
                <span className="font-display text-2xl text-paper">
                  ₺{total}
                </span>
              </div>
              <button
                onClick={() => {
                  close();
                  router.navigate({ to: "/checkout" });
                }}
                className="w-full rounded-full bg-crim py-3.5 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan"
              >
                Siparişi tamamla
              </button>
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-paper/40">
                iyzico ile güvenli ödeme &nbsp;·&nbsp; 14 gün iade
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Header() {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-paper/15 bg-ink/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-crim" />
          <span className="font-display text-xl tracking-wide">KÜREK KULÜBÜ</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.22em] text-paper/70 md:flex">
          <Link to="/shop" className="transition hover:text-paper">
            Mağaza
          </Link>
          <Link to="/kulup" className="transition hover:text-paper">
            Kulüp
          </Link>
          <Link to="/iletisim" className="transition hover:text-paper">
            İletişim
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={open}
            className="text-[11px] uppercase tracking-[0.22em] text-paper/70 transition hover:text-paper"
          >
            Sepet ({count})
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-paper md:hidden"
            aria-label="Menü"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-paper/15 px-6 py-4 text-sm uppercase tracking-[0.18em] text-paper/70 md:hidden">
          <Link to="/shop" onClick={() => setMenuOpen(false)} className="py-2 transition hover:text-paper">
            Mağaza
          </Link>
          <Link to="/kulup" onClick={() => setMenuOpen(false)} className="py-2 transition hover:text-paper">
            Kulüp
          </Link>
          <Link to="/iletisim" onClick={() => setMenuOpen(false)} className="py-2 transition hover:text-paper">
            İletişim
          </Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-paper/15 px-6 py-12 text-center lg:px-10">
      <div className="flex items-center justify-center gap-2">
        <span className="size-2.5 rounded-full bg-crim" />
        <span className="font-display text-xl tracking-wide">KÜREK KULÜBÜ</span>
      </div>
      <p className="mt-4 font-display text-[13px] uppercase tracking-[0.15em] text-paper/80">
        Kürek Kulübü · Deniz Küreği Tişörtleri · İstanbul
      </p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-paper/40">
        © 2025 · Tüm kürekler suya · Baskı & tasarım kulüp içi
      </p>
      <div className="mt-6 flex justify-center gap-6 text-[11px] uppercase tracking-[0.18em] text-paper/50">
        <Link to="/shop" className="transition hover:text-paper">Mağaza</Link>
        <Link to="/kulup" className="transition hover:text-paper">Kulüp</Link>
        <Link to="/iletisim" className="transition hover:text-paper">İletişim</Link>
      </div>
    </footer>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kürek Kulübü — Deniz Küreği Tişörtleri" },
      {
        name: "description",
        content:
          "Kürek Kulübü deniz küreği temalı tişörtleri tanıtır ve satar. Organik pamuk, sınırlı baskı, İstanbul.",
      },
      { property: "og:title", content: "Kürek Kulübü — Deniz Küreği Tişörtleri" },
      {
        property: "og:description",
        content:
          "Deniz küreği tutkusunu giyilebilir kılan tişörtler. Organik pamuk, sınırlı baskı.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="noise-overlay" />
        <div className="flex min-h-screen flex-col bg-ink text-paper">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <CartDrawer />
      </CartProvider>
    </QueryClientProvider>
  );
}
