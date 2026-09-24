import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const API_BASE = "/api/admin";
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const PREDEFINED_COLORS = [
  { name: "Siyah", hex: "#000000" }, { name: "Beyaz", hex: "#ffffff" },
  { name: "Lacivert", hex: "#17263b" }, { name: "Kırmızı", hex: "#e23a2e" },
  { name: "Yeşil", hex: "#2d6a4f" }, { name: "Mavi", hex: "#12707f" },
  { name: "Gri", hex: "#808080" }, { name: "Krem", hex: "#f3eee2" },
];

function getToken() { try { return localStorage.getItem("admin-token") ?? ""; } catch { return ""; } }

export const Route = createFileRoute("/admin/products/edit")({
  head: () => ({ meta: [{ title: "Ürün Düzenle — Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");
  const [category, setCategory] = useState(""); const [price, setPrice] = useState("");
  const [description, setDescription] = useState(""); const [detail, setDetail] = useState("");
  const [tag, setTag] = useState(""); const [images, setImages] = useState<string[]>([]);
  const [visible, setVisible] = useState(true); // New field for product visibility
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<{ name: string; hex: string }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [stockPerSize, setStockPerSize] = useState<Record<string, string>>({});
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // For image upload status

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/products?t=${token}`).then((r) => r.json()).then((prods) => {
      const p = prods.find((x: any) => x.id === id);
      if (!p) return;
      setName(p.name); setSlug(p.slug); setCategory(p.category);
      setPrice(String(p.price)); setDescription(p.description || "");
      setDetail(p.detail || ""); setTag(p.tag || "");
      setImages(p.images?.length ? p.images : [""]);
      setVisible(p.visible !== false); // Default to true if not specified

      const colorNames = p.colors?.map((c: any) => c.name) ?? [];
      const predefColors = colorNames.filter((n: string) => PREDEFINED_COLORS.some((pc) => pc.name === n));
      const custColors = (p.colors ?? []).filter((c: any) => !PREDEFINED_COLORS.some((pc) => pc.name === c.name));
      setSelectedColors(predefColors);
      setCustomColors(custColors);

      const sizes = p.sizes ?? [];
      setSelectedSizes(sizes);
      const sps: Record<string, string> = {};
      for (const s of sizes) sps[s] = String(p.stockPerSize?.[s] ?? "0");
      setStockPerSize(sps);

      if (p.discount) { setDiscountEnabled(true); setDiscountType(p.discount.type); setDiscountValue(String(p.discount.value)); }
      setLoading(false);
    });
  }, [id]);

  const toggleColor = (name: string) => setSelectedColors((p) => p.includes(name) ? p.filter((c) => c !== name) : [...p, name]);
  const addCustomColor = () => setCustomColors([...customColors, { name: "", hex: "#000000" }]);
  const updCustomColor = (i: number, f: "name" | "hex", v: string) => { const n = [...customColors]; n[i] = { ...n[i]!, [f]: v }; setCustomColors(n); };
  const toggleSize = (size: string) => {
    setSelectedSizes((p) => {
      if (p.includes(size)) { const { [size]: _, ...r } = stockPerSize; setStockPerSize(r); return p.filter((s) => s !== size); }
      setStockPerSize((s) => ({ ...s, [size]: "0" })); return [...p, size];
    });
  };
  const addImage = () => setImages([...images, ""]);
  const remImage = (i: number) => setImages(images.filter((_, idx) => idx !== i));
  const updImage = (i: number, v: string) => { const n = [...images]; n[i] = v; setImages(n); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); const token = getToken();
    const allColors = [
      ...selectedColors.map((n) => ({ name: n, hex: PREDEFINED_COLORS.find((c) => c.name === n)?.hex ?? "#000000" })),
      ...customColors.filter((c) => c.name.trim()),
    ];
    const sps: Record<string, number> = {};
    for (const size of selectedSizes) { const v = parseInt(stockPerSize[size] || "0", 10); if (v > 0) sps[size] = v; }
    await fetch(`${API_BASE}/products/${id}?t=${token}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug, name, price: Number(price), images: images.filter((i) => i.trim()),
        description, detail, category, tag: tag || null,
        colors: allColors, sizes: selectedSizes, stockPerSize: sps,
        discount: discountEnabled && Number(discountValue) > 0 ? { type: discountType, value: Number(discountValue) } : null,
      }),
    });
    setSaving(false); router.navigate({ to: "/admin/dashboard" });
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    const token = getToken();
    await fetch(`${API_BASE}/products/${id}?t=${token}`, { method: "DELETE" });
    router.navigate({ to: "/admin/dashboard" });
  };

  const discPrice = discountEnabled && Number(discountValue) > 0 && Number(price) > 0
    ? (() => { const p = Number(price); const v = Number(discountValue); return discountType === "percentage" ? Math.round(p * (1 - v / 100)) : Math.max(0, p - v); })()
    : null;

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-ink text-paper"><p className="text-paper/50">Yükleniyor...</p></div>;

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="flex items-center justify-between border-b border-paper/15 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3"><span className="size-2.5 rounded-full bg-crim" /><span className="font-display text-lg tracking-wide">Ürün Düzenle</span></div>
        <button onClick={() => router.navigate({ to: "/admin/dashboard" })} className="text-[11px] uppercase tracking-[0.18em] text-paper/50 transition hover:text-paper">← Geri</button>
      </header>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-6 py-8 lg:px-10 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Ürün Adı *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required /></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Slug</label><input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required /></div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Fiyat (₺) *</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" required min="0" /></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Kategori</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper outline-none transition focus:border-cyan"><option value="tisort">Tişört</option><option value="bros">Broş</option><option value="sapka">Şapka</option><option value="tayt">Tayt</option><option value="aksesuar">Aksesuar</option></select></div>
          <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Etiket</label><input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Yeni, Sınırlı, İndirim..." className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" /></div>
        </div>
        <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Kısa Açıklama</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" /></div>
        <div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Detaylı Açıklama</label><textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan" /></div>

        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Ürün Görselleri (URL)</label>
          {images.map((img, i) => (<div key={i} className="mb-2 flex items-center gap-2"><input type="text" value={img} onChange={(e) => updImage(i, e.target.value)} placeholder="https://..." className="flex-1 rounded-lg border border-paper/20 bg-transparent px-4 py-2 text-sm text-paper outline-none transition focus:border-cyan" />{images.length > 1 && <button type="button" onClick={() => remImage(i)} className="text-crim text-xs">✕</button>}</div>))}
          <button type="button" onClick={addImage} className="text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:text-paper">+ Görsel ekle</button>
        </div>

        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Renkler</label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_COLORS.map((c) => (<label key={c.name} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${selectedColors.includes(c.name) ? "border-cyan bg-cyan/10 text-cyan" : "border-paper/20 text-paper/60 hover:border-paper/50"}`}><input type="checkbox" checked={selectedColors.includes(c.name)} onChange={() => toggleColor(c.name)} className="sr-only" /><span className="inline-block size-3 rounded-full" style={{ backgroundColor: c.hex }} />{c.name}</label>))}
          </div>
          {customColors.map((c, i) => (<div key={i} className="mt-2 flex items-center gap-2"><input type="text" value={c.name} onChange={(e) => updCustomColor(i, "name", e.target.value)} placeholder="Renk adı" className="w-32 rounded-lg border border-paper/20 bg-transparent px-3 py-1.5 text-xs text-paper outline-none focus:border-cyan" /><input type="color" value={c.hex} onChange={(e) => updCustomColor(i, "hex", e.target.value)} className="size-8 cursor-pointer rounded border border-paper/20 bg-transparent" /><button type="button" onClick={() => setCustomColors(customColors.filter((_, idx) => idx !== i))} className="text-crim text-xs">✕</button></div>))}
          <button type="button" onClick={addCustomColor} className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:text-paper">+ Özel renk ekle</button>
        </div>

        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-paper/50">Bedenler ve Stok Adetleri</label>
          <div className="flex flex-wrap gap-2">{ALL_SIZES.map((size) => { const sel = selectedSizes.includes(size); return (<div key={size} className={`rounded-lg border p-2 transition ${sel ? "border-cyan bg-cyan/5" : "border-paper/20 opacity-60"}`}><label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={sel} onChange={() => toggleSize(size)} className="accent-crim" />{size}</label>{sel && <input type="number" min="0" value={stockPerSize[size] || "0"} onChange={(e) => setStockPerSize((s) => ({ ...s, [size]: e.target.value }))} className="mt-1 w-full rounded border border-paper/20 bg-transparent px-2 py-1 text-xs text-center text-paper outline-none focus:border-cyan" placeholder="Adet" />}</div>); })}</div>
        </div>

        <div className="rounded-lg border border-crim/30 bg-crim/5 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={discountEnabled} onChange={() => setDiscountEnabled(!discountEnabled)} className="accent-crim" /><span className="text-[11px] uppercase tracking-[0.18em] text-crim">İndirim uygula</span></label>
          {discountEnabled && (<div className="mt-3 flex items-center gap-3 flex-wrap"><select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")} className="rounded-lg border border-paper/20 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"><option value="percentage">% Yüzde</option><option value="fixed">₺ Sabit</option></select><input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "İndirim %" : "İndirim ₺"} className="w-32 rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan" />{discPrice !== null && (<div className="flex items-center gap-2 text-sm"><span className="text-paper/40 line-through">₺{Number(price)}</span><span className="font-display text-crim font-bold">₺{discPrice}</span></div>)}</div>)}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="rounded-full bg-crim px-8 py-3 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50">{saving ? "Kaydediliyor..." : "Güncelle"}</button>
          <button type="button" onClick={handleDelete} className="rounded-full border border-crim/50 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-crim transition hover:bg-crim hover:text-ink">Sil</button>
          <button type="button" onClick={() => router.navigate({ to: "/admin/dashboard" })} className="rounded-full border border-paper/20 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-paper/50 transition hover:text-paper">İptal</button>
        </div>
      </form>
    </div>
  );
}
