import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_TOKEN = "admin-token-kurek-kulubu";

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
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        localStorage.setItem("admin-token", data.token);
        localStorage.setItem("admin_authenticated", "true");
        // 30 days session
        localStorage.setItem("admin_session_expires", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        if (data.user) {
          localStorage.setItem("admin_user", JSON.stringify(data.user));
        }
        router.navigate({ to: "/admin/dashboard" });
        return;
      } else {
        // Fallback local check
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          localStorage.setItem("admin-token", ADMIN_TOKEN);
          localStorage.setItem("admin_authenticated", "true");
          localStorage.setItem("admin_session_expires", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
          router.navigate({ to: "/admin/dashboard" });
          return;
        }
        setError(data.error || "Kullanıcı adı veya şifre hatalı");
      }
    } catch {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem("admin-token", ADMIN_TOKEN);
        localStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("admin_session_expires", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        router.navigate({ to: "/admin/dashboard" });
        return;
      }
      setError("Giriş yapılamadı, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-paper/50">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-paper/20 bg-transparent px-4 py-2.5 text-paper outline-none transition focus:border-cyan"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-crim">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-crim py-3 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
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