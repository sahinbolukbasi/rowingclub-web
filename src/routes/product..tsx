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
    <section className="px-6 py-12 lg:px-10">
      <div className="mb-8">
        <Link to="/shop" className="text-[11px] uppercase tracking-[0.22em] text-paper/50 transition hover:text-paper">← Mağazaya dön</Link>
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image gallery */}
        <div>
          <div className="overflow-hidden rounded-lg bg-teal/20">
            <img src={images[imgIndex] || product.image || ""} alt={product.name} className="aspect-[4/5] w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setImgIndex(i)} className={`size-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${i === imgIndex ? "border-crim" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.tag && <span className="mb-3 inline-block rounded-full bg-crim px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-ink">{product.tag}</span>}
          <h1 className="font-display text-4xl uppercase md:text-6xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            {hasDiscount ? (
              <><span className="text-2xl text-crim font-bold">₺{discPrice}</span><span className="text-lg text-paper/40 line-through">₺{product.price}</span><span className="text-[10px] uppercase tracking-[0.18em] text-crim">%{product.discount.value} indirim</span></>
            ) : (
              <span className="text-2xl text-cyan">₺{product.price}</span>
            )}
          </div>
          <p className="mt-6 leading-relaxed text-paper/70">{product.detail}</p>

          {/* Color */}
          {product.colors?.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-paper/60">Renk {color && <span className="text-paper">· {color}</span>}</p>
              <div className="flex gap-3">
                {product.colors.map((c: any) => (
                  <button key={c.name} onClick={() => setColor(c.name)} className={`flex size-10 items-center justify-center rounded-full border-2 transition ${selColor === c.name ? "border-cyan" : "border-paper/20 hover:border-paper/50"}`} style={{ backgroundColor: c.hex }} aria-label={c.name} />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-paper/60">Beden {size && <span className="text-paper">· {size}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s: string) => {
                  const stockCount = product.stockPerSize?.[s] ?? 0;
                  const disabled = stockCount === 0;
                  return (
                    <button key={s} onClick={() => !disabled && setSize(s)} disabled={disabled} className={`min-w-12 rounded-full border px-4 py-2 text-sm transition ${selSize === s && !disabled ? "border-cyan bg-cyan text-ink" : disabled ? "border-paper/10 text-paper/30 line-through cursor-not-allowed" : "border-paper/20 text-paper/70 hover:border-paper/50"}`}>
                      {s}{stockCount > 0 && stockCount <= 3 && <span className="ml-1 text-[9px] text-crim">({stockCount})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={() => addItem(product as any, selSize, selColor)} disabled={maxStock === 0} className="mt-8 w-full rounded-full bg-crim py-4 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-30">
            {maxStock === 0 ? "Stokta yok" : `Sepete ekle · ${hasDiscount ? `₺${discPrice}` : `₺${product.price}`}`}
          </button>

          <div className="mt-6 space-y-2 text-[11px] uppercase tracking-[0.18em] text-paper/50">
            <p>✓ Organik pamuk · 220 gsm</p>
            <p>✓ 14 gün koşulsuz iade</p>
            <p>✓ İstanbul içi 2 gün kargo</p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-20 border-t border-paper/15 pt-12">
          <h2 className="mb-8 font-display text-2xl uppercase md:text-3xl">Diğer tasarımlar</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p: any) => (
              <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="group">
                <div className="overflow-hidden rounded-lg bg-teal/20"><img src={p.images?.[0] || p.image || ""} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <div className="mt-3 flex items-baseline justify-between"><h3 className="font-display text-lg uppercase">{p.name}</h3><span className="text-sm text-cyan">₺{calcDiscountedPrice(p.price, p.discount)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
