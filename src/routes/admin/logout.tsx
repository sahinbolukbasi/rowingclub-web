import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/logout")({
  beforeLoad: async () => {
    // Clear all admin tokens & sessions thoroughly
    if (typeof window !== "undefined") {
      try {
        const token = sessionStorage.getItem("admin-token") || localStorage.getItem("admin-token");
        if (token) {
          fetch(`/api/admin/auth/logout?t=${token}`, { method: "POST" }).catch(() => {});
        }
      } catch {}
      sessionStorage.clear();
      localStorage.removeItem("admin-token");
      localStorage.removeItem("admin_authenticated");
      localStorage.removeItem("admin_session_expires");
      localStorage.removeItem("admin_user");
    }
    // Redirect to login page
    throw redirect({ to: "/admin" });
  },
  component: () => null, // This route will redirect immediately
});