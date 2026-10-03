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
      { property: "og:description", content: "Deniz küreği temalı tişört ve giyim koleksiyonu." },
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
  { id: "all", label: "Tüm Ürünler" },
  { id: "tisort", label: "Tişört" },
  { id: "sweatshirt", label: "Sweatshirt & Hoodie" },
  { id: "sapka", label: "Şapka & Bere" },
  { id: "aksesuar", label: "Aksesuar" },
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
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

function ProductCard({ product, compact = false }: { product: any; compact?: boolean }) {
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
        <div className="relative overflow-hidden rounded-lg bg-teal/20">
          <img
            src={product.images?.[0] || product.image || ""}
            alt={product.name}
            loading="lazy"
            className={`aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? "grayscale-[40%]" : ""
            }`}
          />
          {product.tag && (
            <span
              className={`absolute left-2.5 top-2.5 rounded-full bg-crim uppercase tracking-[0.18em] text-ink font-bold shadow-md ${
                compact ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]"
              }`}
            >
              {product.tag}
            </span>
          )}
          {isOutOfStock ? (
            <span
              className={`absolute right-2.5 top-2.5 rounded-full bg-crim font-bold uppercase tracking-[0.18em] text-paper shadow-md ${
                compact ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]"
              }`}
            >
              STOK YOK
            </span>
          ) : hasDiscount ? (
            <span
              className={`absolute right-2.5 top-2.5 rounded-full bg-crim uppercase tracking-[0.18em] text-white font-bold shadow-md ${
                compact ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]"
              }`}
            >
              %{product.discount.value} İndirim
            </span>
          ) : null}
        </div>
      </Link>

      <div className={`flex items-baseline justify-between gap-1.5 ${compact ? "mt-2.5" : "mt-4"}`}>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="min-w-0">
          <h3
            className={`font-display uppercase transition-colors group-hover:text-cyan truncate ${
              compact ? "text-xs sm:text-sm font-semibold" : "text-xl"
            }`}
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>
        <div className="text-right shrink-0">
          {hasDiscount ? (
            <>
              <span
                className={`text-paper/40 line-through block ${
                  compact ? "text-[10px]" : "text-sm"
                }`}
              >
                ₺{product.price}
              </span>
              <span className={`text-crim font-bold ${compact ? "text-xs" : "text-sm"}`}>
                ₺{discPrice}
              </span>
            </>
          ) : (
            <span className={`text-cyan font-bold ${compact ? "text-xs" : "text-sm"}`}>
              ₺{product.price}
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <p className="mt-1 text-sm text-paper/60 line-clamp-2">{product.description}</p>
      )}

      {isOutOfStock ? (
        <div className={`flex gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className={`flex-1 rounded-full border border-paper/20 text-center uppercase tracking-[0.2em] text-paper/70 transition hover:border-paper/50 ${
              compact ? "py-1 text-[9px]" : "py-2 text-[11px]"
            }`}
          >
            İncele
          </Link>
          <span
            className={`flex-1 rounded-full border border-crim/40 bg-crim/10 text-center font-bold uppercase tracking-[0.2em] text-crim ${
              compact ? "py-1 text-[9px]" : "py-2 text-[11px]"
            }`}
          >
            Stok Yok
          </span>
        </div>
      ) : (
        <div className={`flex gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className={`flex-1 rounded-full border border-paper/20 text-center uppercase tracking-[0.2em] text-paper/70 transition hover:border-paper/50 ${
              compact ? "py-1 text-[9px]" : "py-2 text-[11px]"
            }`}
          >
            İncele
          </Link>
          <div className="relative flex-1">
            <button
              onClick={() => setShowQuickBuy(!showQuickBuy)}
              className={`w-full rounded-full bg-crim uppercase tracking-[0.2em] text-ink transition hover:bg-cyan font-bold cursor-pointer ${
                compact ? "py-1 text-[9px]" : "py-2 text-[11px]"
              }`}
            >
              Hızlı al
            </button>

            {showQuickBuy && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickBuy(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-lg border border-paper/15 bg-ink p-3 shadow-xl shadow-ink/80 min-w-[180px]">
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
                              qColor === c.name ? "border-cyan ring-1 ring-cyan/30" : "border-paper/30"
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
                          .filter((s: string) => (product.stockPerSize?.[s] ?? 0) > 0)
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
                    className="w-full rounded-full bg-crim py-1.5 text-[11px] uppercase tracking-[0.2em] text-ink transition hover:bg-cyan mt-1 cursor-pointer font-bold"
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
  const [categories, setCategories] = useState<any[]>(CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [viewMode, setViewMode] = useState<"3" | "6">("3");
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
      .catch((e) => console.error("Error loading products:", e))
      .finally(() => setLoading(false));

    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch((e) => console.error("Error loading categories:", e));
  }, []);

  // Filtering Logic
  const filteredProducts = products.filter((p) => {
    // Category Filter
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

    // Tag Filter
    if (selTag !== "all" && p.tag !== selTag) return false;

    // Color Filter
    if (selColor) {
      const colors = p.colors ?? [];
      const hasColor = colors.some(
        (c: any) => String(c.name).toLowerCase().trim() === selColor.toLowerCase().trim()
      );
      if (!hasColor) return false;
    }

    // Size Filter
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

  const getCategoryTitle = () => {
    if (selCategory === "all") return "Tüm ürünler";
    const found = categories.find((c) => c.id === selCategory);
    return found ? found.label : "Tüm ürünler";
  };

  return (
    <section className="px-6 py-12 lg:px-10">
      {/* Original Header Restored */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">— Koleksiyon</p>
          <h1 className="font-display text-4xl uppercase md:text-6xl">{getCategoryTitle()}</h1>
          <p className="mt-3 max-w-md text-sm text-paper/60">
            Her ürün organik pamuktan, küçük partiler halinde üretilmiştir. Stok bitince yenilenene kadar bekleyin.
          </p>
        </div>

        {/* Filter Toggle & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Görünüm Seçenekleri (3'lü ve 6'lı Görünüm) */}
          <div className="flex items-center rounded-full border border-paper/20 bg-ink/60 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("3")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-display uppercase tracking-wider transition cursor-pointer ${
                viewMode === "3"
                  ? "bg-cyan/20 text-cyan border border-cyan/40 font-bold shadow-sm"
                  : "text-paper/50 hover:text-paper hover:bg-paper/5"
              }`}
              title="3'lü Görünüm"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <rect x="2" y="3" width="5.5" height="18" rx="1" />
                <rect x="9.25" y="3" width="5.5" height="18" rx="1" />
                <rect x="16.5" y="3" width="5.5" height="18" rx="1" />
              </svg>
              <span>3'lü</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("6")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-display uppercase tracking-wider transition cursor-pointer ${
                viewMode === "6"
                  ? "bg-cyan/20 text-cyan border border-cyan/40 font-bold shadow-sm"
                  : "text-paper/50 hover:text-paper hover:bg-paper/5"
              }`}
              title="6'lı Görünüm"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <rect x="1.5" y="3" width="2.5" height="18" rx="0.5" />
                <rect x="5.2" y="3" width="2.5" height="18" rx="0.5" />
                <rect x="8.9" y="3" width="2.5" height="18" rx="0.5" />
                <rect x="12.6" y="3" width="2.5" height="18" rx="0.5" />
                <rect x="16.3" y="3" width="2.5" height="18" rx="0.5" />
                <rect x="20" y="3" width="2.5" height="18" rx="0.5" />
              </svg>
              <span>6'lı</span>
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2.5 rounded-full border px-6 py-2.5 font-display text-xs uppercase tracking-[0.18em] transition cursor-pointer shadow-md ${
              showFilters || activeFilterCount > 0
                ? "border-cyan bg-cyan/15 text-cyan font-bold"
                : "border-paper/20 bg-ink/60 text-paper/80 hover:border-paper/50 hover:text-paper"
            }`}
          >
            <span>Filtrele & Sırala {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>
            <span className="text-xs">{showFilters ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-3 border-b border-paper/15 no-scrollbar">
        {categories.map((cat) => (
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

      {/* Expandable Filter Box (Shown when toggled open, does not squeeze the original 3-column product grid) */}
      {showFilters && (
        <div className="mb-10 rounded-2xl border border-paper/15 bg-ink/80 p-6 shadow-2xl space-y-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-paper/15 pb-3">
            <h2 className="font-display text-lg uppercase tracking-wider text-paper flex items-center gap-2">
              <span>Detaylı Filtreler</span>
              <span className="text-xs text-paper/50 font-normal">({sortedProducts.length} ürün listeleniyor)</span>
            </h2>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs uppercase tracking-wider text-crim hover:underline font-bold cursor-pointer"
              >
                Tüm Filtreleri Temizle ✕
              </button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* SIRALAMA */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-2.5">
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-2.5">
                ETİKET
              </p>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelTag(tag.id)}
                    className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold border transition cursor-pointer ${
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-2.5">
                RENK
              </p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelColor(isSelected ? "" : c.name)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border transition cursor-pointer ${
                        isSelected
                          ? "border-cyan bg-cyan/20 text-cyan shadow-md"
                          : "border-paper/20 bg-ink/40 text-paper/70 hover:border-paper/40"
                      }`}
                    >
                      <span
                        className="size-3 rounded-full border border-paper/30 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BEDEN */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50 font-semibold mb-2.5">
                BEDEN
              </p>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((s) => {
                  const isSelected = selSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSelSize(isSelected ? "" : s)}
                      className={`flex size-9 items-center justify-center rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
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
          </div>
        </div>
      )}

      {/* Original Product Grid Restored (grid gap-6 sm:grid-cols-2 lg:grid-cols-3) */}
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
            Seçtiğiniz filtre kriterlerine uygun ürün bulunmuyor. Filtreleri sıfırlayarak tüm koleksiyonu inceleyebilirsiniz.
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
          className={
            viewMode === "6"
              ? "grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.slug || product.id}
              product={product}
              compact={viewMode === "6"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
