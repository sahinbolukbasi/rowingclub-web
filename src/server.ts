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

const REGION = process.env.AWS_REGION ?? "eu-central-1";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "kurek-products";
const ORDERS_TABLE = process.env.ORDERS_TABLE ?? "kurek-orders";
const CONTACTS_TABLE = process.env.CONTACTS_TABLE ?? "kurek-contacts";

const _client = new DynamoDBClient({ region: REGION });
const _doc = DynamoDBDocumentClient.from(_client);

const ADMIN_TOKEN = "admin-token-kurek-kulubu";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function checkAuth(request: Request): boolean {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") || "";
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

async function handleApiRoutes(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

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
    return jsonResponse(result.Items ?? []);
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
  if (path === "/api/contact" && request.method === "POST") {
    const body = await request.json() as any;
    const contact = {
      id: genId("cnt"),
      ...body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await _doc.send(new PutCommand({ TableName: CONTACTS_TABLE, Item: contact }));
    return jsonResponse({ success: true });
  }

  if (path === "/api/admin/contacts" && request.method === "GET") {
    if (!checkAuth(request)) return jsonResponse({ error: "Unauthorized" }, 401);
    const result = await _doc.send(new ScanCommand({ TableName: CONTACTS_TABLE }));
    return jsonResponse(result.Items ?? []);
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
