import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useEffect, useState, useRef } from "react";

function calcDiscountedPrice(price: number, discount: any): number {
  if (!discount || discount.value <= 0) return price;
  return discount.type === "percentage" ? Math.round(price * (1 - discount.value / 100)) : Math.max(0, price - discount.value);
}

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Ürün — Kürek Kulübü` }, { name: "description", content: "Deniz küreği temalı ürün." }] }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [imgIndex, setImgIndex] = useState(0);
  const [zoomModal, setZoomModal] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const THUMB_COUNT = 3;

  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((prods) => {
        if (Array.isArray(prods)) {
          setAllProducts(prods);
          setProduct(prods.find((p: any) => p.slug === slug) ?? null);
        }
      })
      .catch((err) => console.error("Product load error:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-paper/50 animate-pulse">Ürün yükleniyor...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-2xl uppercase">Ürün bulunamadı</p>
        <Link to="/shop" className="rounded-full bg-crim px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-ink transition hover:bg-cyan">Mağazaya dön</Link>
      </div>
    );
  }

  const related = allProducts.filter((p: any) => p.slug !== slug).slice(0, 3);
  const selSize = size || product.sizes?.[0] || "M";
  const selColor = color || product.colors?.[0]?.name || "";
  const discPrice = calcDiscountedPrice(product.price, product.discount);
  const hasDiscount = discPrice !== product.price;
  const images = product.images?.filter((i: string) => i) ?? [];
  const displayImages = images.length > 0 ? images : (product.image ? [product.image] : []);

  const prevImage = () => {
    if (displayImages.length <= 1) return;
    setImgIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
  };
  const nextImage = () => {
    if (displayImages.length <= 1) return;
    setImgIndex((i) => (i + 1) % displayImages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": images.length ? images : [product.image],
    "description": product.description || product.detail,
    "sku": product.slug,
    "brand": {
      "@type": "Brand",
      "name": "Kürek Kulübü",
    },
    "offers": {
      "@type": "Offer",
      "url": `https://rowingclub.co/product/${product.slug}`,
      "priceCurrency": "TRY",
      "price": discPrice,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.isClosed ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Kürek Kulübü",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://rowingclub.co" },
      { "@type": "ListItem", "position": 2, "name": "Mağaza", "item": "https://rowingclub.co/shop" },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://rowingclub.co/product/${product.slug}` },
    ],
  };

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-12 xl:px-16 w-full max-w-7xl mx-auto overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="mb-6">
        <Link to="/shop" className="text-[11px] uppercase tracking-[0.22em] text-paper/50 transition hover:text-paper">
          ← Mağazaya dön
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-18 items-start">
        {/* Left: Product Image & Gallery */}
        <div className="flex flex-col w-full max-w-lg lg:max-w-none mx-auto">
          {/* Main Large Image Container with Touch Swipe */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4.5] sm:min-h-[640px] lg:min-h-[850px] max-h-[920px] w-full overflow-hidden rounded-2xl border border-paper/15 bg-teal/20 flex items-center justify-center group shadow-2xl select-none touch-pan-y"
          >
            {/* Sliding Track for smooth image transitions */}
            <div
              className="flex h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${imgIndex * 100}%)` }}
            >
              {displayImages.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="h-full w-full flex-shrink-0 flex items-center justify-center cursor-zoom-in"
                  onClick={() => setZoomModal(true)}
                >
                  <img
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    className="h-full w-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Photo Counter (e.g. 1 / 4) */}
            {displayImages.length > 1 && (
              <div className="absolute top-3.5 left-3.5 z-20 rounded-full bg-ink/75 border border-paper/20 px-2.5 py-1 text-[11px] font-mono tracking-wider text-paper/90 backdrop-blur-md shadow-md pointer-events-none">
                {imgIndex + 1} / {displayImages.length}
              </div>
            )}

            {/* Zoom Button Badge */}
            <button
              onClick={() => setZoomModal(true)}
              className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 rounded-full bg-ink/80 border border-paper/20 px-3 py-1.5 text-[10px] uppercase tracking-wider text-paper opacity-85 hover:opacity-100 transition shadow-lg cursor-pointer"
            >
              🔍 Büyüt
            </button>

            {/* Mobile Dots Indicator */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:hidden bg-ink/70 px-3 py-1.5 rounded-full backdrop-blur-md border border-paper/15">
                {displayImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === imgIndex ? "w-5 bg-crim" : "w-1.5 bg-paper/40"
                    }`}
                    aria-label={`Görsel ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Navigation Arrows (visible on mobile touch, hover on desktop) */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full bg-ink/80 text-paper border border-paper/20 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-crim hover:text-ink shadow-lg cursor-pointer active:scale-95"
                  aria-label="Önceki Görsel"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full bg-ink/80 text-paper border border-paper/20 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-crim hover:text-ink shadow-lg cursor-pointer active:scale-95"
                  aria-label="Sonraki Görsel"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Row below photo */}
          {displayImages.length > 1 && (
            <div className="mt-3.5 flex items-center justify-center sm:justify-start gap-2.5 overflow-x-auto py-1 px-1 max-w-full">
              {displayImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setImgIndex(idx)}
                  className={`size-14 sm:size-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer shadow-md ${
                    idx === imgIndex
                      ? "border-crim ring-2 ring-crim/30 scale-105"
                      : "border-paper/20 opacity-60 hover:opacity-100 hover:border-paper/50"
                  }`}
                >
                  <img src={img} alt={`Görsel ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details (Sticky so it stays visible while scrolling image) */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <div>
            {product.tag && (
              <span className="mb-3 inline-block rounded-full bg-crim px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink shadow-md">
                {product.tag}
              </span>
            )}
            <h1 className="font-display text-4xl uppercase md:text-5xl lg:text-6xl text-paper">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-3xl text-crim font-bold">₺{discPrice}</span>
                  <span className="text-xl text-paper/40 line-through">₺{product.price}</span>
                  <span className="rounded-full bg-crim px-2.5 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                    %{product.discount.value} indirim
                  </span>
                </>
              ) : (
                <span className="text-3xl text-cyan font-bold">₺{product.price}</span>
              )}
              {product.isClosed && (
                <span className="rounded-full bg-crim px-3 py-1 text-xs font-bold uppercase tracking-wider text-paper shadow-md">
                  STOK YOK
                </span>
              )}
            </div>
          </div>

          <p className="leading-relaxed text-paper/80 text-base">{product.detail || product.description}</p>

          {/* Color Selector */}
          {product.colors?.length > 0 && (
            <div className="border-t border-paper/15 pt-6">
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-paper/60 font-semibold">
                Renk: <span className="text-paper font-bold">{selColor}</span>
              </p>
              <div className="flex gap-3">
                {product.colors.map((c: any) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`flex size-10 items-center justify-center rounded-full border-2 transition cursor-pointer ${
                      selColor === c.name ? "border-cyan ring-2 ring-cyan/30 scale-105" : "border-paper/20 hover:border-paper/50"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes?.length > 0 && (
            <div className="border-t border-paper/15 pt-6">
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-paper/60 font-semibold">
                Beden: <span className="text-paper font-bold">{selSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s: string) => {
                  const stockCount = product.stockPerSize?.[s] ?? 0;
                  const isDisabled = product.isClosed || stockCount === 0;
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      disabled={isDisabled}
                      className={`min-w-12 rounded-xl border px-4 py-2.5 text-sm font-mono font-bold transition cursor-pointer ${
                        selSize === s && !isDisabled
                          ? "border-cyan bg-cyan text-ink shadow-md"
                          : isDisabled
                          ? "border-paper/10 text-paper/30 line-through cursor-not-allowed bg-ink/30"
                          : "border-paper/20 text-paper/70 hover:border-paper/50 hover:text-paper"
                      }`}
                    >
                      {s}
                      {stockCount > 0 && stockCount <= 3 && !product.isClosed && (
                        <span className="ml-1 text-[10px] text-crim font-bold">({stockCount})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          {product.isClosed ? (
            <button
              disabled
              className="w-full rounded-full border border-crim/40 bg-crim/10 py-4 font-display text-sm uppercase tracking-[0.15em] text-crim cursor-not-allowed font-bold"
            >
              Stokta Yok · Satışa Kapalı
            </button>
          ) : (
            <button
              onClick={() => addItem(product, selSize, selColor)}
              className="w-full rounded-full bg-crim py-4 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan font-bold shadow-xl cursor-pointer"
            >
              Sepete ekle · {hasDiscount ? `₺${discPrice}` : `₺${product.price}`}
            </button>
          )}

          <div className="border-t border-paper/15 pt-6 space-y-2 text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold">
            <p>✓ Organik pamuk · 220 gsm ağır dokuma</p>
            <p>✓ 14 gün koşulsuz iade & değişim garantisi</p>
            <p>✓ Türkiye genelinde ücretsiz kargo</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Zoom Modal */}
      {zoomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-md cursor-pointer"
          onClick={() => setZoomModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={displayImages[imgIndex] || product.image || ""}
              alt={product.name}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-ink/80 text-paper border border-paper/20 hover:bg-crim hover:text-ink transition cursor-pointer"
                  aria-label="Önceki Görsel"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-ink/80 text-paper border border-paper/20 hover:bg-crim hover:text-ink transition cursor-pointer"
                  aria-label="Sonraki Görsel"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={() => setZoomModal(false)}
              className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full bg-crim text-ink font-bold text-base shadow-xl hover:bg-cyan transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Related Products Section */}
      {related.length > 0 && (
        <div className="mt-24 border-t border-paper/15 pt-12">
          <h2 className="mb-8 font-display text-2xl uppercase md:text-4xl text-paper">Diğer tasarımlar</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {related.map((p: any) => (
              <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="group">
                <div className="overflow-hidden rounded-xl bg-teal/20 border border-paper/15 shadow-md">
                  <img
                    src={p.images?.[0] || p.image || ""}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <h3 className="font-display text-lg uppercase transition-colors group-hover:text-cyan">
                    {p.name}
                  </h3>
                  <span className="text-sm text-cyan font-bold">₺{calcDiscountedPrice(p.price, p.discount)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
