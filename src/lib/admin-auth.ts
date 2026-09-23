import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Simple admin auth — no session library, just a token check
// In production, use a proper session/JWT library
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export const adminLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      username: z.string(),
      password: z.string(),
    }),
  )
  .handler(({ data }) => {
    if (data.username === ADMIN_USERNAME && data.password === ADMIN_PASSWORD) {
      return { success: true, token: "admin-token-kurek-kulubu" };
    }
    return { success: false, token: null };
  });

export const verifyAdminToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(({ data }) => {
    return { valid: data.token === "admin-token-kurek-kulubu" };
  });