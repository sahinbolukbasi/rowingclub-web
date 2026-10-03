import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        sessionStorage.setItem("admin-token", data.token);
        sessionStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("admin-token", data.token);
        localStorage.setItem("admin_session_expires", String(Date.now() + 2 * 60 * 60 * 1000));
        if (data.user) {
          sessionStorage.setItem("admin_user", JSON.stringify(data.user));
          localStorage.setItem("admin_user", JSON.stringify(data.user));
        }

        window.location.href = "/admin/dashboard";
        return;
      } else {
        setError(data.error || "Geçersiz kullanıcı adı veya şifre");
      }
    } catch {
      setError("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl uppercase">Kürek Kulübü Admin</h1>
          <p className="text-paper/60 mt-2">Yönetim paneline giriş yapın</p>
        </div>
        
        <form onSubmit={handleSubmit} className="border border-paper/15 rounded-lg p-8 bg-ink/30 space-y-6" autoComplete="off">
          <div>
            <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Kullanıcı Adı</label>
            <input
              type="text"
              name="admin_login_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan placeholder-paper/30"
              placeholder="Kullanıcı adınızı girin"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Şifre</label>
            <input
              type="password"
              name="admin_login_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan placeholder-paper/30"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          
          {error && (
            <div className="rounded-lg bg-crim/20 border border-crim/40 p-3 text-xs text-crim">{error}</div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-crim py-3.5 font-display text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-cyan disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? "Doğrulanıyor..." : "Giriş Yap"}
          </button>
          
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-paper/40 font-mono">
              <span>🔒</span> Veritabanı Korumalı Güvenli Oturum
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}