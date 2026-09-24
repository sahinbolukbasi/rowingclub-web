import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/logout")({
  beforeLoad: async () => {
    // Clear authentication
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_authenticated");
    }
    // Redirect to login page
    throw redirect({ to: "/admin/login" });
  },
  component: () => null, // This route will redirect immediately
});