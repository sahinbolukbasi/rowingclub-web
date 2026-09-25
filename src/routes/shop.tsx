import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Mağaza — Kürek Kulübü" },
      {
        name: "description",
        content: "Deniz küreği temalı tişört, sweatshirt, şapka ve aksesuarlar. Organik pamuk, sınırlı baskı.",
      },
      { property: "og:title", content: "Mağaza — Kürek Kulübü" },
      { property: "og:description", content: "Deniz küreği temalı özel koleksiyon." },
    ],
  }),
  component: ShopPage,
});

function calcDiscountedPrice(price: number, discount: any): number {
  if (!discount || discount.value <= 0) return price;
  return discount.type === "percentage"
    ? Math.round(price * (1 - discount.value / 100))
    : Math.max(0, price - discount.value);
}

function totalStock(p: any): number {
  if (p.stockPerSize)
    return Object.values(p.stockPerSize as Record<string, number>).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0
    );
  return p.stock || 0;
}

const CATEGORIES = [
  { id: "all", label: "TÜM ÜRÜNLER" },
  { id: "tisort", label: "TİŞÖRT" },
  { id: "sweatshirt", label: "SWEATSHIRT & HOODIE" },
  { id: "sapka", label: "ŞAPKA & BERE" },
  { id: "aksesuar", label: "AKSESUAR" },
];

const SORT_OPTIONS = [
  { id: "featured", label: "Öne çıkan" },
  { id: "price-asc", label: "Fiyat: düşük → yüksek" },
  { id: "price-desc", label: "Fiyat: yüksek → düşük" },
  { id: "name-asc", label: "İsme göre" },
];

const TAG_OPTIONS = [
  { id: "all", label: "Tümü" },
  { id: "YENİ", label: "YENİ" },
  { id: "SINIRLI", label: "SINIRLI" },
];

const COLOR_OPTIONS = [
  { name: "Lacivert", hex: "#17263b" },
  { name: "Krem", hex: "#f3eee2" },
  { name: "Teal", hex: "#12707f" },
  { name: "Kum", hex: "#d4c5b9" },
  { name: "Beyaz", hex: "#ffffff" },
  { name: "Crimson", hex: "#e23a2e" },
  { name: "Siyah", hex: "#000000" },
  { name: "Yeşil", hex: "#2d6a4f" },
  { name: "Mavi", hex: "#1d4ed8" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

function ProductCard({ product }: { product: any }) {
  const { addItem, open: openCart } = useCart();
  const hasDiscount = product.discount && product.discount.value > 0;
  const discPrice = calcDiscountedPrice(product.price, product.discount);
  const isOutOfStock =
    product.isClosed === true || (product.stockPerSize && totalStock(product) === 0);
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
      <Link to="/product/$slug" params={{ slug: product.slug }}>
        <div className="relative overflow-hidden rounded-xl bg-teal/20 border border-paper/10">
          <img
            src={product.images?.[0] || product.image || ""}
            alt={product.name}
            loading="lazy"
            className={`aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? "grayscale-[40%]" : ""
            }`}
          />
          {product.tag && (
            <span className="absolute left-3 top-3 rounded-full bg-crim px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-ink font-bold shadow-md">
              {product.tag}
            </span>
          )}
          {isOutOfStock ? (
            <span className="absolute right-3 top-3 rounded-full bg-crim px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper shadow-md">
              STOK YOK
            </span>
          ) : hasDiscount ? (
            <span className="absolute right-3 top-3 rounded-full bg-crim px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-md">
              %{product.discount.value} İndirim
            </span>
          ) : null}
        </div>
      </Link>
      <div className="mt-4 flex items-baseline justify-between">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="font-display text-xl uppercase tracking-wide group-hover:text-cyan transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="text-right">
          {hasDiscount ? (
            <>
              <span className="text-xs text-paper/40 line-through block font-mono">
                ₺{product.price}
              </span>
              <span className="text-sm text-crim font-bold font-mono">₺{discPrice}</span>
            </>
          ) : (
            <span className="text-sm text-cyan font-bold font-mono">₺{product.price}</span>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-paper/60 line-clamp-2">{product.description}</p>
      {isOutOfStock ? (
        <div className="mt-3 flex gap-2">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="flex-1 rounded-full border border-paper/20 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-paper/70 transition hover:border-paper/50"
          >
            İncele
          </Link>
          <span className="flex-1 rounded-full border border-crim/40 bg-crim/10 py-2 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-crim">
            Stok Yok
          </span>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="flex-1 rounded-full border border-paper/20 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-paper/70 transition hover:border-paper/50"
          >
            İncele
          </Link>
          <div className="relative flex-1">
            <button
              onClick={() => setShowQuickBuy(!showQuickBuy)}
              className="w-full rounded-full bg-crim py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-ink transition hover:bg-cyan shadow-md cursor-pointer"
            >
              Hızlı al
            </button>
            {showQuickBuy && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickBuy(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl border border-paper/20 bg-ink p-4 shadow-2xl shadow-ink/90 min-w-[200px]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-paper/50 mb-2">
                    {hasDiscount ? (
                      <>
                        ₺{discPrice} <span className="line-through text-paper/30">₺{product.price}</span>
                      </>
                    ) : (
                      `₺${product.price}`
                    )}
                  </p>
                  {product.colors?.length > 1 && (
                    <div className="mb-2">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-paper/40 mb-1">Renk</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {product.colors.map((c: any) => (
                          <button
                            key={c.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setQColor(c.name);
                            }}
                            className={`size-5 rounded-full border-2 transition ${
                              qColor === c.name ? "border-cyan ring-1 ring-cyan/40 scale-110" : "border-paper/30"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {product.sizes?.length > 1 && (
                    <div className="mb-2">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-paper/40 mb-1">Beden</p>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes
                          .filter((s: string) => (product.stockPerSize?.[s] ?? 1) > 0)
                          .map((s: string) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                setQSize(s);
                              }}
                              className={`text-[10px] uppercase px-2 py-0.5 rounded border transition ${
                                qSize === s
                                  ? "border-cyan bg-cyan text-ink font-bold"
                                  : "border-paper/20 text-paper/60 hover:border-paper/50"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleQuickBuy}
                    className="w-full rounded-full bg-crim py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink transition hover:bg-cyan mt-2 shadow-lg cursor-pointer"
                  >
                    {hasDiscount ? `₺${discPrice} sepete ekle` : `₺${product.price} sepete ekle`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selCategory, setSelCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [selTag, setSelTag] = useState("all");
  const [selColor, setSelColor] = useState("");
  const [selSize, setSelSize] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((e) => console.error("Error loading shop products:", e))
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    // Category
    if (selCategory !== "all") {
      const pCat = String(p.category || "").toLowerCase();
      const pName = String(p.name || "").toLowerCase();
      if (selCategory === "tisort") {
        if (pCat !== "tisort" && !pName.includes("tişört") && !pName.includes("t-shirt")) return false;
      } else if (selCategory === "sweatshirt") {
        if (pCat !== "sweatshirt" && !pName.includes("sweatshirt") && !pName.includes("hoodie")) return false;
      } else if (selCategory === "sapka") {
        if (pCat !== "sapka" && !pName.includes("şapka") && !pName.includes("bere") && !pName.includes("cap")) return false;
      } else if (selCategory === "aksesuar") {
        if (pCat !== "aksesuar" && !pName.includes("aksesuar") && !pName.includes("çorap") && !pName.includes("çanta")) return false;
      } else if (pCat !== selCategory) {
        return false;
      }
    }

    // Tag
    if (selTag !== "all") {
      if (p.tag !== selTag) return false;
    }

    // Color
    if (selColor) {
      const colors = p.colors ?? [];
      const hasColor = colors.some(
        (c: any) =>
          String(c.name).toLowerCase().trim() === selColor.toLowerCase().trim()
      );
      if (!hasColor) return false;
    }

    // Size
    if (selSize) {
      const sizes = p.sizes ?? [];
      if (!sizes.includes(selSize)) return false;
    }

    return true;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = calcDiscountedPrice(a.price, a.discount);
    const priceB = calcDiscountedPrice(b.price, b.discount);

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "name-asc") return a.name.localeCompare(b.name, "tr");
    // Default featured: closed last, featured first
    if (a.isClosed !== b.isClosed) return a.isClosed ? 1 : -1;
    if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
    return 0;
  });

  const activeFilterCount =
    (selCategory !== "all" ? 1 : 0) +
    (sortBy !== "featured" ? 1 : 0) +
    (selTag !== "all" ? 1 : 0) +
    (selColor ? 1 : 0) +
    (selSize ? 1 : 0);

  const resetFilters = () => {
    setSelCategory("all");
    setSortBy("featured");
    setSelTag("all");
    setSelColor("");
    setSelSize("");
  };

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.id === selCategory)?.label ?? "TÜM ÜRÜNLER";

  return (
    <section className="px-6 py-12 lg:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-cyan">— KOLEKSİYON</p>
          <h1 className="font-display text-4xl uppercase md:text-6xl tracking-tight">
            {selCategory === "all" ? "TÜM ÜRÜNLER" : selectedCategoryLabel}
          </h1>
          <p className="mt-2 max-w-md text-sm text-paper/60 leading-relaxed">
            Her ürün organik pamuktan, küçük partiler halinde basılmıştır. Stok bitince yenilenene kadar bekleyin.
          </p>
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2.5 rounded-full border px-6 py-3 font-display text-xs uppercase tracking-[0.18em] transition-all shadow-lg cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? "border-cyan bg-cyan/15 text-cyan font-bold"
                : "border-paper/20 bg-ink/60 text-paper/80 hover:border-paper/50 hover:text-paper"
            }`}
          >
            <span>🎛️ FİLTRELE {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>
            <span className="text-xs transition-transform duration-300">
              {showFilters ? "▲" : "▼"}
            </span>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs uppercase tracking-wider text-crim hover:underline cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Category Quick Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 border-b border-paper/15 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelCategory(cat.id)}
            className={`rounded-full px-4 py-2 text-xs font-display uppercase tracking-[0.18em] transition whitespace-nowrap cursor-pointer ${
              selCategory === cat.id
                ? "bg-crim text-ink font-bold shadow-md"
                : "border border-paper/15 text-paper/60 hover:border-paper/40 hover:text-paper"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid + Filter Panel Layout */}
      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* Collapsible Filter Sidebar matching the user's design image */}
        {showFilters && (
          <aside className="lg:col-span-1 rounded-2xl border border-paper/15 bg-ink/70 p-6 shadow-2xl space-y-6 backdrop-blur-md sticky top-24">
            <div className="flex items-center justify-between border-b border-paper/15 pb-3">
              <h2 className="font-display text-xl uppercase tracking-wider text-paper">
                FİLTRELE
              </h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] uppercase tracking-wider text-crim hover:underline font-bold cursor-pointer"
                >
                  Temizle ✕
                </button>
              )}
            </div>

            {/* SIRALA */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-3">
                SIRALA
              </p>
              <div className="space-y-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={`flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs text-left transition cursor-pointer ${
                      sortBy === opt.id
                        ? "bg-paper/10 text-paper font-semibold border border-cyan/40"
                        : "text-paper/60 hover:text-paper"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && (
                      <span className="size-2 rounded-full bg-cyan shadow-[0_0_8px_#12707f]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ETİKET */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-3">
                ETİKET
              </p>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wider font-semibold border transition cursor-pointer ${
                      selTag === tag.id
                        ? "border-crim bg-crim/20 text-crim"
                        : "border-paper/20 bg-ink/40 text-paper/60 hover:border-paper/40 hover:text-paper"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RENK */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-3">
                RENK
              </p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelColor(isSelected ? "" : c.name)}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition cursor-pointer ${
                        isSelected
                          ? "border-cyan bg-cyan/20 text-cyan shadow-md"
                          : "border-paper/20 bg-ink/40 text-paper/70 hover:border-paper/40"
                      }`}
                    >
                      <span
                        className="size-3 rounded-full border border-paper/30 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BEDEN */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-3">
                BEDEN
              </p>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((s) => {
                  const isSelected = selSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSelSize(isSelected ? "" : s)}
                      className={`flex size-10 items-center justify-center rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                        isSelected
                          ? "border-crim bg-crim text-ink shadow-md"
                          : "border-paper/20 bg-ink/40 text-paper/70 hover:border-paper/40"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Product Grid Area */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          <div className="mb-4 flex items-center justify-between text-xs text-paper/50 border-b border-paper/10 pb-3">
            <span className="font-mono uppercase tracking-wider font-semibold">
              {sortedProducts.length} ÜRÜN BULUNDU
            </span>
            {activeFilterCount > 0 && (
              <span className="text-cyan font-bold">
                Aktif Filtre: {activeFilterCount}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <p className="text-paper/50 animate-pulse">Ürünler yükleniyor...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center p-8 rounded-2xl border border-paper/15 bg-ink/40">
              <span className="text-4xl mb-3">🔍</span>
              <h3 className="font-display text-2xl uppercase text-paper mb-2">
                Filtrelere Uygun Ürün Bulunamadı
              </h3>
              <p className="text-xs text-paper/60 max-w-sm mb-4">
                Seçtiğiniz filtre kombinasyonuna ait ürün bulunmuyor. Filtreleri temizleyerek tüm koleksiyonu inceleyebilirsiniz.
              </p>
              <button
                onClick={resetFilters}
                className="rounded-full bg-crim px-6 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-ink transition hover:bg-cyan cursor-pointer"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-6 sm:grid-cols-2 ${
                showFilters ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {sortedProducts.map((product) => (
                <ProductCard key={product.slug || product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
