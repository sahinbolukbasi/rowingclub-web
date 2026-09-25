import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION ?? "eu-central-1";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "kurek-products";
const ORDERS_TABLE = process.env.ORDERS_TABLE ?? "kurek-orders";
const CONTACTS_TABLE = process.env.CONTACTS_TABLE ?? "kurek-contacts";
const USERS_TABLE = process.env.USERS_TABLE ?? "kurek-users";
const CONTENT_TABLE = process.env.CONTENT_TABLE ?? "kurek-content";

const DEFAULT_CONTENT = {
  id: "site-content",
  heroTitle: "Kürek\nKulübü",
  heroSubtitle: "Denizi giyin. Her tişört, bir sabah küreği ve tuzlu rüzgar için tasarlandı.",
  heroButtonText: "Mağazaya gir →",
  heroImage: "",
  featuredHeading: "Öne çıkan tişörtler",
  featuredSubtitle: "— Öne çıkanlar",
  storyHeading: "Bir kulüp,\nbir deniz,\nbir giysi.",
  storyDescription: "Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır.",
  storyButtonText: "Hikâyemiz →",
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
};

const _client = new DynamoDBClient({ region: REGION });
const _doc = DynamoDBDocumentClient.from(_client);
const _s3Client = new S3Client({ region: REGION });

const ADMIN_TOKEN = "admin-token-kurek-kulubu";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function checkAuth(request: Request): boolean {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") || request.headers.get("x-admin-token") || "";
  return token === ADMIN_TOKEN;
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const AVAILABLE_COLORS = [
  { name: "Siyah", hex: "#000000" },
  { name: "Beyaz", hex: "#ffffff" },
  { name: "Lacivert", hex: "#17263b" },
  { name: "Kırmızı", hex: "#e23a2e" },
  { name: "Yeşil", hex: "#2d6a4f" },
  { name: "Mavi", hex: "#12707f" },
  { name: "Gri", hex: "#808080" },
  { name: "Krem", hex: "#f3eee2" },
];

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Product model ────────────────────────────────
// stockPerSize: { "S": 5, "M": 10, "L": 3, ... }
// images: string[]
// discount: { type: "percentage"|"fixed", value: number } | null
// visible: boolean - whether the product is visible on the site
// isClosed: boolean - whether the product is closed / out of stock

async function uploadImageToS3(buffer: Uint8Array, fileName: string, contentType: string): Promise<string> {
  const bucketName = process.env.S3_BUCKET_NAME || "kurek-kulubu-assets";
  // Stored in public/assets/products so that CloudFront /assets/* origin serves it directly
  const key = `public/assets/products/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType || "image/jpeg",
  });

  try {
    await _s3Client.send(command);
    return `/assets/products/${fileName}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("S3 yükleme hatası: " + String(error));
  }
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function calculateDiscountedPrice(price: number, discount: { type: string; value: number } | null): number {
  if (!discount || discount.value <= 0) return price;
  if (discount.type === "percentage") return Math.round(price * (1 - discount.value / 100));
  if (discount.type === "fixed") return Math.max(0, price - discount.value);
  return price;
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46">
  <style>
    path, circle { fill: #072042; }
    @media (prefers-color-scheme: dark) {
      path, circle { fill: #FCFAF3; }
    }
  </style>
  <circle cx="27.3" cy="15.41" r="1.353"/>
  <path d="m25.85 16.85c-1.66 0.1-5.1 4.09-5.91 5.8h6.37l0.99-0.27 0.32 0.27h1.49c0.12 0 0.21-0.11 0.15-0.21-0.33-0.59-1.04-1.48-1.8-1.42-0.87 0.11-3.95 0.76-3.95 0.76l3.62-3.1 5.98 1.41-10.73 7.91c-0.87 0.08-1.71 0.37-2.43 0.85l-2.39 1.59c-0.21 0.13-0.19 0.43 0.01 0.56l1.27 0.78c0.19 0.12 0.44 0.11 0.62-0.01l2.38-1.72c0.58-0.41 1-0.94 1.23-1.52l10.83-8.06h0.35c0.25 0 0.43-0.19 0.43-0.44s-0.2-0.46-0.45-0.48l-0.33-0.04c-2.44-0.87-5.39-1.93-6.69-2.41-0.46-0.16-0.93-0.27-1.36-0.25z"/>
  <path d="m28.25 23.25c-8.18-0.02-20.37-0.1-25.1 0.22-0.11 0.01-0.11 0.08-0.01 0.11 2.16 0.73 8.17 1.49 12.37 1.48 3.4-0.07 6.35-0.21 9.8 0.35l2.94-2.16z"/>
  <path d="m30.72 23.22c4.13 0.03 8.57-0.29 11.96-0.7 0.1-0.01 0.14 0.06 0.05 0.12-1.24 0.9-3.53 2.34-5.31 2.73-2.13 0.45-7.05 0.34-9.85 0.17l3.15-2.32z"/>
  <path d="m23.62 26.65c-2.33-0.41-5.27-0.8-7.81-0.8-5.09 0-9.17 1.39-11.01 2.23-0.04 0.02-0.01 0.08 0.03 0.07 1.84-0.55 5.08-1.27 8.44-1.27 3.19 0 6.47 0.44 8.86 0.85l1.49-1.08z"/>
  <path d="m25.62 27.06c2.08 0.47 4.62 0.89 7.07 0.89 3.14 0 5.97-0.73 7.33-1.19 0.04-0.01 0.06 0.04 0.03 0.06-1.82 0.99-5.61 2.35-9.32 2.35-2.35-0.04-4.99-0.56-6.53-0.98l1.42-1.13z"/>
</svg>`;

async function handleApiRoutes(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/favicon.svg") {
    return new Response(FAVICON_SVG, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "public, max-age=86400",
      },
    });
  }

  if (path === "/favicon.ico") {
    return Response.redirect(new URL("/assets/favicon.ico", request.url).toString().replace(url.host, request.headers.get("x-forwarded-host") || url.host), 302);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type,x-admin-token",
      },
    });
  }

  // ─── Products ──────────────────────────────────
  if (path === "/api/products" && request.method === "GET") {
    const result = await _doc.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
    // Filter out invisible products for regular users
    const products = (result.Items ?? []).filter((p: any) => p.visible !== false);
    return jsonResponse(products);
  }

  if (path === "/api/admin/products" && request.method === "GET") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const result = await _doc.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
    return jsonResponse(result.Items ?? []);
  }

  if (path === "/api/admin/products" && request.method === "POST") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const body = await request.json() as any;
    const product = {
      id: genId("prod"),
      ...body,
      visible: body.visible ?? true, // Default to visible
      createdAt: new Date().toISOString(),
    };
    await _doc.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));
    return jsonResponse(product);
  }

  if (path.startsWith("/api/admin/products/") && request.method === "PUT") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const id = path.split("/").pop();
    const body = await request.json() as any;
    const { id: _, ...fields } = body;
    const updateExpr: string[] = [];
    const exprAttrValues: Record<string, unknown> = {};
    const exprAttrNames: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      updateExpr.push(`#${key} = :${key}`);
      exprAttrNames[`#${key}`] = key;
      exprAttrValues[`:${key}`] = value;
    }
    if (updateExpr.length === 0) {
      const existing = await _doc.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }));
      return jsonResponse(existing.Item ?? {});
    }
    const result = await _doc.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpr.join(", ")}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: "ALL_NEW",
    }));
    return jsonResponse(result.Attributes);
  }

  if (path.startsWith("/api/admin/products/") && request.method === "DELETE") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const id = path.split("/").pop();
    await _doc.send(new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { id } }));
    return jsonResponse({ success: true });
  }

  // ─── Orders ────────────────────────────────────
  if (path === "/api/orders" && request.method === "POST") {
    const body = await request.json() as any;
    const order = {
      id: genId("ord"),
      ...body,
      status: "pending",
      statusHistory: [{ status: "pending", date: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    await _doc.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));
    return jsonResponse(order);
  }

  if (path.startsWith("/api/orders/") && request.method === "GET") {
    const id = path.split("/").pop();
    const result = await _doc.send(new GetCommand({ TableName: ORDERS_TABLE, Key: { id } }));
    if (!result.Item) return jsonResponse({ error: "Not found" }, 404);
    const o = result.Item;
    return jsonResponse({ ...o, items: typeof o.items === "string" ? JSON.parse(o.items) : o.items });
  }

  if (path.startsWith("/api/orders/") && request.method === "PUT") {
    const id = path.split("/").pop();
    const body = await request.json() as any;
    const newStatus = body.status;
    const updateExpr = ["#status = :status"];
    const exprAttrValues: Record<string, unknown> = { ":status": newStatus };
    const exprAttrNames: Record<string, string> = { "#status": "status" };

    // Append to statusHistory
    const now = new Date().toISOString();
    updateExpr.push("#history = list_append(if_not_exists(#history, :empty), :newEntry)");
    exprAttrNames["#history"] = "statusHistory";
    exprAttrValues[":empty"] = [];
    exprAttrValues[":newEntry"] = [{ status: newStatus, date: now }];

    if (body.paymentId) {
      updateExpr.push("#paymentId = :paymentId");
      exprAttrNames["#paymentId"] = "paymentId";
      exprAttrValues[":paymentId"] = body.paymentId;
    }

    const result = await _doc.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpr.join(", ")}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: "ALL_NEW",
    }));
    const updated = result.Attributes!;
    return jsonResponse({ ...updated, items: typeof updated.items === "string" ? JSON.parse(updated.items) : updated.items });
  }

  if (path === "/api/admin/orders" && request.method === "GET") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const result = await _doc.send(new ScanCommand({ TableName: ORDERS_TABLE }));
    const orders = (result.Items ?? []).map((o) => ({
      ...o,
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
    }));
    return jsonResponse(orders);
  }

  // ─── Contacts ──────────────────────────────────
  // ─── Contacts ──────────────────────────────────
  if (path === "/api/contact" && request.method === "POST") {
    const body = await request.json() as any;
    const contact = {
      id: genId("cnt"),
      ...body,
      read: false,
      status: "pending", // pending | in_progress | resolved
      createdAt: new Date().toISOString(),
    };
    await _doc.send(new PutCommand({ TableName: CONTACTS_TABLE, Item: contact }));
    return jsonResponse({ success: true, id: contact.id });
  }

  if (path === "/api/admin/contacts" && request.method === "GET") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const result = await _doc.send(new ScanCommand({ TableName: CONTACTS_TABLE }));
    const items = (result.Items ?? []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return jsonResponse(items);
  }

  if (path.startsWith("/api/admin/contacts/") && request.method === "PUT") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const id = path.split("/").pop();
    const body = await request.json() as any;
    const updateExpr: string[] = [];
    const exprAttrValues: Record<string, unknown> = {};
    const exprAttrNames: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (key === "id" || value === undefined) continue;
      updateExpr.push(`#${key} = :${key}`);
      exprAttrNames[`#${key}`] = key;
      exprAttrValues[`:${key}`] = value;
    }
    if (updateExpr.length > 0) {
      await _doc.send(new UpdateCommand({
        TableName: CONTACTS_TABLE,
        Key: { id },
        UpdateExpression: `SET ${updateExpr.join(", ")}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
      }));
    }
    return jsonResponse({ success: true });
  }

  if (path.startsWith("/api/admin/contacts/") && request.method === "DELETE") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const id = path.split("/").pop();
    await _doc.send(new DeleteCommand({ TableName: CONTACTS_TABLE, Key: { id } }));
    return jsonResponse({ success: true });
  }

  // ─── Users Management ───────────────────────────
  if (path === "/api/admin/users" && request.method === "GET") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    let customUsers: any[] = [];
    try {
      const result = await _doc.send(new ScanCommand({ TableName: USERS_TABLE }));
      customUsers = (result.Items ?? []).map((u: any) => {
        const { password: _, ...safeUser } = u;
        return safeUser;
      });
    } catch (e) {
      console.warn("Could not scan users table:", e);
    }
    const defaultUser = {
      id: "admin-root",
      username: "admin",
      name: "Sistem Yöneticisi",
      role: "Süper Admin",
      createdAt: "2026-09-01T00:00:00.000Z",
      isDefault: true,
    };
    return jsonResponse([defaultUser, ...customUsers]);
  }

  if (path === "/api/admin/users" && request.method === "POST") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const body = await request.json() as any;
    if (!body.username || !body.password) {
      return jsonResponse({ error: "Kullanıcı adı ve şifre zorunludur" }, 400);
    }
    const user = {
      id: genId("usr"),
      username: body.username.trim(),
      password: body.password.trim(),
      name: body.name || body.username,
      role: body.role || "Admin",
      createdAt: new Date().toISOString(),
    };
    await _doc.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
    const { password: _, ...safeUser } = user;
    return jsonResponse(safeUser);
  }

  if (path.startsWith("/api/admin/users/") && request.method === "DELETE") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const id = path.split("/").pop();
    if (id === "admin-root") {
      return jsonResponse({ error: "Varsayılan yönetici hesabı silinemez" }, 400);
    }
    await _doc.send(new DeleteCommand({ TableName: USERS_TABLE, Key: { id } }));
    return jsonResponse({ success: true });
  }

  if (path === "/api/admin/auth/login" && request.method === "POST") {
    const body = await request.json() as { username?: string; password?: string };
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    if (username === "admin" && password === "admin123") {
      return jsonResponse({
        success: true,
        token: ADMIN_TOKEN,
        user: { username: "admin", name: "Sistem Yöneticisi", role: "Süper Admin" },
      });
    }

    try {
      const result = await _doc.send(new ScanCommand({ TableName: USERS_TABLE }));
      const found = (result.Items ?? []).find(
        (u: any) => u.username === username && u.password === password
      );
      if (found) {
        return jsonResponse({
          success: true,
          token: ADMIN_TOKEN,
          user: { username: found.username, name: found.name, role: found.role },
        });
      }
    } catch (e) {
      console.error("Login verification error:", e);
    }

    return jsonResponse({ error: "Kullanıcı adı veya şifre hatalı" }, 401);
  }

  // ─── Image Upload (JSON base64 & multipart supported) ─
  if (path === "/api/admin/upload-image" && request.method === "POST") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    
    try {
      const cType = request.headers.get("content-type") || "";
      let buffer: Uint8Array;
      let fileName: string = `image-${Date.now()}.jpg`;
      let contentType: string = "image/jpeg";

      if (cType.includes("application/json")) {
        const json = await request.json() as { fileName?: string; contentType?: string; data: string };
        if (!json.data) return jsonResponse({ error: "Görsel verisi bulunamadı" }, 400);
        if (json.fileName) fileName = json.fileName;
        if (json.contentType) contentType = json.contentType;
        const b64 = json.data.includes(",") ? json.data.split(",")[1]! : json.data;
        buffer = Uint8Array.from(Buffer.from(b64, "base64"));
      } else {
        const formData = await request.formData();
        const file = formData.get("image") as File | null;
        if (!file) return jsonResponse({ error: "Görsel dosyası seçilmedi" }, 400);
        buffer = new Uint8Array(await file.arrayBuffer());
        fileName = file.name;
        contentType = file.type || "image/jpeg";
      }

      const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const imageUrl = await uploadImageToS3(buffer, safeFileName, contentType);
      return jsonResponse({ url: imageUrl, success: true });
    } catch (error) {
      console.error("Image upload error:", error);
      return jsonResponse({ error: "Resim yükleme hatası: " + String(error) }, 500);
    }
  }

  // ─── Site Content (Texts & Banners) ──────────────
  if (path === "/api/content" && request.method === "GET") {
    try {
      const result = await _doc.send(new GetCommand({ TableName: CONTENT_TABLE, Key: { id: "site-content" } }));
      if (result.Item) {
        return jsonResponse({ ...DEFAULT_CONTENT, ...result.Item });
      }
    } catch (e) {
      console.warn("Could not get content from table:", e);
    }
    return jsonResponse(DEFAULT_CONTENT);
  }

  if (path === "/api/admin/content" && request.method === "GET") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    try {
      const result = await _doc.send(new GetCommand({ TableName: CONTENT_TABLE, Key: { id: "site-content" } }));
      if (result.Item) {
        return jsonResponse({ ...DEFAULT_CONTENT, ...result.Item });
      }
    } catch (e) {
      console.warn("Could not get content from table:", e);
    }
    return jsonResponse(DEFAULT_CONTENT);
  }

  if (path === "/api/admin/content" && (request.method === "PUT" || request.method === "POST")) {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const body = await request.json() as any;
    const content = {
      ...DEFAULT_CONTENT,
      ...body,
      id: "site-content",
      updatedAt: new Date().toISOString(),
    };
    await _doc.send(new PutCommand({ TableName: CONTENT_TABLE, Item: content }));
    return jsonResponse(content);
  }

  // ─── Config / sizes+colors ─────────────────────
  if (path === "/api/config" && request.method === "GET") {
    return jsonResponse({ sizes: ALL_SIZES, colors: AVAILABLE_COLORS });
  }

  // ─── Seed ──────────────────────────────────────
  if (path === "/api/admin/seed" && request.method === "POST") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const existing = await _doc.send(new ScanCommand({ TableName: PRODUCTS_TABLE, Limit: 1 }));
    if (existing.Items && existing.Items.length > 0) return jsonResponse({ seeded: false });

    const defaults = [
      { slug: "sabah-kuregi", name: "Sabah Küreği", price: 420, images: ["/assets/product-sabah-kuregi-Bkq_K95v.jpg","/assets/hero-rowing-ZHauE1S7.jpg","/assets/story-flatlay-jgtCo7x-.jpg"], description: "Kürek kulübü temalı, organik pamuk.", detail: "Sabahın ilk ışığında suya değen kürek ilhamlı baskı. Ağır dokuma organik pamuk, 220 gsm.", colors: [{ name: "Lacivert", hex: "#17263b" }, { name: "Krem", hex: "#f3eee2" }, { name: "Teal", hex: "#12707f" }], sizes: ["S","M","L","XL"], stockPerSize: { S: 10, M: 15, L: 15, XL: 10 }, tag: "Yeni", category: "tisort", discount: null },
      { slug: "tuzlu-ruzgar", name: "Tuzlu Rüzgâr", price: 460, images: ["/assets/product-tuzlu-ruzgar-DHFNBEZT.jpg","/assets/hero-rowing-ZHauE1S7.jpg","/assets/story-boathouse-BK0J12HW.jpg"], description: "Deniz küreği temalı baskı, ağır dokuma.", detail: "Sis perdesini yırtan bir tekne gövdesinden esinlenmiş grafik.", colors: [{ name: "Teal", hex: "#12707f" }, { name: "Lacivert", hex: "#17263b" }, { name: "Kum", hex: "#c9b99a" }], sizes: ["S","M","L","XL","XXL"], stockPerSize: { S: 5, M: 10, L: 10, XL: 5, XXL: 3 }, tag: null, category: "tisort", discount: null },
      { slug: "kurekci", name: "Kürekçi", price: 390, images: ["/assets/product-kurekci-B-g-fiXL.jpg","/assets/story-flatlay-jgtCo7x-.jpg","/assets/story-boathouse-BK0J12HW.jpg"], description: "Kulüp arması, sınırlı baskı.", detail: "Kulüp armasını taşıyan sınırlı baskı seri. Sadece 200 adet üretildi.", colors: [{ name: "Lacivert", hex: "#17263b" }, { name: "Beyaz", hex: "#ffffff" }], sizes: ["S","M","L","XL"], stockPerSize: { S: 5, M: 8, L: 5, XL: 2 }, tag: "Sınırlı", category: "tisort", discount: null },
      { slug: "regatta", name: "Regatta", price: 480, images: ["/assets/product-regatta-EU4vy5E4.jpg","/assets/hero-rowing-ZHauE1S7.jpg","/assets/story-flatlay-jgtCo7x-.jpg"], description: "Yarış startı temalı, dinamik baskı.", detail: "Regatta start çizgisindeki patlayıcı enerjiyi yakalar.", colors: [{ name: "Kırmızı", hex: "#e23a2e" }, { name: "Lacivert", hex: "#17263b" }], sizes: ["S","M","L","XL","XXL"], stockPerSize: { S: 8, M: 12, L: 10, XL: 5, XXL: 3 }, tag: null, category: "tisort", discount: null },
      { slug: "alacakaranlik", name: "Alacakaranlık", price: 440, images: ["/assets/product-alacakaranlik-ChIUwpa5.jpg","/assets/story-boathouse-BK0J12HW.jpg","/assets/story-flatlay-jgtCo7x-.jpg"], description: "Gün batımı silüeti, minimal baskı.", detail: "Alacakaranlıkta kürek çeken bir silüetten esinlenildi.", colors: [{ name: "Kum", hex: "#c9b99a" }, { name: "Lacivert", hex: "#17263b" }, { name: "Teal", hex: "#12707f" }], sizes: ["S","M","L","XL"], stockPerSize: { S: 5, M: 10, L: 8, XL: 5 }, tag: null, category: "tisort", discount: null },
      { slug: "gel-git", name: "Gel-Git", price: 410, images: ["/assets/product-gel-git-41FMUt0x.jpg","/assets/hero-rowing-ZHauE1S7.jpg","/assets/story-boathouse-BK0J12HW.jpg"], description: "Sakin su yüzeyi, ton üstü ton baskı.", detail: "Dalgaların gel-git ritmini taşıyan ton üstü ton baskı.", colors: [{ name: "Teal", hex: "#12707f" }, { name: "Krem", hex: "#f3eee2" }], sizes: ["S","M","L","XL","XXL"], stockPerSize: { S: 10, M: 15, L: 12, XL: 8, XXL: 5 }, tag: null, category: "tisort", discount: null },
    ];

    const puts = defaults.map((p) =>
      _doc.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: { ...p, id: genId("prod"), createdAt: new Date().toISOString() } }))
    );
    await Promise.all(puts);
    return jsonResponse({ seeded: true, count: defaults.length });
  }

  return null;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch { return false; }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const apiResponse = await handleApiRoutes(request);
      if (apiResponse) return apiResponse;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
    }
  },
};
