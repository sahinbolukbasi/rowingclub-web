import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-rowing.jpg";
import storyFlatlay from "@/assets/story-flatlay.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Kürek Kulübü — Deniz Küreği Tişörtleri" }, { name: "description", content: "Deniz küreği temalı tişörtler." }] }),
  component: Index,
});

function calcDiscountedPrice(price: number, discount: any): number {
  if (!discount || discount.value <= 0) return price;
  return discount.type === "percentage" ? Math.round(price * (1 - discount.value / 100)) : Math.max(0, price - discount.value);
}

function totalStock(p: any): number {
  if (p.stockPerSize) return Object.values(p.stockPerSize as Record<string, number>).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
  return p.stock || 0;
}

function ProductCard({ product }: { product: any }) {
  const { addItem, open: openCart } = useCart();
  const hasDiscount = product.discount && product.discount.value > 0;
  const discPrice = calcDiscountedPrice(product.price, product.discount);
  const outOfStock = product.stockPerSize && totalStock(product) === 0;
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [qSize, setQSize] = useState(product.sizes?.[0] || "M");
  const [qColor, setQColor] = useState(product.colors?.[0]?.name || "");

  const handleQuickBuy = () => {
    addItem(product, qSize, qColor);
    openCart();
    setShowQuickBuy(false);
  };

  return (
    <article className="group">
      <Link to={"/product/$slug"} params={{ slug: product.slug }}>
        <div className="relative overflow-hidden rounded-lg bg-teal/20">
          <img src={product.images?.[0] || product.image || ""} alt={product.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {product.tag && <span className="absolute left-3 top-3 rounded-full bg-crim px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-ink">{product.tag}</span>}
          {hasDiscount && <span className="absolute right-3 top-3 rounded-full bg-crim px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white">%{product.discount.value} İndirim</span>}
        </div>
      </Link>
      <div className="mt-4 flex items-baseline justify-between">
        <Link to={"/product/$slug"} params={{ slug: product.slug }}><h3 className="font-display text-xl uppercase">{product.name}</h3></Link>
        <div className="text-right">
          {hasDiscount ? <><span className="text-sm text-paper/40 line-through block">₺{product.price}</span><span className="text-sm text-crim font-bold">₺{discPrice}</span></> : <span className="text-sm text-cyan">₺{product.price}</span>}
        </div>
      </div>
      <p className="mt-1 text-sm text-paper/60">{product.description}</p>
      {outOfStock ? (
        <p className="mt-3 w-full rounded-full border border-paper/10 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-paper/40">Stokta yok</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Link to={"/product/$slug"} params={{ slug: product.slug }} className="flex-1 rounded-full border border-paper/20 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-paper/70 transition hover:border-paper/50">İncele</Link>
          <div className="relative flex-1">
            <button onClick={() => setShowQuickBuy(!showQuickBuy)} className="w-full rounded-full bg-crim py-2 text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-cyan">Hızlı al</button>
            {showQuickBuy && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickBuy(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-lg border border-paper/15 bg-ink p-3 shadow-xl shadow-ink/80 min-w-[180px]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-paper/50 mb-2">{hasDiscount ? <>₺{discPrice} <span className="line-through text-paper/30">₺{product.price}</span></> : "₺" + product.price}</p>
                  {product.colors?.length > 1 && (<div className="mb-2"><p className="text-[9px] uppercase tracking-[0.15em] text-paper/40 mb-1">Renk</p><div className="flex gap-1.5 flex-wrap">{product.colors.map((c: any) => (<button key={c.name} onClick={(e) => { e.stopPropagation(); setQColor(c.name); }} className={"size-5 rounded-full border-2 transition " + (qColor === c.name ? "border-cyan ring-1 ring-cyan/30" : "border-paper/30")} style={{ backgroundColor: c.hex }} title={c.name} />))}</div></div>)}
                  {product.sizes?.length > 1 && (<div className="mb-2"><p className="text-[9px] uppercase tracking-[0.15em] text-paper/40 mb-1">Beden</p><div className="flex flex-wrap gap-1">{product.sizes.filter((s: string) => (product.stockPerSize?.[s] ?? 0) > 0).map((s: string) => (<button key={s} onClick={(e) => { e.stopPropagation(); setQSize(s); }} className={"text-[10px] uppercase px-2 py-0.5 rounded border transition " + (qSize === s ? "border-cyan bg-cyan text-ink" : "border-paper/20 text-paper/60 hover:border-paper/50")}>{s}</button>))}</div></div>)}
                  <button onClick={handleQuickBuy} className="w-full rounded-full bg-crim py-1.5 text-[11px] uppercase tracking-[0.2em] text-ink transition hover:bg-cyan mt-1">{hasDiscount ? "₺" + discPrice : "₺" + product.price} sepete ekle</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Index() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { fetch("/api/products").then((r) => r.json()).then(setProducts); }, []);
  const featured = products.slice(0, 3);
  return (
    <>
      <section className="relative flex min-h-[86vh] flex-col justify-between overflow-hidden">
        <img src={heroImg} alt="Kürek teknesi dalgaları" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div className="relative px-6 pt-10 lg:px-10">
          <h1 className="font-display text-[22vw] leading-[0.82] uppercase tracking-tight md:text-[18vw]">Kürek<br /><span className="text-crim">Kulübü</span></h1>
        </div>
        <div className="relative flex flex-col justify-between gap-8 px-6 pb-10 md:flex-row md:items-end lg:px-10">
          <p className="max-w-md text-lg leading-relaxed text-paper/80">Denizi giyin. Her tişört, bir sabah küreği ve tuzlu rüzgar için tasarlandı.</p>
          <Link to="/shop" className="inline-flex items-center gap-3 rounded-full bg-crim px-8 py-4 font-display text-lg uppercase tracking-wider text-ink transition hover:bg-cyan">Mağazaya gir →</Link>
        </div>
      </section>
      <section className="px-6 py-16 lg:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">— Öne çıkanlar</p><h2 className="font-display text-4xl uppercase md:text-5xl">Öne çıkan tişörtler</h2></div>
          <span className="text-sm text-paper/40">{featured.length} tasarım</span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">{featured.length === 0 ? <p className="col-span-3 text-center text-sm text-paper/40 py-12">Ürünler yükleniyor...</p> : featured.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
        <div className="mt-10 text-center"><Link to="/shop" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-paper/60 transition hover:text-paper">Tüm koleksiyon →</Link></div>
      </section>
      <section className="grid gap-8 px-6 py-16 md:grid-cols-2 lg:px-10">
        <div className="overflow-hidden rounded-lg"><img src={storyFlatlay} alt="Tişört flatlay" loading="lazy" className="h-full w-full object-cover" /></div>
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">— Kulübün hikâyesi</p>
          <h2 className="font-display text-4xl uppercase leading-[0.95] md:text-5xl">Bir kulüp,<br />bir deniz,<br />bir giysi.</h2>
          <p className="mt-6 leading-relaxed text-paper/70">Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır.</p>
          <Link to="/kulup" className="mt-6 text-[11px] uppercase tracking-[0.22em] text-cyan transition hover:text-paper">Hikâyemiz →</Link>
        </div>
      </section>
    </>
  );
}
