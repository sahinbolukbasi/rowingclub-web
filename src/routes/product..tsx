import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";

function calcDiscountedPrice(price: number, discount: any): number {
  if (!discount || discount.value <= 0) return price;
  return discount.type === "percentage" ? Math.round(price * (1 - discount.value / 100)) : Math.max(0, price - discount.value);
}

export const Route = createFileRoute("/product/")({
  head: ({ params }) => ({ meta: [{ title: `Ürün — Kürek Kulübü` }, { name: "description", content: "Deniz küreği temalı ürün." }, { property: "og:title", content: `Ürün — Kürek Kulübü` }, { property: "og:description", content: "Deniz küreği temalı ürün." }] }),
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
  const maxStock = product.stockPerSize?.[selSize] ?? (product.stock || 0);
  const images = product.images?.filter((i: string) => i) ?? [];

  return (
    <section className="px-6 py-10 lg:px-12 xl:px-16 w-full">
      <div className="mb-6">
        <Link to="/shop" className="text-[11px] uppercase tracking-[0.22em] text-paper/50 transition hover:text-paper">
          ← Mağazaya dön
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-start">
        {/* Left: Product Image & Gallery */}
        <div className="flex flex-col w-full">
          <div className="relative aspect-[3/4.7] min-h-[660px] sm:min-h-[780px] lg:min-h-[940px] max-h-[1040px] w-full overflow-hidden rounded-2xl border border-paper/15 bg-teal/20 flex items-center justify-center group shadow-2xl">
            <img
              src={images[imgIndex] || product.image || ""}
              alt={product.name}
              onClick={() => setZoomModal(true)}
              className="h-full w-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
            />
            <button
              onClick={() => setZoomModal(true)}
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-ink/80 border border-paper/20 px-3 py-1.5 text-[10px] uppercase tracking-wider text-paper opacity-80 hover:opacity-100 transition shadow-lg cursor-pointer"
            >
              🔍 Büyüt
            </button>

            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 z-20 flex max-w-[calc(100%-32px)] flex-wrap gap-2.5 rounded-xl bg-ink/80 p-2 backdrop-blur-md border border-paper/20 shadow-2xl">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIndex(i);
                    }}
                    className={`size-14 sm:size-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer shadow-md ${
                      i === imgIndex
                        ? "border-crim ring-2 ring-crim/30 scale-105"
                        : "border-paper/20 opacity-60 hover:opacity-100 hover:border-paper/50"
                    }`}
                  >
                    <img src={img} alt={`Görsel ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
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
            </div>
          </div>

          <p className="leading-relaxed text-paper/80 text-base">{product.detail || product.description}</p>

          {/* Color */}
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
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes?.length > 0 && (
            <div className="border-t border-paper/15 pt-6">
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-paper/60 font-semibold">
                Beden: <span className="text-paper font-bold">{selSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s: string) => {
                  const stockCount = product.stockPerSize?.[s] ?? 0;
                  const disabled = stockCount === 0;
                  return (
                    <button
                      key={s}
                      onClick={() => !disabled && setSize(s)}
                      disabled={disabled}
                      className={`min-w-12 rounded-xl border px-4 py-2.5 text-sm font-mono font-bold transition cursor-pointer ${
                        selSize === s && !disabled
                          ? "border-cyan bg-cyan text-ink shadow-md"
                          : disabled
                          ? "border-paper/10 text-paper/30 line-through cursor-not-allowed bg-ink/30"
                          : "border-paper/20 text-paper/70 hover:border-paper/50 hover:text-paper"
                      }`}
                    >
                      {s}
                      {stockCount > 0 && stockCount <= 3 && (
                        <span className="ml-1 text-[10px] text-crim font-bold">({stockCount})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => addItem(product as any, selSize, selColor)}
            disabled={maxStock === 0}
            className="w-full rounded-full bg-crim py-4 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-30 font-bold shadow-xl cursor-pointer"
          >
            {maxStock === 0 ? "Stokta yok" : `Sepete ekle · ${hasDiscount ? `₺${discPrice}` : `₺${product.price}`}`}
          </button>

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
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={images[imgIndex] || product.image || ""}
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setZoomModal(false)}
              className="absolute -top-4 -right-4 flex size-10 items-center justify-center rounded-full bg-crim text-ink font-bold text-base shadow-xl hover:bg-cyan transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Related */}
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
