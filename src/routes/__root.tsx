import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider, useCart } from "../lib/cart";

// Import Tailwind CSS
import "../styles.css";

// Simple admin authentication check
const isAdminRoute = (pathname: string) => {
  return pathname.startsWith('/admin') && pathname !== '/admin/login';
};

const isAuthenticated = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('admin_authenticated') === 'true';
};

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
        <Link to="/" className="flex items-center gap-2 group">
          <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46" className="text-[#ff5500] transition-transform duration-300 group-hover:scale-105">
            <circle cx="27.3" cy="15.41" r="1.353" fill="currentColor"/>
            <path d="m25.85 16.85c-1.66 0.1-5.1 4.09-5.91 5.8h6.37l0.99-0.27 0.32 0.27h1.49c0.12 0 0.21-0.11 0.15-0.21-0.33-0.59-1.04-1.48-1.8-1.42-0.87 0.11-3.95 0.76-3.95 0.76l3.62-3.1 5.98 1.41-10.73 7.91c-0.87 0.08-1.71 0.37-2.43 0.85l-2.39 1.59c-0.21 0.13-0.19 0.43 0.01 0.56l1.27 0.78c0.19 0.12 0.44 0.11 0.62-0.01l2.38-1.72c0.58-0.41 1-0.94 1.23-1.52l10.83-8.06h0.35c0.25 0 0.43-0.19 0.43-0.44s-0.2-0.46-0.45-0.48l-0.33-0.04c-2.44-0.87-5.39-1.93-6.69-2.41-0.46-0.16-0.93-0.27-1.36-0.25z" fill="currentColor"/>
            <path d="m28.25 23.25c-8.18-0.02-20.37-0.1-25.1 0.22-0.11 0.01-0.11 0.08-0.01 0.11 2.16 0.73 8.17 1.49 12.37 1.48 3.4-0.07 6.35-0.21 9.8 0.35l2.94-2.16z" fill="currentColor"/>
            <path d="m30.72 23.22c4.13 0.03 8.57-0.29 11.96-0.7 0.1-0.01 0.14 0.06 0.05 0.12-1.24 0.9-3.53 2.34-5.31 2.73-2.13 0.45-7.05 0.34-9.85 0.17l3.15-2.32z" fill="currentColor"/>
            <path d="m23.62 26.65c-2.33-0.41-5.27-0.8-7.81-0.8-5.09 0-9.17 1.39-11.01 2.23-0.04 0.02-0.01 0.08 0.03 0.07 1.84-0.55 5.08-1.27 8.44-1.27 3.19 0 6.47 0.44 8.86 0.85l1.49-1.08z" fill="currentColor"/>
            <path d="m25.62 27.06c2.08 0.47 4.62 0.89 7.07 0.89 3.14 0 5.97-0.73 7.33-1.19 0.04-0.01 0.06 0.04 0.03 0.06-1.82 0.99-5.61 2.35-9.32 2.35-2.35-0.04-4.99-0.56-6.53-0.98l1.42-1.13z" fill="currentColor"/>
          </svg>
          <span className="font-display text-xl tracking-wide">
            KÜREK <span className="text-[#ff5500]">KULÜBÜ</span>
          </span>
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
        <span className="size-2.5 rounded-full bg-[#ff5500]" />
        <span className="font-display text-xl tracking-wide">
          KÜREK <span className="text-[#ff5500]">KULÜBÜ</span>
        </span>
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kürek Kulübü",
  "url": "https://rowingclub.com",
  "logo": "https://rowingclub.com/assets/favicon.svg",
  "description": "Kürek sporu ve deniz küreği temalı premium giyim markası. Tişört, hoodie, sweatshirt, şapka ve çorap.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "İstanbul",
    "addressCountry": "TR"
  },
  "sameAs": [
    "https://instagram.com/kurekkulubu",
    "https://facebook.com/kurekkulubu"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Kürek Kulübü",
  "url": "https://rowingclub.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://rowingclub.com/shop?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const clothingStoreSchema = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "name": "Kürek Kulübü",
  "image": "https://rowingclub.com/assets/hero-flatlay.jpg",
  "@id": "https://rowingclub.com",
  "url": "https://rowingclub.com",
  "telephone": "+90 212 000 00 00",
  "priceRange": "₺₺",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Boğaz İskelesi 4",
    "addressLocality": "İstanbul",
    "addressCountry": "TR"
  }
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kürek Kulübü — Deniz Küreği Tişört, Hoodie, Sweatshirt, Şapka & Çorap" },
      {
        name: "description",
        content:
          "Kürek Kulübü: Kürek sporu ve deniz tutkunları için özel tasarlanmış premium kürek tişörtleri, hoodieleri, sweatshirtleri, kürek şapkaları ve teknik çoraplar. Organik pamuk, dayanıklı baskı.",
      },
      {
        name: "keywords",
        content:
          "kürek tişörtü, kürek giyim, deniz küreği tişört, kürek hoodie, kürek sweatshirt, kürek şapkası, kürek çorabı, rowing club t-shirt, rowing clothing, organik pamuk tişört, denizci giyim, rowing club istanbul, kürek kıyafetleri",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Kürek Kulübü — Premium Deniz Küreği Giyim & Aksesuarları" },
      {
        property: "og:description",
        content:
          "Deniz küreği tutkusunu giyilebilir kılan tişörtler, hoodieler, sweatshirtler, şapkalar ve çoraplar. Organik pamuk, sınırlı baskı. İstanbul.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Kürek Kulübü" },
      { property: "og:locale", content: "tr_TR" },
      { property: "og:url", content: "https://rowingclub.com" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Kürek Kulübü — Deniz Küreği Tişört, Hoodie & Aksesuar" },
      {
        name: "twitter:description",
        content:
          "Kürek sporu ve deniz tutkunları için özel tasarlanmış premium giyim koleksiyonu.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://rowingclub.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/assets/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/assets/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(clothingStoreSchema),
      },
    ],
  }),
  beforeLoad: async ({ location }) => {
    // Check if we're accessing an admin route
    if (isAdminRoute(location.pathname)) {
      if (typeof window !== "undefined" && !isAuthenticated()) {
        // Redirect to login if not authenticated
        throw redirect({ to: '/admin/login' });
      }
    }
  },
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

function TrackingScripts() {
  const [tracking, setTracking] = useState<{
    gaMeasurementId?: string;
    gtmContainerId?: string;
    googleAdsId?: string;
    metaPixelId?: string;
  }>({});

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setTracking({
            gaMeasurementId: data.gaMeasurementId,
            gtmContainerId: data.gtmContainerId,
            googleAdsId: data.googleAdsId,
            metaPixelId: data.metaPixelId,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 1. GA4 & Google Ads Injection
    const gaId = tracking.gaMeasurementId || tracking.googleAdsId;
    if (gaId && typeof window !== "undefined" && !(window as any)._gaInjected) {
      (window as any)._gaInjected = true;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement("script");
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        ${tracking.gaMeasurementId ? `gtag('config', '${tracking.gaMeasurementId}');` : ""}
        ${tracking.googleAdsId ? `gtag('config', '${tracking.googleAdsId}');` : ""}
      `;
      document.head.appendChild(inlineScript);
    }

    // 2. GTM Injection
    if (tracking.gtmContainerId && typeof window !== "undefined" && !(window as any)._gtmInjected) {
      (window as any)._gtmInjected = true;
      const gtmScript = document.createElement("script");
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${tracking.gtmContainerId}');
      `;
      document.head.appendChild(gtmScript);
    }

    // 3. Meta Pixel Injection
    if (tracking.metaPixelId && typeof window !== "undefined" && !(window as any)._metaPixelInjected) {
      (window as any)._metaPixelInjected = true;
      const pixelScript = document.createElement("script");
      pixelScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${tracking.metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(pixelScript);
    }
  }, [tracking]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TrackingScripts />
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
