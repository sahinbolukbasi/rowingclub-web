import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const adminLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      username: z.string(),
      password: z.string(),
    }),
  )
  .handler(() => {
    // Admin login is handled via /api/admin/auth/login with database verification
    return { success: false, token: null, error: "Use API endpoint" };
  });

export const verifyAdminToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(() => {
    return { valid: false };
  });