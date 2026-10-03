import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatId, setNewCatId] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [tab, setTab] = useState<
    "products" | "orders" | "coupons" | "contacts" | "users" | "content" | "categories" | "iyzico"
  >("products");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  // iyzico states
  const [iyzicoSettings, setIyzicoSettings] = useState({
    apiKey: "",
    secretKey: "",
    mode: "sandbox" as "sandbox" | "production",
    enabled: false,
  });
  const [savingIyzico, setSavingIyzico] = useState(false);
  const [testingIyzico, setTestingIyzico] = useState(false);
  const [iyzicoTestResult, setIyzicoTestResult] = useState<any>(null);
  const [iyzicoSaveMsg, setIyzicoSaveMsg] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Product filter, sort & duplicate states
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategory, setProdCategory] = useState("all");
  const [prodStatus, setProdStatus] = useState("all"); // "all" | "active" | "closed" | "featured" | "discounted"
  const [prodSort, setProdSort] = useState("newest"); // "newest" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock-desc" | "stock-asc"
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Orders filter & sort states
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderSort, setOrderSort] = useState("date-desc"); // "date-desc" | "date-asc" | "total-desc" | "total-asc" | "name-asc"

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId || !newCatLabel) return;
    const cleanId = newCatId.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-");
    setSavingCategory(true);
    try {
      const updatedList = await apiPost("/categories", { id: cleanId, label: newCatLabel.trim() });
      setCategories(updatedList);
      setNewCatId("");
      setNewCatLabel("");
    } catch (err: any) {
      alert("Kategori ekleme hatası: " + err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatLabel) return;
    setSavingCategory(true);
    try {
      const updatedList = await apiPost("/categories", { id, label: editingCatLabel.trim() });
      setCategories(updatedList);
      setEditingCatId(null);
      setEditingCatLabel("");
    } catch (err: any) {
      alert("Kategori güncelleme hatası: " + err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (id === "all") {
      alert("'Tüm Ürünler' ana filtre seçeneği silinemez.");
      return;
    }
    if (!confirm(`'${id}' filtresini silmek istediğinize emin misiniz?`)) return;
    try {
      const updatedList = await apiDelete(`/categories/${id}`);
      setCategories(updatedList);
    } catch (err: any) {
      alert("Filtre silme hatası: " + err.message);
    }
  };

  // Coupon form modal state
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    targetType: "all",
    targetProductSlug: "",
    showOnSite: true,
    siteBannerText: "%10 İNDİRİM",
    minOrderAmount: 0,
    usageLimit: 500,
    expiresAt: "",
    active: true,
  });

  const generateRandomCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "KUREK-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm((prev) => ({ ...prev, code }));
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      if (editingCoupon) {
        await apiPut(`/coupons/${editingCoupon.id}`, couponForm);
      } else {
        await apiPost("/coupons", couponForm);
      }
      setShowAddCouponModal(false);
      setEditingCoupon(null);
      const res = await apiGet("/coupons");
      setCoupons(res);
    } catch (err: any) {
      alert("İndirim kodu kaydedilirken hata oluştu: " + err.message);
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Bu indirim kodunu silmek istediğinize emin misiniz?")) return;
    try {
      await apiDelete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Silme hatası: " + err.message);
    }
  };

  const handleToggleCouponActive = async (coupon: any) => {
    try {
      const updated = await apiPut(`/coupons/${coupon.id}`, { ...coupon, active: !coupon.active });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: updated.active ?? !coupon.active } : c)));
    } catch (err: any) {
      alert("Güncelleme hatası: " + err.message);
    }
  };

  const handleToggleCouponShowOnSite = async (coupon: any) => {
    try {
      const updated = await apiPut(`/coupons/${coupon.id}`, { ...coupon, showOnSite: !coupon.showOnSite });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, showOnSite: updated.showOnSite ?? !coupon.showOnSite } : c)));
    } catch (err: any) {
      alert("Güncelleme hatası: " + err.message);
    }
  };

  const handleSaveIyzico = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIyzico(true);
    setIyzicoSaveMsg("");
    try {
      const res = await apiPost("/iyzico-settings", iyzicoSettings);
      setIyzicoSaveMsg("✓ iyzico ayarları başarıyla kaydedildi!");
      if (res && res.settings) setIyzicoSettings(res.settings);
      setTimeout(() => setIyzicoSaveMsg(""), 4000);
    } catch (err: any) {
      alert("Ayarlar kaydedilemedi: " + err.message);
    } finally {
      setSavingIyzico(false);
    }
  };

  const handleTestIyzico = async () => {
    setTestingIyzico(true);
    setIyzicoTestResult(null);
    try {
      const res = await apiPost("/iyzico-test", {
        ...iyzicoSettings,
        amount: 100,
      });
      setIyzicoTestResult(res);
    } catch (err: any) {
      setIyzicoTestResult({ success: false, error: err.message });
    } finally {
      setTestingIyzico(false);
    }
  };

  const loadData = () => {
    apiGet("/products").then(setProducts).catch((e) => setError(e.message));
    apiGet("/orders").then(setOrders).catch((e) => setError(e.message));
    apiGet("/contacts").then(setContacts).catch((e) => setError(e.message));
    apiGet("/users").then(setUsers).catch((e) => console.warn("Users error:", e));
    apiGet("/coupons").then(setCoupons).catch((e) => console.warn("Coupons error:", e));
    apiGet("/categories").then(setCategories).catch((e) => console.warn("Categories error:", e));
    apiGet("/iyzico-settings").then((data) => {
      if (data) setIyzicoSettings(data);
    }).catch((e) => console.warn("iyzico settings error:", e));
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setSiteContent((prev: any) => ({ ...prev, ...data }));
      })
      .catch((e) => console.warn("Content load error:", e));
  };
  const [siteContent, setSiteContent] = useState<any>({
    heroTitle: "Kürek\nKulübü",
    heroSubtitle: "Denizi giyin. Her tişört, bir sabah küreği ve tuzlu rüzgar için tasarlandı.",
    heroButtonText: "Mağazaya gir →",
    heroImage: "",
    featuredHeading: "Öne çıkan tişörtler",
    featuredSubtitle: "— Öne çıkanlar",
    storyHeading: "Küreğin ruhu,\nkumaşın hafızası.",
    storyDescription: "Bizler sabahın alacakaranlığında denizle konuşan, suyun ritmini ezbere bilen bir kürek topluluğuyuz. Tasarladığımız her tişört; basit bir tekstil ürünü değil, dalgaların sesini, dümencinin nefesini ve sabah küreğinin o saf tutkusunu üzerinde taşıyan yaşayan birer hikâyedir.",
    storyButtonText: "Hakkımızda & Kulüp Hikâyesi →",
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
    metaTitle: "Kürek Kulübü — Deniz Küreği Tişörtleri, Hoodie & Aksesuarları",
    metaKeywords: "kürek tişörtü, kürek giyim, deniz küreği tişört, kürek hoodie, kürek sweatshirt, kürek şapkası, kürek çorabı, rowing club t-shirt, rowing clothing, organik pamuk tişört, denizci giyim, rowing club istanbul",
    metaDescription: "Kürek Kulübü deniz küreği temalı tişört, hoodie, sweatshirt, şapka ve aksesuarları tasarlar ve satar. Organik pamuk, sınırlı baskı, özel denizci koleksiyonu.",
    gaMeasurementId: "",
    gtmContainerId: "",
    googleAdsId: "",
    metaPixelId: "",
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

  // Product duplicate handler (Kopyasını otomatik ekle)
  const handleDuplicateProduct = async (product: any) => {
    const confirmCopy = window.confirm(`"${product.name}" ürününün kopyasını otomatik oluşturup eklemek istiyor musunuz?`);
    if (!confirmCopy) return;

    setDuplicatingId(product.id);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanSlugBase = (product.slug || "urun")
        .replace(/-kopya(-\d+)?$/g, "")
        .replace(/[^a-z0-9-]+/gi, "-")
        .toLowerCase();
      const newSlug = `${cleanSlugBase}-kopya-${randomSuffix}`;

      const duplicatePayload = {
        name: `${product.name} (Kopya)`,
        slug: newSlug,
        category: product.category || "tisort",
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
        description: product.description || "",
        detail: product.detail || "",
        tag: product.tag || "",
        images: product.images && product.images.length > 0 ? [...product.images] : (product.image ? [product.image] : []),
        image: product.image || (product.images && product.images[0]) || "",
        sizes: product.sizes ? [...product.sizes] : ["S", "M", "L", "XL"],
        colors: product.colors ? JSON.parse(JSON.stringify(product.colors)) : [],
        stockPerSize: product.stockPerSize ? { ...product.stockPerSize } : undefined,
        stock: totalStock(product) || product.stock || 0,
        discount: product.discount ? { ...product.discount } : null,
        isClosed: false,
        isFeatured: false,
        visible: true,
      };

      const created = await apiPost("/products", duplicatePayload);
      setProducts((prev) => [created, ...prev]);
      alert(`"${created.name}" kopyası başarıyla oluşturuldu ve ürün listesine eklendi!`);
    } catch (e: any) {
      alert("Ürün kopyalama hatası: " + (e.message || String(e)));
    } finally {
      setDuplicatingId(null);
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

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p: any) => {
      if (prodSearch.trim()) {
        const q = prodSearch.toLowerCase().trim();
        const nameMatch = String(p.name || "").toLowerCase().includes(q);
        const slugMatch = String(p.slug || "").toLowerCase().includes(q);
        const catMatch = String(p.category || "").toLowerCase().includes(q);
        const tagMatch = String(p.tag || "").toLowerCase().includes(q);
        if (!nameMatch && !slugMatch && !catMatch && !tagMatch) return false;
      }
      if (prodCategory !== "all" && String(p.category || "").toLowerCase() !== prodCategory.toLowerCase()) {
        return false;
      }
      if (prodStatus === "active") {
        if (p.isClosed || totalStock(p) === 0) return false;
      } else if (prodStatus === "closed") {
        if (!p.isClosed && totalStock(p) > 0) return false;
      } else if (prodStatus === "featured") {
        if (!p.isFeatured) return false;
      } else if (prodStatus === "discounted") {
        if (!p.discount || Number(p.discount.value) <= 0) return false;
      }
      return true;
    });

    return [...result].sort((a: any, b: any) => {
      if (prodSort === "name-asc") return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      if (prodSort === "name-desc") return String(b.name || "").localeCompare(String(a.name || ""), "tr");
      if (prodSort === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
      if (prodSort === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
      if (prodSort === "stock-desc") return totalStock(b) - totalStock(a);
      if (prodSort === "stock-asc") return totalStock(a) - totalStock(b);
      if (prodSort === "newest") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return 0;
      }
      return 0;
    });
  }, [products, prodSearch, prodCategory, prodStatus, prodSort]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = orders.filter((o: any) => {
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const idMatch = String(o.id || "").toLowerCase().includes(q);
        const nameMatch = String(o.customerName || "").toLowerCase().includes(q);
        const emailMatch = String(o.email || o.shippingAddress?.email || "").toLowerCase().includes(q);
        const phoneMatch = String(o.phone || o.shippingAddress?.phone || "").toLowerCase().includes(q);
        const cargoMatch = String(o.cargoTrackingCode || "").toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !emailMatch && !phoneMatch && !cargoMatch) return false;
      }
      if (orderStatus !== "all" && o.status !== orderStatus) {
        return false;
      }
      return true;
    });

    return [...result].sort((a: any, b: any) => {
      if (orderSort === "date-desc") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (orderSort === "date-asc") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (orderSort === "total-desc") return (Number(b.total) || 0) - (Number(a.total) || 0);
      if (orderSort === "total-asc") return (Number(a.total) || 0) - (Number(b.total) || 0);
      if (orderSort === "name-asc") return String(a.customerName || "").localeCompare(String(b.customerName || ""), "tr");
      return 0;
    });
  }, [orders, orderSearch, orderStatus, orderSort]);

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
      <section className="grid grid-cols-2 gap-4 px-6 py-6 lg:grid-cols-6 lg:px-10">
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm cursor-pointer hover:border-paper/30 transition" onClick={() => setTab("products")}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Ürünler</p>
          <p className="mt-1 font-display text-2xl">{products.length}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm cursor-pointer hover:border-paper/30 transition" onClick={() => setTab("orders")}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Siparişler</p>
          <p className="mt-1 font-display text-2xl">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm cursor-pointer hover:border-paper/30 transition" onClick={() => setTab("coupons")}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Kampanyalar</p>
          <p className="mt-1 font-display text-2xl text-emerald-400">{coupons.length}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm cursor-pointer hover:border-paper/30 transition" onClick={() => setTab("orders")}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">Bekleyen Sipariş</p>
          <p className="mt-1 font-display text-2xl text-crim">{pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm cursor-pointer hover:border-paper/30 transition" onClick={() => setTab("contacts")}>
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
            { id: "products" as const, label: "Ürünler", badge: products.length },
            { id: "orders" as const, label: "Siparişler", badge: orders.length },
            { id: "coupons" as const, label: "🏷️ Kampanyalar & İndirimler", badge: coupons.length },
            { id: "categories" as const, label: "Filtreler & Kategoriler", badge: categories.length },
            { id: "contacts" as const, label: "Mesajlar", badge: pendingContacts > 0 ? `${pendingContacts} yeni` : contacts.length },
            { id: "users" as const, label: "Kullanıcılar", badge: users.length },
            { id: "content" as const, label: "Site Yazıları & Görselleri", badge: "İçerik" },
            { id: "iyzico" as const, label: "💳 iyzico Ödeme", badge: iyzicoSettings.enabled ? "Aktif" : "Pasif" },
          ]
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

          {/* Arama, Filtreleme ve Sıralama Çubuğu */}
          <div className="mb-4 rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Arama */}
              <div className="relative">
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="Ürün adı, slug veya etiket ara..."
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 pl-9 text-xs text-paper placeholder-paper/40 outline-none transition focus:border-cyan"
                />
                <span className="absolute left-3 top-2.5 text-xs text-paper/40">🔍</span>
                {prodSearch && (
                  <button
                    onClick={() => setProdSearch("")}
                    className="absolute right-2.5 top-2 text-xs text-paper/40 hover:text-paper"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Kategori Filtresi */}
              <div>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 text-xs text-paper outline-none transition focus:border-cyan cursor-pointer"
                >
                  <option value="all">Tüm Kategoriler ({products.length})</option>
                  {categories.map((c: any) => {
                    const count = products.filter(
                      (p: any) => String(p.category || "").toLowerCase() === c.id.toLowerCase()
                    ).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.label} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Durum Filtresi */}
              <div>
                <select
                  value={prodStatus}
                  onChange={(e) => setProdStatus(e.target.value)}
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 text-xs text-paper outline-none transition focus:border-cyan cursor-pointer"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">🟢 Satışta / Stok Var</option>
                  <option value="closed">🔴 Stok Yok / Kapalı</option>
                  <option value="featured">⭐ Öne Çıkanlar</option>
                  <option value="discounted">🏷️ İndirimli Ürünler</option>
                </select>
              </div>

              {/* Sıralama */}
              <div>
                <select
                  value={prodSort}
                  onChange={(e) => setProdSort(e.target.value)}
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 text-xs text-paper outline-none transition focus:border-cyan cursor-pointer"
                >
                  <option value="newest">🕒 En Yeni Eklenen</option>
                  <option value="name-asc">🔤 İsim: A → Z</option>
                  <option value="name-desc">🔤 İsim: Z → A</option>
                  <option value="price-asc">💵 Fiyat: Düşük → Yüksek</option>
                  <option value="price-desc">💵 Fiyat: Yüksek → Düşük</option>
                  <option value="stock-desc">📦 Stok: Çok → Az</option>
                  <option value="stock-asc">📦 Stok: Az → Çok</option>
                </select>
              </div>
            </div>

            {/* Aktif Filtre Bilgisi ve Sıfırlama */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-paper/10 text-xs text-paper/60">
              <div className="flex items-center gap-2">
                <span>
                  Toplam <strong className="text-paper">{products.length}</strong> üründen{" "}
                  <strong className="text-cyan">{filteredAndSortedProducts.length}</strong> tanesi gösteriliyor
                </span>
                {(prodSearch || prodCategory !== "all" || prodStatus !== "all" || prodSort !== "newest") && (
                  <button
                    onClick={() => {
                      setProdSearch("");
                      setProdCategory("all");
                      setProdStatus("all");
                      setProdSort("newest");
                    }}
                    className="ml-2 text-crim hover:underline font-semibold cursor-pointer"
                  >
                    Filtreleri Sıfırla ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center">
              <p className="text-sm text-paper/50">Henüz ürün eklenmemiş.</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-paper/20 p-12 text-center bg-ink/20">
              <p className="text-sm text-paper/60 mb-2">Arama veya seçilen filtrelere uygun ürün bulunamadı.</p>
              <button
                onClick={() => {
                  setProdSearch("");
                  setProdCategory("all");
                  setProdStatus("all");
                  setProdSort("newest");
                }}
                className="rounded-full bg-crim px-4 py-1.5 text-xs text-ink font-semibold uppercase tracking-wider transition hover:bg-cyan cursor-pointer"
              >
                Filtreleri Temizle
              </button>
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
                  {filteredAndSortedProducts.map((p: any) => {
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
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer ${
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
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer ${
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDuplicateProduct(p)}
                              disabled={duplicatingId === p.id}
                              className="rounded-lg border border-paper/20 bg-ink/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] text-paper/80 transition hover:border-cyan/50 hover:text-cyan hover:bg-cyan/10 cursor-pointer disabled:opacity-50"
                              title="Ürünün kopyasını otomatik ekle"
                            >
                              {duplicatingId === p.id ? "Kopyalanıyor..." : "Kopyala"}
                            </button>
                            <Link
                              to="/admin/products/$id/edit"
                              params={{ id: p.id }}
                              className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:bg-cyan hover:text-ink font-semibold"
                            >
                              Düzenle
                            </Link>
                          </div>
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl uppercase">Sipariş Yönetimi</h2>
              <p className="text-xs text-paper/50">
                Gelen siparişleri durumlarına göre filtreleyebilir, müşteri veya sipariş no ile arayabilirsiniz.
              </p>
            </div>
          </div>

          {/* Sipariş Arama, Filtreleme ve Sıralama */}
          <div className="mb-4 rounded-xl border border-paper/15 bg-ink/40 p-4 shadow-sm space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Arama */}
              <div className="relative">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Sipariş No, müşteri, e-posta, tel veya takip no..."
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 pl-9 text-xs text-paper placeholder-paper/40 outline-none transition focus:border-cyan"
                />
                <span className="absolute left-3 top-2.5 text-xs text-paper/40">🔍</span>
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch("")}
                    className="absolute right-2.5 top-2 text-xs text-paper/40 hover:text-paper"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Durum Filtresi */}
              <div>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 text-xs text-paper outline-none transition focus:border-cyan cursor-pointer"
                >
                  <option value="all">Tüm Durumlar ({orders.length})</option>
                  <option value="pending">⏳ Bekliyor</option>
                  <option value="paid">💳 Ödendi</option>
                  <option value="preparing">⚙️ Hazırlanıyor</option>
                  <option value="shipped">🚚 Kargoda</option>
                  <option value="delivered">✓ Teslim Edildi</option>
                  <option value="cancelled">✕ İptal</option>
                </select>
              </div>

              {/* Sıralama */}
              <div>
                <select
                  value={orderSort}
                  onChange={(e) => setOrderSort(e.target.value)}
                  className="w-full rounded-lg border border-paper/20 bg-ink/80 px-3 py-2 text-xs text-paper outline-none transition focus:border-cyan cursor-pointer"
                >
                  <option value="date-desc">🕒 Tarih: En Yeni</option>
                  <option value="date-asc">🕒 Tarih: En Eski</option>
                  <option value="total-desc">💵 Tutar: En Yüksek</option>
                  <option value="total-asc">💵 Tutar: En Düşük</option>
                  <option value="name-asc">🔤 Müşteri: A → Z</option>
                </select>
              </div>
            </div>

            {/* Aktif Filtre Bilgisi ve Sıfırlama */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-paper/10 text-xs text-paper/60">
              <div className="flex items-center gap-2">
                <span>
                  Toplam <strong className="text-paper">{orders.length}</strong> siparişten{" "}
                  <strong className="text-cyan">{filteredAndSortedOrders.length}</strong> tanesi gösteriliyor
                </span>
                {(orderSearch || orderStatus !== "all" || orderSort !== "date-desc") && (
                  <button
                    onClick={() => {
                      setOrderSearch("");
                      setOrderStatus("all");
                      setOrderSort("date-desc");
                    }}
                    className="ml-2 text-crim hover:underline font-semibold cursor-pointer"
                  >
                    Filtreleri Sıfırla ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center">
              <p className="text-sm text-paper/50">Henüz sipariş yok.</p>
            </div>
          ) : filteredAndSortedOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-paper/20 p-12 text-center bg-ink/20">
              <p className="text-sm text-paper/60 mb-2">Arama veya filtrelere uygun sipariş bulunamadı.</p>
              <button
                onClick={() => {
                  setOrderSearch("");
                  setOrderStatus("all");
                  setOrderSort("date-desc");
                }}
                className="rounded-full bg-crim px-4 py-1.5 text-xs text-ink font-semibold uppercase tracking-wider transition hover:bg-cyan cursor-pointer"
              >
                Filtreleri Temizle
              </button>
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
                  {filteredAndSortedOrders.map((o: any) => (
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
                        <div className="flex items-center justify-end gap-2">
                          {o.paymentUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(o.paymentUrl);
                                setCopiedOrderId(o.id);
                                setTimeout(() => setCopiedOrderId(null), 2000);
                              }}
                              title="iyzico Ödeme Linkini Kopyala"
                              className="rounded bg-cyan/10 border border-cyan/30 px-2 py-0.5 text-[10px] text-cyan hover:bg-cyan hover:text-ink transition font-mono cursor-pointer"
                            >
                              {copiedOrderId === o.id ? "✓ Kopyalandı" : "🔗 Link"}
                            </button>
                          )}
                          <Link
                            to="/admin/orders/$id"
                            params={{ id: o.id }}
                            className="text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:text-paper"
                          >
                            Detay ↗
                          </Link>
                        </div>
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

            {/* SECTION E: SEO & ANALİTİK / REKLAM KODLARI */}
            <div className="rounded-2xl border border-cyan/30 bg-ink/60 p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-paper/15 pb-3">
                <div className="flex items-center gap-3">
                  <span className="size-2 rounded-full bg-cyan animate-pulse" />
                  <h3 className="font-display text-lg uppercase text-paper tracking-wide">
                    5. SEO Ayarları & Google / Meta Reklam Takip Kodları
                  </h3>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-cyan bg-cyan/10 px-3 py-1 rounded-full border border-cyan/30">
                  Google Search & Discover Uyumlu
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                    Site Başlığı (SEO Title Tag)
                  </label>
                  <input
                    type="text"
                    value={siteContent.metaTitle || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, metaTitle: e.target.value })}
                    placeholder="Kürek Kulübü — Deniz Küreği Tişörtleri, Hoodie & Aksesuarları"
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                    Meta Açıklaması (Google Arama Özet Yazısı)
                  </label>
                  <textarea
                    rows={2}
                    value={siteContent.metaDescription || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, metaDescription: e.target.value })}
                    placeholder="Kürek Kulübü deniz küreği temalı tişört, hoodie, sweatshirt, şapka ve aksesuarları..."
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                    Anahtar Kelimeler (Meta Keywords - Virgülle Ayrılmış)
                  </label>
                  <textarea
                    rows={2}
                    value={siteContent.metaKeywords || ""}
                    onChange={(e) => setSiteContent({ ...siteContent, metaKeywords: e.target.value })}
                    placeholder="kürek tişörtü, kürek giyim, deniz küreği tişört, kürek hoodie, kürek sweatshirt, kürek şapkası, kürek çorabı..."
                    className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-paper/10">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-cyan font-bold">
                      Google Analytics 4 Ölçüm Kimliği (GA4 ID)
                    </label>
                    <input
                      type="text"
                      value={siteContent.gaMeasurementId || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, gaMeasurementId: e.target.value.trim() })}
                      placeholder="Örn: G-XXXXXXXXXX"
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm font-mono text-paper outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-cyan font-bold">
                      Google Tag Manager Kapsayıcı ID (GTM ID)
                    </label>
                    <input
                      type="text"
                      value={siteContent.gtmContainerId || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, gtmContainerId: e.target.value.trim() })}
                      placeholder="Örn: GTM-XXXXXXX"
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm font-mono text-paper outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-cyan font-bold">
                      Google Ads Dönüşüm Kimliği (Google Ads ID)
                    </label>
                    <input
                      type="text"
                      value={siteContent.googleAdsId || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, googleAdsId: e.target.value.trim() })}
                      placeholder="Örn: AW-XXXXXXXXX"
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm font-mono text-paper outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-cyan font-bold">
                      Meta Pixel ID (Facebook / Instagram Reklam)
                    </label>
                    <input
                      type="text"
                      value={siteContent.metaPixelId || ""}
                      onChange={(e) => setSiteContent({ ...siteContent, metaPixelId: e.target.value.trim() })}
                      placeholder="Örn: 123456789012345"
                      className="w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm font-mono text-paper outline-none focus:border-cyan"
                    />
                  </div>
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

      {/* ─── TAB: FİLTRELER & KATEGORİLER ─── */}
      {tab === "categories" && (
        <section className="px-6 py-6 lg:px-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl uppercase">Filtre & Ürün Türü Yönetimi</h2>
              <p className="text-xs text-paper/50 mt-1 max-w-2xl">
                Buradaki kategori ve ürün türleri, Mağaza sayfasında (`/shop`) filtreleme sekmeleri olarak listelenir ve ürün ekleme/düzenleme formlarında seçim olarak gösterilir.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Kategori Ekleme Formu */}
            <div className="rounded-2xl border border-paper/15 bg-ink/60 p-6 shadow-xl space-y-4 h-fit">
              <h3 className="font-display text-base uppercase text-cyan tracking-wider flex items-center gap-2">
                <span>➕ Yeni Ürün Türü / Filtre Ekle</span>
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/50 font-semibold">
                    Filtre ID / Kodu *
                  </label>
                  <input
                    type="text"
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    placeholder="örn: tayt, bros, yelek..."
                    className="w-full rounded-xl border border-paper/20 bg-ink px-4 py-2.5 text-xs text-paper outline-none transition focus:border-cyan font-mono"
                    required
                  />
                  <p className="text-[10px] text-paper/40 mt-1">
                    Sadece küçük ingilizce harf ve tire (örn: <code>sweatshirt</code>, <code>spor-aksesuar</code>)
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/50 font-semibold">
                    Sitede Görünecek Adı (Etiket) *
                  </label>
                  <input
                    type="text"
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="örn: Tayt & Alt Giyim, Yelekler..."
                    className="w-full rounded-xl border border-paper/20 bg-ink px-4 py-2.5 text-xs text-paper outline-none transition focus:border-cyan"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingCategory}
                  className="w-full rounded-full bg-crim py-3 font-display text-xs uppercase tracking-[0.18em] text-ink font-bold transition hover:bg-cyan disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {savingCategory ? "Ekleniyor..." : "Filtre Kategorisi Ekle"}
                </button>
              </form>
            </div>

            {/* Mevcut Kategoriler Listesi */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-paper/15 bg-ink/60 p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-paper/15 pb-4 mb-4">
                  <h3 className="font-display text-base uppercase text-paper tracking-wider">
                    Aktif Filtreler ve Ürün Türleri ({categories.length})
                  </h3>
                </div>

                <div className="divide-y divide-paper/10">
                  {categories.map((cat: any) => (
                    <div
                      key={cat.id}
                      className="py-3.5 flex flex-wrap items-center justify-between gap-4 transition hover:bg-paper/5 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-cyan bg-cyan/10 border border-cyan/30 px-2.5 py-1 rounded-md">
                          {cat.id}
                        </span>
                        {editingCatId === cat.id ? (
                          <input
                            type="text"
                            value={editingCatLabel}
                            onChange={(e) => setEditingCatLabel(e.target.value)}
                            className="rounded-lg border border-cyan bg-ink px-3 py-1 text-xs text-paper outline-none font-semibold"
                            autoFocus
                          />
                        ) : (
                          <span className="font-display text-sm text-paper font-semibold">
                            {cat.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {editingCatId === cat.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateCategory(cat.id)}
                              disabled={savingCategory}
                              className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/40 transition cursor-pointer"
                            >
                              Kaydet
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="rounded-full border border-paper/20 text-paper/60 px-3 py-1 text-[11px] uppercase tracking-wider hover:text-paper transition cursor-pointer"
                            >
                              İptal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatLabel(cat.label);
                              }}
                              className="rounded-full border border-paper/20 px-3 py-1 text-[11px] uppercase tracking-wider text-paper/70 hover:border-cyan hover:text-cyan transition cursor-pointer"
                            >
                              Düzenle
                            </button>
                            {cat.id !== "all" && (
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="rounded-full border border-crim/30 bg-crim/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-crim hover:bg-crim hover:text-ink transition cursor-pointer"
                              >
                                Sil
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB: KAMPANYALAR & İNDİRİM KODLARI ─── */}
      {tab === "coupons" && (
        <section className="px-6 py-6 lg:px-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl uppercase">Kampanya & İndirim Kodu Yönetimi</h2>
              <p className="text-xs text-paper/50">
                Karmaşık rastgele indirim kodları oluşturabilir, sitede sağ bar kampanya rozetinde görünmesini sağlayabilirsiniz.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCoupon(null);
                setCouponForm({
                  code: `KUREK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                  type: "percentage",
                  value: 10,
                  targetType: "all",
                  targetProductSlug: "",
                  showOnSite: true,
                  siteBannerText: "%10 İNDİRİM",
                  minOrderAmount: 0,
                  usageLimit: 500,
                  expiresAt: "",
                  active: true,
                });
                setShowAddCouponModal(true);
              }}
              className="rounded-full bg-crim px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-ink font-semibold transition hover:bg-cyan shadow-md"
            >
              + Yeni İndirim Kodu Oluştur
            </button>
          </div>

          {coupons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-paper/20 p-12 text-center">
              <p className="text-sm text-paper/50">Henüz tanımlanmış kampanya kodu bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-paper/15 bg-ink/30">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-paper/15 text-[11px] uppercase tracking-[0.18em] text-paper/50 bg-paper/5">
                    <th className="py-3 px-4">Kod</th>
                    <th className="py-3 px-4">İndirim Tipi & Oranı</th>
                    <th className="py-3 px-4">Uygulama Alanı</th>
                    <th className="py-3 px-4">Sitede Rozette Göster</th>
                    <th className="py-3 px-4">Kullanım Sayısı</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c: any) => (
                    <tr key={c.id} className="border-b border-paper/10 transition hover:bg-paper/5">
                      <td className="py-3 px-4 font-mono font-bold text-cyan">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {c.type === "percentage" ? `%${c.value} İndirim` : `₺${c.value} İndirim`}
                        {c.minOrderAmount > 0 && (
                          <span className="block text-[10px] text-paper/40 font-normal">
                            Min. Sepet: ₺{c.minOrderAmount}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-paper/70">
                        {c.targetType === "all" ? (
                          <span className="rounded bg-paper/10 px-2 py-0.5 text-[10px] font-semibold text-paper/80">
                            Tüm Ürünler
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                            Özel Ürün: {c.targetProductSlug}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleCouponShowOnSite(c)}
                          title="Sitede yayına al / gizle"
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                            c.showOnSite
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-paper/10 text-paper/40 border border-paper/20 hover:text-paper"
                          }`}
                        >
                          {c.showOnSite ? `✓ Yayında (${c.siteBannerText || c.code})` : "👁️ Sitede Gizli"}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {c.usageCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : ""}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleCouponActive(c)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                            c.active
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-crim/20 text-crim border border-crim/30"
                          }`}
                        >
                          {c.active ? "Aktif" : "Pasif"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCoupon(c);
                              setCouponForm({
                                code: c.code,
                                type: c.type || "percentage",
                                value: c.value || 10,
                                targetType: c.targetType || "all",
                                targetProductSlug: c.targetProductSlug || "",
                                showOnSite: c.showOnSite ?? false,
                                siteBannerText: c.siteBannerText || "",
                                minOrderAmount: c.minOrderAmount || 0,
                                usageLimit: c.usageLimit || 100,
                                expiresAt: c.expiresAt || "",
                                active: c.active ?? true,
                              });
                              setShowAddCouponModal(true);
                            }}
                            className="rounded-full border border-paper/20 px-3 py-1 text-[10px] uppercase text-paper/70 hover:border-cyan hover:text-cyan"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="rounded-full border border-crim/30 px-3 py-1 text-[10px] uppercase text-crim hover:bg-crim hover:text-ink"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB: iyzico ÖDEME ENTEGRASYONU ─── */}
      {tab === "iyzico" && (
        <section className="px-6 py-6 lg:px-10 max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/15 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-cyan/20 text-cyan text-lg">
                  💳
                </span>
                <h2 className="font-display text-2xl uppercase">iyzico Link ile Ödeme Entegrasyonu</h2>
              </div>
              <p className="mt-1 text-xs text-paper/60">
                Sepet tutarına göre dinamik iyzico ödeme linki oluşturarak kredi kartı, banka kartı ve taksitli tahsilat sağlayın.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  iyzicoSettings.enabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-paper/10 text-paper/40 border border-paper/20"
                }`}
              >
                {iyzicoSettings.enabled ? "● Entegrasyon Aktif" : "○ Entegrasyon Pasif"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider ${
                  iyzicoSettings.mode === "production"
                    ? "bg-crim/20 text-crim border border-crim/30"
                    : "bg-cyan/20 text-cyan border border-cyan/30"
                }`}
              >
                {iyzicoSettings.mode === "production" ? "⚡ Canlı Mod" : "🧪 Sandbox Test"}
              </span>
            </div>
          </div>

          {/* Çalışma Mantığı Açıklama Kartı */}
          <div className="rounded-2xl border border-paper/15 bg-ink/40 p-5 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan mb-3">
              ⚡ Nasıl Çalışır?
            </h3>
            <div className="grid gap-3 sm:grid-cols-4 text-xs text-paper/70">
              <div className="rounded-xl border border-paper/10 bg-paper/5 p-3.5 space-y-1">
                <div className="font-bold text-paper flex items-center gap-1.5">
                  <span>🛒</span> 1. Sepet Hesabı
                </div>
                <p className="text-[11px] text-paper/50 leading-relaxed">
                  Müşteri sepete ürün ekler, kupon girer ve net ödeme tutarı hesaplanır.
                </p>
              </div>
              <div className="rounded-xl border border-paper/10 bg-paper/5 p-3.5 space-y-1">
                <div className="font-bold text-paper flex items-center gap-1.5">
                  <span>🔗</span> 2. Link Üretimi
                </div>
                <p className="text-[11px] text-paper/50 leading-relaxed">
                  iyzico Link API'sine HMAC-SHA256 imzasıyla sipariş tutarı gönderilir ve anında özel link üretilir.
                </p>
              </div>
              <div className="rounded-xl border border-paper/10 bg-paper/5 p-3.5 space-y-1">
                <div className="font-bold text-paper flex items-center gap-1.5">
                  <span>🔒</span> 3. 3D Güvenli Ödeme
                </div>
                <p className="text-[11px] text-paper/50 leading-relaxed">
                  Müşteri iyzico arayüzünde kart bilgilerini girerek güvenle ödemeyi tamamlar.
                </p>
              </div>
              <div className="rounded-xl border border-paper/10 bg-paper/5 p-3.5 space-y-1">
                <div className="font-bold text-paper flex items-center gap-1.5">
                  <span>📋</span> 4. Panel & Takip
                </div>
                <p className="text-[11px] text-paper/50 leading-relaxed">
                  Oluşan link sipariş detayında saklanır, müşteri dilediğinde linke tekrar erişebilir.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ayarlar Formu */}
            <div className="lg:col-span-2 rounded-2xl border border-paper/15 bg-ink/50 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-paper/10 pb-3">
                <h3 className="font-display text-base uppercase text-paper tracking-wide">
                  iyzico API Bağlantı Ayarları
                </h3>
                <span className="text-[10px] text-paper/40 font-mono">IYZWSv2 Standardı</span>
              </div>

              {iyzicoSaveMsg && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold animate-pulse">
                  {iyzicoSaveMsg}
                </div>
              )}

              <form onSubmit={handleSaveIyzico} className="space-y-4">
                {/* Entegrasyon Aç/Kapa */}
                <div className="flex items-center justify-between rounded-xl border border-paper/10 bg-paper/5 p-4">
                  <div>
                    <label className="text-sm font-bold text-paper block cursor-pointer">
                      iyzico Link ile Ödemeyi Etkinleştir
                    </label>
                    <p className="text-xs text-paper/50">
                      Aktif olduğunda sepet onayında otomatik olarak iyzico ödeme linki üretilir.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={iyzicoSettings.enabled}
                    onChange={(e) =>
                      setIyzicoSettings({ ...iyzicoSettings, enabled: e.target.checked })
                    }
                    className="size-5 accent-cyan cursor-pointer"
                  />
                </div>

                {/* Mod Seçimi */}
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                    Çalışma Ortamı (Mod)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIyzicoSettings({ ...iyzicoSettings, mode: "sandbox" })}
                      className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                        iyzicoSettings.mode === "sandbox"
                          ? "border-cyan bg-cyan/10 text-cyan"
                          : "border-paper/20 bg-paper/5 text-paper/60 hover:text-paper"
                      }`}
                    >
                      <div className="font-bold text-xs uppercase tracking-wider">🧪 Sandbox (Test)</div>
                      <div className="text-[10px] opacity-70 mt-0.5 font-mono">sandbox-api.iyzipay.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIyzicoSettings({ ...iyzicoSettings, mode: "production" })}
                      className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                        iyzicoSettings.mode === "production"
                          ? "border-crim bg-crim/10 text-crim font-bold"
                          : "border-paper/20 bg-paper/5 text-paper/60 hover:text-paper"
                      }`}
                    >
                      <div className="font-bold text-xs uppercase tracking-wider">⚡ Canlı (Production)</div>
                      <div className="text-[10px] opacity-70 mt-0.5 font-mono">api.iyzipay.com</div>
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                    API Key
                  </label>
                  <input
                    type="text"
                    required
                    value={iyzicoSettings.apiKey}
                    onChange={(e) =>
                      setIyzicoSettings({ ...iyzicoSettings, apiKey: e.target.value.trim() })
                    }
                    placeholder="sandbox-..."
                    className="w-full rounded-xl border border-paper/20 bg-ink/90 px-3.5 py-2.5 text-xs font-mono text-paper outline-none focus:border-cyan transition"
                  />
                  <span className="text-[10px] text-paper/40 mt-1 block">
                    iyzico Kontrol Paneli → Ayarlar → Firma Ayarları altındaki API Anahtarı
                  </span>
                </div>

                {/* Secret Key */}
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper/70 font-bold">
                    Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecretKey ? "text" : "password"}
                      required
                      value={iyzicoSettings.secretKey}
                      onChange={(e) =>
                        setIyzicoSettings({ ...iyzicoSettings, secretKey: e.target.value.trim() })
                      }
                      placeholder="sandbox-..."
                      className="w-full rounded-xl border border-paper/20 bg-ink/90 px-3.5 py-2.5 pr-10 text-xs font-mono text-paper outline-none focus:border-cyan transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3 top-2.5 text-xs text-paper/50 hover:text-paper cursor-pointer"
                    >
                      {showSecretKey ? "🙈 Gizle" : "👁️ Göster"}
                    </button>
                  </div>
                  <span className="text-[10px] text-paper/40 mt-1 block">
                    HMAC-SHA256 istek imzalamada kullanılan gizli anahtar
                  </span>
                </div>

                <div className="pt-2 border-t border-paper/10 flex items-center justify-between">
                  <span className="text-xs text-paper/40">
                    Değişiklikler anında sunucuda aktif olur.
                  </span>
                  <button
                    type="submit"
                    disabled={savingIyzico}
                    className="rounded-full bg-cyan px-6 py-2.5 font-display text-xs uppercase tracking-wider text-ink font-bold hover:bg-paper transition disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {savingIyzico ? "Kaydediliyor..." : "Ayarları Kaydet"}
                  </button>
                </div>
              </form>
            </div>

            {/* Test ve Yardım Alanı */}
            <div className="space-y-6">
              {/* Test Bağlantısı Kartı */}
              <div className="rounded-2xl border border-paper/15 bg-ink/50 p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-paper/10 pb-3">
                  <span className="size-2 rounded-full bg-cyan" />
                  <h3 className="font-display text-sm uppercase text-paper tracking-wide">
                    Entegrasyon Testi
                  </h3>
                </div>
                <p className="text-xs text-paper/60 leading-relaxed">
                  Girdiğiniz API anahtarlarıyla iyzico Link API'sine ₺100 tutarında bir test linki oluşturma isteği gönderin.
                </p>

                <button
                  type="button"
                  disabled={testingIyzico || !iyzicoSettings.apiKey || !iyzicoSettings.secretKey}
                  onClick={handleTestIyzico}
                  className="w-full rounded-xl border border-cyan/40 bg-cyan/10 py-3 text-xs font-bold uppercase tracking-wider text-cyan hover:bg-cyan hover:text-ink transition disabled:opacity-40 cursor-pointer shadow"
                >
                  {testingIyzico ? "Test İsteği Gönderiliyor..." : "🧪 Test Linki Üret (₺100)"}
                </button>

                {iyzicoTestResult && (
                  <div
                    className={`rounded-xl border p-4 text-xs space-y-2 ${
                      iyzicoTestResult.success
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-crim/40 bg-crim/10 text-crim"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {iyzicoTestResult.success ? "✓ Başarılı: iyzico Bağlantısı Kuruldu!" : "✕ Test Başarısız"}
                    </div>
                    {iyzicoTestResult.error && (
                      <p className="text-[11px] font-mono leading-relaxed opacity-90">
                        {iyzicoTestResult.error}
                      </p>
                    )}
                    {iyzicoTestResult.url && (
                      <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400">Üretilen Link:</div>
                        <input
                          type="text"
                          readOnly
                          value={iyzicoTestResult.url}
                          className="w-full rounded-lg bg-ink/80 px-2 py-1.5 text-[11px] font-mono text-cyan select-all outline-none"
                        />
                        <a
                          href={iyzicoTestResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-[11px] text-cyan hover:underline font-semibold"
                        >
                          ↗ Linki Yeni Sekmede Test Et
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hızlı Bilgiler & Linkler */}
              <div className="rounded-2xl border border-paper/15 bg-ink/40 p-5 space-y-3 text-xs text-paper/70">
                <div className="font-bold text-paper flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span>ℹ️</span> Yararlı Bağlantılar
                </div>
                <div className="space-y-2">
                  <a
                    href="https://sandbox-merchant.iyzipay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan hover:underline"
                  >
                    ↗ iyzico Sandbox Paneli (Test)
                  </a>
                  <a
                    href="https://merchant.iyzipay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan hover:underline"
                  >
                    ↗ iyzico Canlı Yönetim Paneli
                  </a>
                  <a
                    href="https://docs.iyzico.com/urunler/iyzico-link/iyzico-link-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan hover:underline"
                  >
                    ↗ iyzico Link API Dokümantasyonu
                  </a>
                </div>
              </div>
            </div>
          </div>
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

      {/* ─── MODAL: İNDİRİM KODU OLUŞTUR / DÜZENLE ─── */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-paper/20 bg-ink p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-paper/15 pb-4">
              <h3 className="font-display text-lg uppercase tracking-wide text-paper">
                {editingCoupon ? "İndirim Kodunu Düzenle" : "Yeni İndirim Kodu Oluştur"}
              </h3>
              <button
                onClick={() => setShowAddCouponModal(false)}
                className="text-xs uppercase text-paper/50 hover:text-paper"
              >
                ✕ Kapat
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                  İndirim Kodu *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        code: e.target.value.toUpperCase().trim(),
                      })
                    }
                    placeholder="Örn: KUREK10"
                    className="w-full rounded-xl border border-paper/20 bg-ink px-3.5 py-2.5 font-mono text-sm text-paper uppercase outline-none focus:border-cyan"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomCouponCode}
                    title="Tahmin Edilemeyen Karmaşık Kod Üret"
                    className="rounded-xl border border-cyan/40 bg-cyan/10 px-3 py-2.5 font-bold uppercase tracking-wider text-cyan hover:bg-cyan hover:text-ink transition whitespace-nowrap"
                  >
                    🎲 Karmaşık Kod
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                    İndirim Tipi *
                  </label>
                  <select
                    value={couponForm.type}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, type: e.target.value })
                    }
                    className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-cyan"
                  >
                    <option value="percentage">Yüzde (%) İndirim</option>
                    <option value="fixed">Sabit Tutar (₺) İndirim</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                    İndirim Miktarı *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.value}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        value: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-cyan font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                    Uygulama Kapsamı *
                  </label>
                  <select
                    value={couponForm.targetType}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        targetType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-cyan"
                  >
                    <option value="all">Tüm Ürünlerde Geçerli</option>
                    <option value="product">Sadece Belirli Üründe</option>
                  </select>
                </div>

                {couponForm.targetType === "product" && (
                  <div>
                    <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                      Geçerli Ürün Seçin *
                    </label>
                    <select
                      value={couponForm.targetProductSlug}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          targetProductSlug: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-cyan"
                      required
                    >
                      <option value="">-- Ürün Seçin --</option>
                      {products.map((p: any) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name} ({p.price} ₺)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-paper/15 bg-paper/5 p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.showOnSite}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        showOnSite: e.target.checked,
                      })
                    }
                    className="size-4 rounded accent-cyan"
                  />
                  <span className="font-bold uppercase tracking-wider text-paper">
                    Sitede Sağ Bar Rozetinde Göster (Public Kampanya)
                  </span>
                </label>

                {couponForm.showOnSite && (
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-paper/50">
                      Site Banner Metni (Örn: %10 İNDİRİM)
                    </label>
                    <input
                      type="text"
                      value={couponForm.siteBannerText}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          siteBannerText: e.target.value,
                        })
                      }
                      placeholder="%10 İndirim Fırsatı"
                      className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2 text-paper outline-none focus:border-cyan"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                    Min. Sepet Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.minOrderAmount}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        minOrderAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-cyan font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-paper/70">
                    Kullanım Limiti (Kişi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.usageLimit || ""}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        usageLimit: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="Sınırsız için boş bırakın"
                    className="w-full rounded-xl border border-paper/20 bg-ink px-3 py-2.5 text-paper outline-none focus:border-cyan font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-paper/15 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  className="rounded-full border border-paper/20 px-5 py-2 font-display text-xs uppercase text-paper/70 hover:text-paper"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="rounded-full bg-crim px-6 py-2.5 font-display text-xs uppercase text-ink font-bold hover:bg-cyan transition disabled:opacity-50"
                >
                  {savingCoupon ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
