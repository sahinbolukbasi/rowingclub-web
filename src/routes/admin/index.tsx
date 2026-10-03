import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getToken,
  isSessionLocallyValid,
  saveAdminSession,
  extendAdminSession,
} from "@/lib/adminSession";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Giriş — Kürek Kulübü" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  // Oturum 2 saat boyunca arka planda tutulur; geçerliyse doğrudan dashboard'a yönlendir
  useEffect(() => {
    if (isSessionLocallyValid()) {
      const token = getToken();
      fetch(`/api/admin/auth/verify?t=${token}&_=${Date.now()}`)
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          if (data.valid) {
            if (data.token) extendAdminSession(data.token);
            window.location.href = "/admin/dashboard";
            return;
          }
          setCheckingSession(false);
        })
        .catch(() => {
          // Çevrimdışı/ağ hatasında oturum süresi henüz dolmadıysa yine de yönlendir
          if (isSessionLocallyValid()) {
            window.location.href = "/admin/dashboard";
            return;
          }
          setCheckingSession(false);
        });
    } else {
      setCheckingSession(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        saveAdminSession(data.token, data.user);
        window.location.href = "/admin/dashboard";
        return;
      } else {
        setError(data.error || "Kullanıcı adı veya şifre hatalı");
      }
    } catch {
      setError("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6">
        <div className="text-center">
          <span className="mx-auto mb-4 block size-3 rounded-full bg-crim animate-pulse" />
          <p className="font-mono text-xs text-paper/60">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 block size-3 rounded-full bg-crim" />
          <h1 className="font-display text-2xl uppercase tracking-wide text-paper">
            Admin
          </h1>
          <p className="mt-2 text-sm text-paper/50">Kürek Kulübü yönetim paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              name="admin_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper placeholder-paper/30 outline-none transition focus:border-cyan"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Şifre
            </label>
            <input
              type="password"
              name="admin_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper placeholder-paper/30 outline-none transition focus:border-cyan"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-crim/20 border border-crim/40 p-3 text-xs text-crim">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-crim py-3 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? "Doğrulanıyor..." : "Giriş Yap"}
          </button>

          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-paper/40 font-mono">
              <span>🔒</span> Veritabanı Korumalı Güvenli Oturum
            </span>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.18em] text-paper/40 transition hover:text-paper"
          >
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}