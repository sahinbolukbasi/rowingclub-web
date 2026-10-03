// Client-side Admin Session Management (2-Hour Persistent Session)

export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 saat (120 dakika)

export function getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("admin-token") || sessionStorage.getItem("admin-token") || "";
  } catch {
    return "";
  }
}

export function getSessionExpires(): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = localStorage.getItem("admin_session_expires") || sessionStorage.getItem("admin_session_expires");
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function isSessionLocallyValid(): boolean {
  const token = getToken();
  if (!token) return false;

  const exp = getSessionExpires();
  // Eğer localStorage süresi tanımlıysa ve şu anı geçmişse oturum bitmiştir
  if (exp && Date.now() > exp) {
    return false;
  }

  // Token Base64 payload'undaki 'exp' bilgisini kontrol et
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonStr);
      if (payload && payload.exp && payload.exp < Date.now()) {
        return false;
      }
    }
  } catch {
    // Decoding yapılamazsa localStorage exp geçerli sayılır
  }

  return true;
}

export function saveAdminSession(token: string, user?: any) {
  if (typeof window === "undefined") return;
  try {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem("admin-token", token);
    localStorage.setItem("admin_session_expires", String(expiresAt));
    localStorage.setItem("admin_authenticated", "true");

    sessionStorage.setItem("admin-token", token);
    sessionStorage.setItem("admin_session_expires", String(expiresAt));
    sessionStorage.setItem("admin_authenticated", "true");

    if (user) {
      localStorage.setItem("admin_user", JSON.stringify(user));
      sessionStorage.setItem("admin_user", JSON.stringify(user));
    }
  } catch (e) {
    console.error("Error saving admin session:", e);
  }
}

export function extendAdminSession(newToken?: string) {
  if (typeof window === "undefined") return;
  try {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem("admin_session_expires", String(expiresAt));
    sessionStorage.setItem("admin_session_expires", String(expiresAt));

    if (newToken) {
      localStorage.setItem("admin-token", newToken);
      sessionStorage.setItem("admin-token", newToken);
    }
  } catch {}
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  try {
    const token = getToken();
    if (token) {
      fetch(`/api/admin/auth/logout?t=${token}`, { method: "POST" }).catch(() => {});
    }
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin_session_expires");
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_user");

    sessionStorage.removeItem("admin-token");
    sessionStorage.removeItem("admin_session_expires");
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_user");
  } catch (e) {
    console.error("Error clearing admin session:", e);
  }
}
