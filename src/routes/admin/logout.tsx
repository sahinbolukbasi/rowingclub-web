import { createFileRoute, redirect } from "@tanstack/react-router";
import { clearAdminSession } from "@/lib/adminSession";

export const Route = createFileRoute("/admin/logout")({
  beforeLoad: async () => {
    clearAdminSession();
    throw redirect({ to: "/admin" });
  },
  component: () => null,
});