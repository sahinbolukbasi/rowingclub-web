import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const ADMIN_TOKEN = "admin-token-kurek-kulubu";
const API_BASE = "/api/admin";
function getToken() { try { return localStorage.getItem("admin-token") ?? ""; } catch { return ""; } }
async function apiGet(path: string) { const res = await fetch(`${API_BASE}${path}?t=${getToken()}&_=${Date.now()}`); if (!res.ok) throw new Error(await res.text()); return res.json(); }
async function apiPost(path: string) { const res = await fetch(`${API_BASE}${path}?t=${getToken()}&_=${Date.now()}`, { method: "POST" }); if (!res.ok) throw new Error(await res.text()); return res.json(); }

const STATUS_MAP: Record<string, string> = { pending: "Bekliyor", paid: "Ödendi", preparing: "Hazırlanıyor", shipped: "Kargoda", delivered: "Teslim Edildi", cancelled: "İptal" };
const STATUS_COLORS: Record<string, string> = { pending: "bg-yellow-500/20 text-yellow-400", paid: "bg-green-500/20 text-green-400", preparing: "bg-blue-500/20 text-blue-400", shipped: "bg-cyan/20 text-cyan", delivered: "bg-emerald-500/20 text-emerald-400", cancelled: "bg-crim/20 text-crim" };

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Panel — Kürek Kulübü" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminDashboard,
});

function useAdminAuth() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token === ADMIN_TOKEN) setAuthed(true);
    else { localStorage.removeItem("admin-token"); router.navigate({ to: "/admin" }); }
  }, []);
  return authed;
}

function AdminDashboard() {
  const authed = useAdminAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tab, setTab] = useState<"products" | "orders" | "contacts">("products");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authed) return;
    apiGet("/products").then(setProducts).catch((e) => setError(e.message));
    apiGet("/orders").then(setOrders).catch((e) => setError(e.message));
    apiGet("/contacts").then(setContacts).catch((e) => setError(e.message));
  }, [authed]);

  const handleSeed = async () => {
    setSeeding(true); setError("");
    try {
      const res = await apiPost("/seed");
      const result = await res.json();
      if (result.seeded) {
        const prods = await apiGet("/products");
        setProducts(prods);
      } else {
        setError("Ürünler zaten yüklenmiş. Önce mevcut ürünleri silin.");
      }
    } catch (e: any) { setError(e.message); }
    setSeeding(false);
  };

  const handleLogout = () => { localStorage.removeItem("admin-token"); router.navigate({ to: "/admin" }); };
  if (!authed) return null;

  const totalRevenue = orders.reduce((s: number, o: any) => s + o.total, 0);
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const unreadContacts = contacts.filter((c: any) => !c.read).length;

  const totalStock = (p: any) => p.stockPerSize ? Object.values(p.stockPerSize as Record<string, number>).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : (p.stock || 0);

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="flex items-center justify-between border-b border-paper/15 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3"><span className="size-2.5 rounded-full bg-crim" /><span className="font-display text-lg tracking-wide">Admin Panel</span></div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[11px] uppercase tracking-[0.18em] text-paper/50 transition hover:text-paper">Siteye dön</Link>
          <button onClick={handleLogout} className="rounded-full border border-paper/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-paper/60 transition hover:border-crim hover:text-crim">Çıkış</button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 px-6 py-6 lg:grid-cols-5 lg:px-10">
        <div className="rounded-lg border border-paper/15 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Ürünler</p><p className="mt-1 font-display text-2xl">{products.length}</p></div>
        <div className="rounded-lg border border-paper/15 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Siparişler</p><p className="mt-1 font-display text-2xl">{orders.length}</p></div>
        <div className="rounded-lg border border-paper/15 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Bekleyen</p><p className="mt-1 font-display text-2xl text-crim">{pendingOrders}</p></div>
        <div className="rounded-lg border border-paper/15 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Toplam Gelir</p><p className="mt-1 font-display text-2xl text-cyan">₺{totalRevenue}</p></div>
        <div className="rounded-lg border border-paper/15 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Mesajlar</p><p className="mt-1 font-display text-2xl">{unreadContacts > 0 ? <span className="text-crim">{unreadContacts}</span> : contacts.length}</p></div>
      </section>

      <div className="flex gap-4 border-b border-paper/15 px-6 lg:px-10">
        {(["products","orders","contacts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-[11px] uppercase tracking-[0.22em] transition ${tab === t ? "border-b-2 border-crim text-paper" : "text-paper/50 hover:text-paper"}`}>
            {t === "products" ? "Ürünler" : t === "orders" ? "Siparişler" : "Mesajlar"}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <section className="px-6 py-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl uppercase">Ürünler</h2>
            <div className="flex gap-2">
              {products.length === 0 && <button onClick={handleSeed} disabled={seeding} className="rounded-full border border-cyan/50 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:bg-cyan hover:text-ink">{seeding ? "Yükleniyor..." : "Örnek ürünleri yükle"}</button>}
              <Link to="/admin/products/new" className="rounded-full bg-crim px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink transition hover:bg-cyan">+ Yeni ürün</Link>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center"><p className="text-sm text-paper/50">Henüz ürün eklenmemiş.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50"><th className="pb-3 pr-4">Ürün</th><th className="pb-3 pr-4">Kategori</th><th className="pb-3 pr-4">Fiyat</th><th className="pb-3 pr-4">İndirimli</th><th className="pb-3 pr-4">Stok</th><th className="pb-3 pr-4">Etiket</th><th className="pb-3">İşlem</th></tr></thead>
                <tbody>{products.map((p: any) => (
                  <tr key={p.id} className="border-b border-paper/10">
                    <td className="py-3 pr-4 font-display uppercase">{p.name}</td>
                    <td className="py-3 pr-4 text-paper/60">{p.category}</td>
                    <td className="py-3 pr-4">{p.discount ? <span className="text-paper/40 line-through">₺{p.price}</span> : <span className="text-cyan">₺{p.price}</span>}</td>
                    <td className="py-3 pr-4">{p.discount ? <span className="text-crim font-bold">₺{(() => { const v = Number(p.discount.value); return p.discount.type === "percentage" ? Math.round(p.price * (1 - v / 100)) : Math.max(0, p.price - v); })()}</span> : <span className="text-paper/40">—</span>}</td>
                    <td className="py-3 pr-4">{totalStock(p)}</td>
                    <td className="py-3 pr-4">{p.tag ? <span className="rounded-full bg-crim/20 px-2 py-0.5 text-[10px] uppercase text-crim">{p.tag}</span> : <span className="text-paper/40">—</span>}</td>
                    <td className="py-3"><Link to="/admin/products/$id/edit" params={{ id: p.id }} className="text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:text-paper">Düzenle</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <section className="px-6 py-6 lg:px-10">
          <h2 className="mb-4 font-display text-xl uppercase">Siparişler</h2>
          {orders.length === 0 ? <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center"><p className="text-sm text-paper/50">Henüz sipariş yok.</p></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50"><th className="pb-3 pr-4">Sipariş</th><th className="pb-3 pr-4">Müşteri</th><th className="pb-3 pr-4">Tutar</th><th className="pb-3 pr-4">Durum</th><th className="pb-3 pr-4">Tarih</th><th className="pb-3">İşlem</th></tr></thead>
                <tbody>{orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-paper/10">
                    <td className="py-3 pr-4 font-mono text-xs">{o.id}</td>
                    <td className="py-3 pr-4">{o.customerName}</td>
                    <td className="py-3 pr-4 text-cyan">₺{o.total}</td>
                    <td className="py-3 pr-4"><span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${STATUS_COLORS[o.status] ?? "bg-yellow-500/20 text-yellow-400"}`}>{STATUS_MAP[o.status] ?? o.status}</span></td>
                    <td className="py-3 pr-4 text-paper/60">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="py-3"><Link to="/admin/orders/$id" params={{ id: o.id }} className="text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:text-paper">Detay</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Contacts Tab */}
      {tab === "contacts" && (
        <section className="px-6 py-6 lg:px-10">
          <h2 className="mb-4 font-display text-xl uppercase">Mesajlar</h2>
          {contacts.length === 0 ? <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center"><p className="text-sm text-paper/50">Henüz mesaj yok.</p></div> : (
            <div className="space-y-3">
              {contacts.map((c: any) => (
                <div key={c.id} className="rounded-lg border border-paper/15 p-4">
                  <div className="flex items-start justify-between">
                    <div><p className="font-display text-sm uppercase">{c.name}</p><p className="text-[11px] text-paper/50">{c.email} · {c.subject}</p></div>
                    <p className="text-[10px] text-paper/40">{new Date(c.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <p className="mt-2 text-sm text-paper/70">{c.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
