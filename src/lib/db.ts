import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION ?? "eu-central-1";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "kurek-products";
const ORDERS_TABLE = process.env.ORDERS_TABLE ?? "kurek-orders";

const client = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(client);

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  description: string;
  detail: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  tag: string | null;
  category: string;
  stock: number;
  createdAt: string;
};

type DbOrder = {
  id: string;
  items: string;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: string;
  paymentId: string | null;
  createdAt: string;
};

function genId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function orderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Product CRUD ───────────────────────────────────────────

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const result = await doc.send(
    new ScanCommand({ TableName: PRODUCTS_TABLE }),
  );
  return (result.Items ?? []) as DbProduct[];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const result = await doc.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: "slug-index",
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": data.slug },
        Limit: 1,
      }),
    );
    return (result.Items?.[0] as DbProduct) ?? null;
  });

export const createProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      price: z.number().positive(),
      image: z.string().default(""),
      description: z.string().default(""),
      detail: z.string().default(""),
      colors: z.array(z.object({ name: z.string(), hex: z.string() })).default([]),
      sizes: z.array(z.string()).default([]),
      tag: z.string().nullable().default(null),
      category: z.string().default("tisort"),
      stock: z.number().int().default(0),
    }),
  )
  .handler(async ({ data }) => {
    const product: DbProduct = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    await doc.send(
      new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }),
    );
    return product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      slug: z.string().optional(),
      name: z.string().optional(),
      price: z.number().positive().optional(),
      image: z.string().optional(),
      description: z.string().optional(),
      detail: z.string().optional(),
      colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
      sizes: z.array(z.string()).optional(),
      tag: z.string().nullable().optional(),
      category: z.string().optional(),
      stock: z.number().int().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
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
      const existing = await doc.send(
        new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
      );
      return existing.Item as DbProduct;
    }

    const result = await doc.send(
      new UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { id },
        UpdateExpression: `SET ${updateExpr.join(", ")}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ReturnValues: "ALL_NEW",
      }),
    );
    return result.Attributes as DbProduct;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await doc.send(
      new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { id: data.id } }),
    );
    return { success: true };
  });

// ─── Order CRUD ─────────────────────────────────────────────

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const result = await doc.send(
    new ScanCommand({ TableName: ORDERS_TABLE }),
  );
  return (result.Items ?? []).map((o) => ({
    ...o,
    items: JSON.parse(o.items as string),
  })) as any[];
});

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await doc.send(
      new GetCommand({ TableName: ORDERS_TABLE, Key: { id: data.id } }),
    );
    if (!result.Item) return null;
    return { ...result.Item, items: JSON.parse(result.Item.items as string) };
  });

export const createOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      items: z.array(
        z.object({
          slug: z.string(),
          name: z.string(),
          price: z.number(),
          size: z.string(),
          color: z.string(),
          qty: z.number(),
        }),
      ),
      total: z.number(),
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      customerPhone: z.string().min(1),
      customerAddress: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const order: DbOrder = {
      id: orderId(),
      items: JSON.stringify(data.items),
      total: data.total,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      status: "pending",
      paymentId: null,
      createdAt: new Date().toISOString(),
    };
    await doc.send(
      new PutCommand({ TableName: ORDERS_TABLE, Item: order }),
    );
    return { ...order, items: JSON.parse(order.items) };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      status: z.enum(["pending", "paid", "shipped", "cancelled"]),
      paymentId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const updateExpr = ["#status = :status"];
    const exprAttrValues: Record<string, unknown> = {
      ":status": data.status,
    };
    const exprAttrNames: Record<string, string> = {
      "#status": "status",
    };

    if (data.paymentId) {
      updateExpr.push("#paymentId = :paymentId");
      exprAttrValues[":paymentId"] = data.paymentId;
      exprAttrNames["#paymentId"] = "paymentId";
    }

    const result = await doc.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { id: data.id },
        UpdateExpression: `SET ${updateExpr.join(", ")}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ReturnValues: "ALL_NEW",
      }),
    );
    const updated = result.Attributes!;
    return { ...updated, items: JSON.parse(updated.items as string) };
  });

// ─── Seed data ──────────────────────────────────────────────

export const seedProducts = createServerFn({ method: "POST" }).handler(async () => {
  const existing = await doc.send(
    new ScanCommand({ TableName: PRODUCTS_TABLE, Limit: 1 }),
  );
  if (existing.Items && existing.Items.length > 0) return { seeded: false };

  const defaults = [
    {
      slug: "sabah-kuregi",
      name: "Sabah Küreği",
      price: 420,
      image: "/product-sabah-kuregi.jpg",
      description: "Kürek kulübü temalı, organik pamuk.",
      detail: "Sabahın ilk ışığında suya değen kürek ilhamlı baskı. Ağır dokuma organik pamuk, 220 gsm.",
      colors: [{ name: "Lacivert", hex: "#17263b" }, { name: "Krem", hex: "#f3eee2" }, { name: "Teal", hex: "#12707f" }],
      sizes: ["S", "M", "L", "XL"],
      tag: "Yeni",
      category: "tisort",
      stock: 50,
    },
    {
      slug: "tuzlu-ruzgar",
      name: "Tuzlu Rüzgâr",
      price: 460,
      image: "/product-tuzlu-ruzgar.jpg",
      description: "Deniz küreği temalı baskı, ağır dokuma.",
      detail: "Sis perdesini yırtan bir tekne gövdesinden esinlenmiş grafik.",
      colors: [{ name: "Teal", hex: "#12707f" }, { name: "Lacivert", hex: "#17263b" }, { name: "Kum", hex: "#c9b99a" }],
      sizes: ["S", "M", "L", "XL", "XXL"],
      tag: null,
      category: "tisort",
      stock: 30,
    },
    {
      slug: "kurekci",
      name: "Kürekçi",
      price: 390,
      image: "/product-kurekci.jpg",
      description: "Kulüp arması, sınırlı baskı.",
      detail: "Kulüp armasını taşıyan sınırlı baskı seri. Sadece 200 adet üretildi.",
      colors: [{ name: "Lacivert", hex: "#17263b" }, { name: "Beyaz", hex: "#f5f1e6" }],
      sizes: ["S", "M", "L", "XL"],
      tag: "Sınırlı",
      category: "tisort",
      stock: 20,
    },
    {
      slug: "regatta",
      name: "Regatta",
      price: 480,
      image: "/product-regatta.jpg",
      description: "Yarış startı temalı, dinamik baskı.",
      detail: "Regatta start çizgisindeki patlayıcı enerjiyi yakalar.",
      colors: [{ name: "Crimson", hex: "#e23a2e" }, { name: "Lacivert", hex: "#17263b" }],
      sizes: ["S", "M", "L", "XL", "XXL"],
      tag: null,
      category: "tisort",
      stock: 35,
    },
    {
      slug: "alacakaranlik",
      name: "Alacakaranlık",
      price: 440,
      image: "/product-alacakaranlik.jpg",
      description: "Gün batımı silüeti, minimal baskı.",
      detail: "Alacakaranlıkta kürek çeken bir silüetten esinlenildi.",
      colors: [{ name: "Kum", hex: "#c9b99a" }, { name: "Lacivert", hex: "#17263b" }, { name: "Teal", hex: "#12707f" }],
      sizes: ["S", "M", "L", "XL"],
      tag: null,
      category: "tisort",
      stock: 25,
    },
    {
      slug: "gel-git",
      name: "Gel-Git",
      price: 410,
      image: "/product-gel-git.jpg",
      description: "Sakin su yüzeyi, ton üstü ton baskı.",
      detail: "Dalgaların gel-git ritmini taşıyan ton üstü ton baskı.",
      colors: [{ name: "Teal", hex: "#12707f" }, { name: "Krem", hex: "#f3eee2" }],
      sizes: ["S", "M", "L", "XL", "XXL"],
      tag: null,
      category: "tisort",
      stock: 40,
    },
  ];

  const puts = defaults.map((p) =>
    doc.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: { ...p, id: genId(), createdAt: new Date().toISOString() },
      }),
    ),
  );
  await Promise.all(puts);
  return { seeded: true, count: defaults.length };
});