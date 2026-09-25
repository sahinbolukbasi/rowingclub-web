import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const ADMIN_TOKEN = "admin-token-kurek-kulubu";
const API_BASE = "/api/admin";

function getToken() {
  try {
    return localStorage.getItem("admin-token") ?? "";
  } catch {
    return "";
  }
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}?t=${getToken()}&_=${Date.now()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path: string, body?: any) {
  const res = await fetch(`${API_BASE}${path}?t=${getToken()}&_=${Date.now()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPut(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}?t=${getToken()}&_=${Date.now()}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}?t=${getToken()}&_=${Date.now()}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const ORDER_STATUS_MAP: Record<string, string> = {
  pending: "Bekliyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  paid: "bg-green-500/20 text-green-400",
  preparing: "bg-blue-500/20 text-blue-400",
  shipped: "bg-cyan/20 text-cyan",
  delivered: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-crim/20 text-crim",
};

const CONTACT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  in_progress: { label: "İşlemde", color: "bg-cyan/20 text-cyan border-cyan/30" },
  resolved: { label: "Okundu / Yanıtlandı", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Kürek Kulübü" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function useAdminAuth() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    const expires = Number(localStorage.getItem("admin_session_expires") || "0");

    if (token === ADMIN_TOKEN && (!expires || Date.now() < expires)) {
      localStorage.setItem("admin_session_expires", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
      setAuthed(true);
    } else {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("admin_session_expires");
      router.navigate({ to: "/admin" });
    }
  }, []);

  return authed;
}

function AdminDashboard() {
  const authed = useAdminAuth();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<"products" | "orders" | "contacts" | "users" | "content">("products");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  // Site Content State
  const [siteContent, setSiteContent] = useState<any>({
    heroTitle: "Kürek\nKulübü",
    heroSubtitle: "Denizi giyin. Her tişört, bir sabah küreği ve tuzlu rüzgar için tasarlandı.",
    heroButtonText: "Mağazaya gir →",
    heroImage: "",
    featuredHeading: "Öne çıkan tişörtler",
    featuredSubtitle: "— Öne çıkanlar",
    storyHeading: "Bir kulüp,\nbir deniz,\nbir giysi.",
    storyDescription: "Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır.",
    storyButtonText: "Hikâyemiz →",
    storyImage: "",
    clubTitle: "Bir kulüp,\nbir deniz,\nbir giysi.",
    clubDescription: "Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır. 1974'ten beri İstanbul sularında kürek çekiyor, her sabah aynı disiplini suya taşıyoruz.",
    clubImage: "",
    contactTitle: "Bize ulaş.",
    contactDescription: "Sipariş, beden rehberi, kulüp üyeliği veya toplu sipariş — ne isterseniz yazın. Cevap aynı gün içinde, en geç ertesi sabah küreğinden önce.",
    contactEmail: "merhaba@kurekkulubu.com",
    contactPhone: "+90 212 000 00 00",
    contactAddress: "Boğaz İskelesi 4, İstanbul",
    contactHours: "Pzt–Cmt · 09:00–18:00",
    announcement: "Türkiye genelinde ücretsiz kargo · İstanbul içi ertesi gün teslimat",
    footerText: "İstanbul Boğazı · Kürek Kulübü © 2026",
  });
  const [savingContent, setSavingContent] = useState(false);
  const [contentSuccess, setContentSuccess] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  // User management form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Admin");
  const [savingUser, setSavingUser] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  // Contact reply email modal state
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const loadData = () => {
    apiGet("/products").then(setProducts).catch((e) => setError(e.message));
    apiGet("/orders").then(setOrders).catch((e) => setError(e.message));
    apiGet("/contacts").then(setContacts).catch((e) => setError(e.message));
    apiGet("/users").then(setUsers).catch((e) => console.warn("Users error:", e));
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setSiteContent((prev: any) => ({ ...prev, ...data }));
      })
      .catch((e) => console.warn("Content load error:", e));
  };

  useEffect(() => {
    if (!authed) return;
    loadData();
  }, [authed]);

  const handleSeed = async () => {
    setSeeding(true);
    setError("");
    try {
      const res = await apiPost("/seed");
      if (res.seeded) {
        const prods = await apiGet("/products");
        setProducts(prods);
      } else {
        setError("Ürünler zaten yüklenmiş. Önce mevcut ürünleri silin.");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setSeeding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin_session_expires");
    router.navigate({ to: "/admin" });
  };

  // Save Site Content Texts & Banners
  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    setContentSuccess(false);
    try {
      const res = await apiPut("/content", siteContent);
      setSiteContent((prev: any) => ({ ...prev, ...res }));
      setContentSuccess(true);
      setTimeout(() => setContentSuccess(false), 4000);
    } catch (err: any) {
      alert("İçerik kaydedilirken hata oluştu: " + err.message);
    }
    setSavingContent(false);
  };

  // Upload Site Cover Images (Hero, Story, Club) directly to S3
  const handleSiteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImageKey(key);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch(`/api/admin/upload-image?t=${getToken()}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            data: base64Data,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setSiteContent((prev: any) => ({ ...prev, [key]: data.url }));
        } else {
          alert("Resim yükleme hatası: " + (data.error || "Bilinmeyen hata"));
        }
        setUploadingImageKey(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Hata: " + err.message);
      setUploadingImageKey(null);
    }
  };

  // Toggle isClosed status for product directly from dashboard
  const handleToggleProductClosed = async (product: any) => {
    try {
      const updatedClosed = !product.isClosed;
      await apiPut(`/products/${product.id}`, {
        ...product,
        isClosed: updatedClosed,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isClosed: updatedClosed } : p))
      );
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  // Toggle isFeatured status for product directly from dashboard
  const handleToggleProductFeatured = async (product: any) => {
    try {
      const updatedFeatured = !product.isFeatured;
      await apiPut(`/products/${product.id}`, {
        ...product,
        isFeatured: updatedFeatured,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isFeatured: updatedFeatured } : p))
      );
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  // Update contact status
  const handleUpdateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      await apiPut(`/contacts/${contactId}`, { status: newStatus, read: newStatus === "resolved" });
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, status: newStatus, read: newStatus === "resolved" } : c))
      );
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (e: any) {
      alert("Durum güncellenemedi: " + e.message);
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
    try {
      await apiDelete(`/contacts/${contactId}`);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (e: any) {
      alert("Silinemedi: " + e.message);
    }
  };

  // WhatsApp quick response
  const handleWhatsAppContact = (c: any) => {
    let phone = "";
    const phoneMatch = c.message?.match(/(\+?\d{10,13})/);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/\D/g, "");
    }
    if (!phone) {
      const input = window.prompt(
        `${c.name} için telefon numarasını girin (Örn: 905321234567):`,
        "90"
      );
      if (!input) return;
      phone = input.replace(/\D/g, "");
    }

    const text = encodeURIComponent(
      `Merhaba Sayın ${c.name},\nKürek Kulübü üzerinden ilettiğiniz "${c.subject || "mesaj"}" konulu talebiniz hakkında dönüş yapmaktayız:\n\n`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  // Open Email Reply Modal
  const openEmailModal = (contact: any) => {
    setSelectedContact(contact);
    setReplyMessage(
      `Merhaba Sayın ${contact.name},\n\nKürek Kulübü ile iletişime geçtiğiniz için teşekkür ederiz. İlettiğiniz "${contact.subject || "mesaj"}" hakkındaki geri bildirimimiz aşağıda yer almaktadır:\n\n\n\nHerhangi bir sorunuz olursa bu e-postayı yanıtlayabilirsiniz.\n\nSaygılarımızla,\nKürek Kulübü Ekibi`
    );
    setCopySuccess(false);
  };

  // Copy template text
  const handleCopyEmailTemplate = () => {
    if (!selectedContact) return;
    const emailBody = `=========================================
KÜREK KULÜBÜ — MÜŞTERİ HİZMETLERİ
=========================================
Kime: ${selectedContact.name} <${selectedContact.email}>
Konu: Re: ${selectedContact.subject || "Kürek Kulübü İletişim"}

${replyMessage}

-----------------------------------------
Önceki Mesajınız:
Tarih: ${new Date(selectedContact.createdAt).toLocaleString("tr-TR")}
Mesaj: "${selectedContact.message}"
-----------------------------------------
Kürek Kulübü / rowingclub.co
`;
    navigator.clipboard.writeText(emailBody);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Send via mailto
  const handleSendMailto = () => {
    if (!selectedContact) return;
    const subject = encodeURIComponent(`Re: ${selectedContact.subject || "Kürek Kulübü İletişim Talebi"}`);
    const body = encodeURIComponent(
      `${replyMessage}\n\n--- İletilen Mesajınız ---\n${selectedContact.message}\n`
    );
    window.location.href = `mailto:${selectedContact.email}?subject=${subject}&body=${body}`;
    handleUpdateContactStatus(selectedContact.id, "resolved");
  };

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setSavingUser(true);
    setUserMsg("");
    try {
      const res = await apiPost("/users", {
        username: newUsername,
        password: newPassword,
        name: newName || newUsername,
        role: newRole,
      });
      if (res.user) {
        setUsers((prev) => [...prev, res.user]);
        setShowAddUserModal(false);
        setNewUsername("");
        setNewPassword("");
        setNewName("");
      }
    } catch (err: any) {
      setUserMsg(err.message || "Kullanıcı oluşturulamadı");
    }
    setSavingUser(false);
  };

  // Delete user
  const handleDeleteUser = async (userId: string, username: string) => {
    if (username === "admin") {
      alert("Varsayılan yönetici hesabı silinemez.");
      return;
    }
    if (!window.confirm(`'${username}' kullanıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      await apiDelete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  if (!authed) return null;

  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const pendingContacts = contacts.filter((c: any) => !c.status || c.status === "pending").length;

  const totalStock = (p: any) =>
    p.stockPerSize
      ? Object.values(p.stockPerSize as Record<string, number>).reduce(
          (a: number, b: any) => a + (Number(b) || 0),
          0
        )
      : p.stock || 0;

  return (
    <div className="min-h-screen bg-ink text-paper">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-paper/15 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="size-2.5 rounded-full bg-crim animate-pulse" />
          <span className="font-display text-lg tracking-wide">Kürek Kulübü Yönetim Paneli</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-[11px] text-paper/40">
            Oturum: 30 Günlük Aktif
          </span>
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.18em] text-paper/50 transition hover:text-paper"
          >
            Siteye dön ↗
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full border border-paper/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-paper/60 transition hover:border-crim hover:text-crim"
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 gap-4 px-6 py-6 lg:grid-cols-5 lg:px-10">
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Ürünler</p>
          <p className="mt-1 font-display text-2xl">{products.length}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Siparişler</p>
          <p className="mt-1 font-display text-2xl">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Bekleyen Sipariş</p>
          <p className="mt-1 font-display text-2xl text-crim">{pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Bekleyen Mesaj</p>
          <p className="mt-1 font-display text-2xl text-amber-400">{pendingContacts}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Toplam Gelir</p>
          <p className="mt-1 font-display text-2xl text-cyan">₺{totalRevenue}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-paper/15 px-6 lg:px-10 overflow-x-auto">
        {(
          [
            { id: "products", label: "Ürünler", badge: products.length },
            { id: "orders", label: "Siparişler", badge: orders.length },
            { id: "contacts", label: "Mesajlar", badge: pendingContacts > 0 ? `${pendingContacts} yeni` : contacts.length },
            { id: "users", label: "Kullanıcılar", badge: users.length },
            { id: "content", label: "Site Yazıları & Görselleri", badge: "İçerik" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 pb-3 text-[11px] uppercase tracking-[0.22em] transition whitespace-nowrap ${
              tab === t.id
                ? "border-b-2 border-crim font-bold text-paper"
                : "text-paper/50 hover:text-paper"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] ${
                tab === t.id ? "bg-crim text-ink font-bold" : "bg-paper/10 text-paper/50"
              }`}
            >
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-crim/20 border border-crim p-4 text-xs text-crim lg:mx-10">
          {error}
        </div>
      )}

      {/* ─── TAB 1: ÜRÜNLER ─── */}
      {tab === "products" && (
        <section className="px-6 py-6 lg:px-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl uppercase">Ürün Yönetimi</h2>
              <p className="text-xs text-paper/50">
                Kapatılan ürünler panelde blur'lu ve "STOK YOK" olarak gösterilir. Yıldızlı ürünler ana sayfada öne çıkarılır.
              </p>
            </div>
            <div className="flex gap-2">
              {products.length === 0 && (
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="rounded-full border border-cyan/50 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:bg-cyan hover:text-ink"
                >
                  {seeding ? "Yükleniyor..." : "Örnek ürünleri yükle"}
                </button>
              )}
              <Link
                to="/admin/products/new"
                className="rounded-full bg-crim px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-ink font-semibold transition hover:bg-cyan"
              >
                + Yeni Ürün Ekle
              </Link>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center">
              <p className="text-sm text-paper/50">Henüz ürün eklenmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-paper/15 bg-ink/30">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50 bg-paper/5">
                    <th className="py-3 px-4">Görsel</th>
                    <th className="py-3 px-4">Ürün</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Fiyat</th>
                    <th className="py-3 px-4">Stok Durumu</th>
                    <th className="py-3 px-4">Öne Çıkar</th>
                    <th className="py-3 px-4">Satış Durumu</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any) => {
                    const isClosed = p.isClosed === true;
                    const isFeatured = p.isFeatured === true;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-paper/10 transition ${
                          isClosed
                            ? "bg-crim/10 backdrop-blur-md opacity-85"
                            : "hover:bg-paper/5"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="relative size-12 rounded-lg overflow-hidden border border-paper/15 bg-ink/50">
                            <img
                              src={p.images?.[0] || p.image || "/placeholder.png"}
                              alt={p.name}
                              className={`h-full w-full object-cover ${isClosed ? "grayscale-[60%]" : ""}`}
                            />
                            {isClosed && (
                              <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-[8px] font-bold text-crim uppercase">KAPALI</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-display uppercase tracking-wide">{p.name}</span>
                            {isClosed && (
                              <span className="rounded-full bg-crim px-2 py-0.5 text-[9px] font-bold uppercase text-paper animate-pulse">
                                STOK YOK
                              </span>
                            )}
                            {isFeatured && (
                              <span className="rounded-full bg-cyan/20 border border-cyan/30 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan">
                                ÖNE ÇIKAN
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-paper/40 font-mono">/{p.slug}</span>
                        </td>
                        <td className="py-3 px-4 text-paper/60 uppercase text-xs">{p.category}</td>
                        <td className="py-3 px-4">
                          {p.discount ? (
                            <div className="flex flex-col">
                              <span className="text-paper/40 line-through text-xs">₺{p.price}</span>
                              <span className="text-crim font-bold">
                                ₺
                                {(() => {
                                  const v = Number(p.discount.value);
                                  return p.discount.type === "percentage"
                                    ? Math.round(p.price * (1 - v / 100))
                                    : Math.max(0, p.price - v);
                                })()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-cyan font-bold">₺{p.price}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isClosed ? (
                            <span className="inline-block rounded-md border border-crim/40 bg-crim/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-crim">
                              STOK YOK
                            </span>
                          ) : (
                            <span className="text-xs text-paper/80">{totalStock(p)} Adet</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleProductFeatured(p)}
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                              isFeatured
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400 hover:text-ink"
                                : "bg-paper/10 text-paper/50 hover:bg-paper/20 hover:text-paper"
                            }`}
                            title={isFeatured ? "Öne Çıkarılanlardan Çıkar" : "Ana Sayfada Öne Çıkar"}
                          >
                            {isFeatured ? "⭐ Öne Çıkarıldı" : "☆ Öne Çıkar"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleProductClosed(p)}
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                              isClosed
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-ink"
                                : "bg-crim/20 text-crim border border-crim/30 hover:bg-crim hover:text-ink"
                            }`}
                            title={isClosed ? "Tekrar Satışa Aç" : "Ürünü Kapat (Stok Yok Yap)"}
                          >
                            {isClosed ? "✓ Satışa Aç" : "✕ Ürünü Kapat"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/admin/products/$id/edit"
                            params={{ id: p.id }}
                            className="rounded-lg border border-paper/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:bg-cyan hover:text-ink"
                          >
                            Düzenle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 2: SİPARİŞLER ─── */}
      {tab === "orders" && (
        <section className="px-6 py-6 lg:px-10">
          <h2 className="mb-4 font-display text-xl uppercase">Sipariş Yönetimi</h2>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center">
              <p className="text-sm text-paper/50">Henüz sipariş yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-paper/15 bg-ink/30">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50 bg-paper/5">
                    <th className="py-3 px-4">Sipariş No</th>
                    <th className="py-3 px-4">Müşteri</th>
                    <th className="py-3 px-4">Tutar</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id} className="border-b border-paper/10 hover:bg-paper/5 transition">
                      <td className="py-3 px-4 font-mono text-xs">{o.id}</td>
                      <td className="py-3 px-4">{o.customerName}</td>
                      <td className="py-3 px-4 text-cyan font-bold">₺{o.total}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase font-semibold ${
                            ORDER_STATUS_COLORS[o.status] ?? "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {ORDER_STATUS_MAP[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-paper/60 text-xs">
                        {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/admin/orders/$id"
                          params={{ id: o.id }}
                          className="text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:text-paper"
                        >
                          Detay ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 3: MESAJLAR ─── */}
      {tab === "contacts" && (
        <section className="px-6 py-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl uppercase">İletişim & Müşteri Talepleri</h2>
              <p className="text-xs text-paper/50">
                Gelen mesajları durumlarına göre yönetin, WhatsApp'tan veya marka şablonlu e-posta ile yanıtlayın.
              </p>
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center">
              <p className="text-sm text-paper/50">Henüz gelen mesaj bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contacts.map((c: any) => {
                const currentStatus = c.status || (c.read ? "resolved" : "pending");
                const statusMeta = CONTACT_STATUS_MAP[currentStatus] || CONTACT_STATUS_MAP.pending;

                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-paper/15 bg-ink/40 p-5 shadow-sm transition hover:border-paper/30 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-base uppercase text-paper">{c.name}</h3>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-paper/60 mt-0.5">
                          <a href={`mailto:${c.email}`} className="text-cyan hover:underline">
                            {c.email}
                          </a>
                          {c.subject && <span className="text-paper/40"> · Konu: {c.subject}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-paper/40">
                          {new Date(c.createdAt).toLocaleString("tr-TR")}
                        </span>

                        <select
                          value={currentStatus}
                          onChange={(e) => handleUpdateContactStatus(c.id, e.target.value)}
                          className="rounded-lg border border-paper/20 bg-ink px-3 py-1.5 text-xs text-paper outline-none transition focus:border-cyan"
                        >
                          <option value="pending">⏳ Beklemede</option>
                          <option value="in_progress">⚙️ İşlemde</option>
                          <option value="resolved">✓ Okundu / Yanıtlandı</option>
                        </select>

                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="text-paper/40 hover:text-crim text-xs p-1"
                          title="Sil"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-paper/10 bg-paper/5 p-4 text-sm text-paper/80 leading-relaxed font-sans whitespace-pre-wrap">
                      {c.message}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => handleWhatsAppContact(c)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink transition hover:brightness-110 shadow-sm"
                      >
                        <svg className="size-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        <span>WhatsApp'tan Yanıtla</span>
                      </button>

                      <button
                        onClick={() => openEmailModal(c)}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan transition hover:bg-cyan hover:text-ink shadow-sm"
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Mail Şablonu ile Yanıtla</span>
                      </button>

                      {currentStatus !== "resolved" && (
                        <button
                          onClick={() => handleUpdateContactStatus(c.id, "resolved")}
                          className="text-[11px] uppercase tracking-wider text-paper/50 hover:text-emerald-400 transition"
                        >
                          ✓ Çözüldü Olarak İşaretle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 4: KULLANICILAR ─── */}
      {tab === "users" && (
        <section className="px-6 py-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl uppercase">Sistem Kullanıcıları</h2>
              <p className="text-xs text-paper/50">
                Yönetim paneline erişebilecek kullanıcıları ve yetkilerini yönetin.
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddUserModal(true);
                setUserMsg("");
              }}
              className="rounded-full bg-crim px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-ink font-semibold transition hover:bg-cyan"
            >
              + Yeni Kullanıcı Ekle
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-paper/15 bg-ink/30">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50 bg-paper/5">
                  <th className="py-3 px-4">Kullanıcı Adı</th>
                  <th className="py-3 px-4">İsim / Unvan</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Oluşturulma Tarihi</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const isDefaultAdmin = u.username === "admin";
                  return (
                    <tr key={u.id} className="border-b border-paper/10 hover:bg-paper/5 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-cyan">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4">{u.name}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-paper/15 px-2.5 py-0.5 text-[10px] uppercase font-semibold text-paper">
                          {u.role || "Admin"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-paper/60">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("tr-TR") : "Sistem"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isDefaultAdmin ? (
                          <span className="text-[10px] text-paper/40 uppercase tracking-wider">
                            Varsayılan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="text-[11px] uppercase tracking-[0.18em] text-crim transition hover:underline"
                          >
                            Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── TAB 5: SİTE YAZILARI & ÖN PLAN GÖRSELLERİ (CMS) ─── */}
      {tab === "content" && (
        <section className="px-6 py-6 lg:px-10">
          <form onSubmit={handleSaveSiteContent} className="space-y-8 max-w-5xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/15 pb-4">
              <div>
                <h2 className="font-display text-2xl uppercase text-paper">
                  Site Yazıları ve Ön Plan Görselleri Yönetimi
                </h2>
                <p className="text-xs text-paper/60 mt-1">
                  Ana sayfa banner'ı, kapak görselleri, sloganlar ve iletişim bilgilerini dilediğiniz gibi güncelleyin.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {contentSuccess && (
                  <span className="text-xs font-bold text-emerald-400 animate-pulse">
                    ✓ Tüm içerikler başarıyla kaydedildi!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingContent}
                  className="rounded-full bg-crim px-8 py-3 font-display text-sm uppercase tracking-[0.15em] text-ink font-bold transition hover:bg-cyan disabled:opacity-50 shadow-lg"
                >
                  {savingContent ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </div>

            {/* SECTION A: ANA SAYFA HERO & ÖN PLAN GÖRSELİ */}
            <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-paper/10 pb-3">
                <span className="size-2 rounded-full bg-crim" />
                <h3 className="font-display text-lg uppercase text-paper">1. Ana Sayfa (Hero Banner & Başlıklar)</h3>
              </div>

              {/* Cover Image Uploader */}
              <div className="grid gap-6 md:grid-cols-2 items-start">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-wider text-paper/60 font-bold">
                    Ana Sayfa Ön Plan Görseli (Hero Banner)
                  </label>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-paper/20 bg-ink/60 group">
                    {siteContent.heroImage ? (
                      <img src={siteContent.heroImage} alt="Hero Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-paper/40 text-xs p-4 text-center">
                        <span>Varsayılan Kürek Görseli Kullanılıyor</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition">
                      <span className="rounded-full bg-crim px-4 py-2 text-xs font-bold text-ink uppercase tracking-wider">
                        {uploadingImageKey === "heroImage" ? "S3'e Yükleniyor..." : "Yeni Resim Yükle (S3)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImageKey === "heroImage"}
                        className="sr-only"
                        onChange={(e) => handleSiteImageUpload(e, "heroImage")}
                      />
                    </label>
                  </div>
                  {siteContent.heroImage && (
                    <button
                      type="button"
                      onClick={() => setSiteContent((p: any) => ({ ...p, heroImage: "" }))}
                      className="mt-2 text-[10px] uppercase text-crim hover:underline"
                    >
                      ✕ Varsayılan Görsele Dön
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Hero Ana Başlık (Satır başı için Enter basın)
                    </label>
                    <textarea
                      rows={2}
                      value={siteContent.heroTitle || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, heroTitle: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Hero Alt Başlık / Slogan
                    </label>
                    <textarea
                      rows={2}
                      value={siteContent.heroSubtitle || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, heroSubtitle: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Hero Buton Metni
                    </label>
                    <input
                      type="text"
                      value={siteContent.heroButtonText || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, heroButtonText: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>
                </div>
              </div>

              {/* Story Banner Image & Section */}
              <div className="pt-4 border-t border-paper/10 grid gap-6 md:grid-cols-2 items-start">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-wider text-paper/60 font-bold">
                    Ana Sayfa Kulüp Hikayesi Ön Plan Görseli
                  </label>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-paper/20 bg-ink/60 group">
                    {siteContent.storyImage ? (
                      <img src={siteContent.storyImage} alt="Story Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-paper/40 text-xs p-4 text-center">
                        <span>Varsayılan Flatlay Görseli Kullanılıyor</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition">
                      <span className="rounded-full bg-crim px-4 py-2 text-xs font-bold text-ink uppercase tracking-wider">
                        {uploadingImageKey === "storyImage" ? "S3'e Yükleniyor..." : "Yeni Resim Yükle (S3)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImageKey === "storyImage"}
                        className="sr-only"
                        onChange={(e) => handleSiteImageUpload(e, "storyImage")}
                      />
                    </label>
                  </div>
                  {siteContent.storyImage && (
                    <button
                      type="button"
                      onClick={() => setSiteContent((p: any) => ({ ...p, storyImage: "" }))}
                      className="mt-2 text-[10px] uppercase text-crim hover:underline"
                    >
                      ✕ Varsayılan Görsele Dön
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Hikaye Bölümü Başlığı
                    </label>
                    <textarea
                      rows={2}
                      value={siteContent.storyHeading || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, storyHeading: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Hikaye Açıklama Metni
                    </label>
                    <textarea
                      rows={4}
                      value={siteContent.storyDescription || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, storyDescription: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: KULÜP SAYFASI (HAKKIMIZDA) */}
            <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-paper/10 pb-3">
                <span className="size-2 rounded-full bg-cyan" />
                <h3 className="font-display text-lg uppercase text-paper">2. Kulüp Sayfası Metinleri ve Görseli</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2 items-start">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-wider text-paper/60 font-bold">
                    Kulüp Sayfası Ana Görseli (Boathouse)
                  </label>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-paper/20 bg-ink/60 group">
                    {siteContent.clubImage ? (
                      <img src={siteContent.clubImage} alt="Club Main" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-paper/40 text-xs p-4 text-center">
                        <span>Varsayılan Boathouse Görseli</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition">
                      <span className="rounded-full bg-crim px-4 py-2 text-xs font-bold text-ink uppercase tracking-wider">
                        {uploadingImageKey === "clubImage" ? "S3'e Yükleniyor..." : "Yeni Resim Yükle (S3)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImageKey === "clubImage"}
                        className="sr-only"
                        onChange={(e) => handleSiteImageUpload(e, "clubImage")}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Kulüp Sayfası Başlığı
                    </label>
                    <textarea
                      rows={2}
                      value={siteContent.clubTitle || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, clubTitle: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                      Kulüp Hakkında Detaylı Metin
                    </label>
                    <textarea
                      rows={4}
                      value={siteContent.clubDescription || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, clubDescription: e.target.value })}
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION C: İLETİŞİM BİLGİLERİ */}
            <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-paper/10 pb-3">
                <span className="size-2 rounded-full bg-amber-400" />
                <h3 className="font-display text-lg uppercase text-paper">3. İletişim Sayfası Bilgileri</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    İletişim Başlığı
                  </label>
                  <input
                    type="text"
                    value={siteContent.contactTitle || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, contactTitle: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    İletişim E-posta Adresi
                  </label>
                  <input
                    type="text"
                    value={siteContent.contactEmail || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    İletişim Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={siteContent.contactPhone || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    Atölye / Adres Bilgisi
                  </label>
                  <input
                    type="text"
                    value={siteContent.contactAddress || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, contactAddress: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    İletişim Açıklama Metni
                  </label>
                  <textarea
                    rows={2}
                    value={siteContent.contactDescription || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, contactDescription: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>
              </div>
            </div>

            {/* SECTION D: ANNOUNCEMENT & FOOTER */}
            <div className="rounded-2xl border border-paper/15 bg-ink/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-paper/10 pb-3">
                <span className="size-2 rounded-full bg-emerald-400" />
                <h3 className="font-display text-lg uppercase text-paper">4. Duyuru Bandı ve Footer Metni</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    Üst Kayan Duyuru Metni
                  </label>
                  <input
                    type="text"
                    value={siteContent.announcement || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, announcement: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                    Alt Bilgi / Footer Telif Yazısı
                  </label>
                  <input
                    type="text"
                    value={siteContent.footerText || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, footerText: e.target.value })}
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-paper/15">
              {contentSuccess && (
                <span className="text-xs font-bold text-emerald-400 animate-pulse">
                  ✓ Tüm içerikler başarıyla kaydedildi!
                </span>
              )}
              <button
                type="submit"
                disabled={savingContent}
                className="rounded-full bg-crim px-8 py-3 font-display text-sm uppercase tracking-[0.15em] text-ink font-bold transition hover:bg-cyan disabled:opacity-50 shadow-lg"
              >
                {savingContent ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── MODAL: KULLANICI EKLE ─── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper/20 bg-ink p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-paper/15 pb-3">
              <h3 className="font-display text-lg uppercase text-paper">Yeni Kullanıcı Ekle</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-paper/50 hover:text-paper"
              >
                ✕
              </button>
            </div>

            {userMsg && (
              <div className="mt-3 rounded-lg bg-crim/20 border border-crim/40 p-2 text-xs text-crim">
                {userMsg}
              </div>
            )}

            <form onSubmit={handleAddUser} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                  placeholder="ornek_kullanici"
                  className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                  Giriş Şifresi *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/60">
                  Rol / Yetki
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-lg border border-paper/20 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                >
                  <option value="Admin">Admin (Tam Yetki)</option>
                  <option value="Editör">Editör (Ürün ve Mesaj Yönetimi)</option>
                  <option value="Satış">Satış Temsilcisi (Sipariş Takibi)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-paper/15">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-full border border-paper/20 px-4 py-2 text-xs uppercase tracking-wider text-paper/60 transition hover:text-paper"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="rounded-full bg-crim px-6 py-2 text-xs font-bold uppercase tracking-wider text-ink transition hover:bg-cyan disabled:opacity-50"
                >
                  {savingUser ? "Kaydediliyor..." : "Kullanıcıyı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: WEB SİTESİ TASARIMLI E-POSTA ŞABLONU İLE YANITLA ─── */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-paper/20 bg-ink p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-paper/15 pb-4">
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-cyan" />
                <h3 className="font-display text-lg uppercase tracking-wide text-paper">
                  Müşteri E-Posta Yanıt Şablonu
                </h3>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-paper/50 hover:text-paper text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-paper/5 p-3 rounded-lg border border-paper/10">
              <div>
                <span className="text-paper/50">Alıcı:</span>{" "}
                <span className="font-semibold text-paper">
                  {selectedContact.name} ({selectedContact.email})
                </span>
              </div>
              <div>
                <span className="text-paper/50">Konu:</span>{" "}
                <span className="font-semibold text-cyan">
                  Re: {selectedContact.subject || "İletişim Talebi"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                Cevap Metniniz (Düzenleyebilirsiniz):
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-paper/20 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition focus:border-cyan leading-relaxed font-sans"
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                  E-Posta Tasarım Önizlemesi (Kürek Kulübü Şablonu):
                </label>
                {copySuccess && (
                  <span className="text-xs font-bold text-emerald-400">
                    ✓ Şablon panoya kopyalandı!
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-paper/20 bg-[#080d1a] p-5 text-sm text-paper/90 shadow-inner">
                <div className="flex items-center justify-between border-b border-cyan/30 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold tracking-wider text-paper">
                      KÜREK KULÜBÜ
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-cyan">
                      · Rowing Club
                    </span>
                  </div>
                  <span className="text-[10px] text-paper/40">Resmi İletişim</span>
                </div>

                <div className="space-y-3 whitespace-pre-wrap font-sans text-xs text-paper/80 leading-relaxed">
                  {replyMessage}
                </div>

                <div className="mt-4 border-l-2 border-crim/60 bg-paper/5 pl-3 py-2 text-[11px] text-paper/60 italic rounded-r">
                  <p className="font-bold not-italic text-paper/70 mb-0.5">Müşteri Mesajı:</p>
                  "{selectedContact.message}"
                </div>

                <div className="mt-6 border-t border-paper/15 pt-3 text-[10px] text-paper/40 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-paper/60">Kürek Kulübü Destek Ekibi</p>
                    <p>İstanbul Boğazı · info@rowingclub.co</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan">www.rowingclub.co</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper/15 pt-4">
              <button
                type="button"
                onClick={handleCopyEmailTemplate}
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-xs uppercase tracking-wider text-paper transition hover:border-cyan hover:text-cyan"
              >
                📋 {copySuccess ? "Kopyalandı!" : "Şablonu Kopyala"}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="rounded-full border border-paper/20 px-4 py-2 text-xs uppercase tracking-wider text-paper/50 hover:text-paper"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleSendMailto}
                  className="inline-flex items-center gap-2 rounded-full bg-crim px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition hover:bg-cyan shadow-md"
                >
                  <span>✉️ E-Posta İstemcisinde Aç (Mailto)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
