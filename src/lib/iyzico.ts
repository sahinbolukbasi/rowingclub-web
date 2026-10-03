import crypto from "node:crypto";

/**
 * iyzico IYZWSv2 Yetkilendirme Başlığı Üretici
 * Formül:
 *   signature = HMAC-SHA256(randomKey + uriPath + payloadString, secretKey).digest("hex")
 *   authString = "apiKey:" + apiKey + "&randomKey:" + randomKey + "&signature:" + signature
 *   base64Auth = Buffer.from(authString).toString("base64")
 *   Header: "IYZWSv2 " + base64Auth
 */
export function generateIyzWSv2Header(params: {
  apiKey: string;
  secretKey: string;
  uriPath: string;
  body: any;
  randomKey?: string;
}) {
  const randomKey =
    params.randomKey ||
    `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
  const payloadString =
    typeof params.body === "string" ? params.body : JSON.stringify(params.body);
  const hashString = randomKey + params.uriPath + payloadString;
  const signature = crypto
    .createHmac("sha256", params.secretKey)
    .update(hashString)
    .digest("hex");
  const authString = `apiKey:${params.apiKey}&randomKey:${randomKey}&signature:${signature}`;
  const base64Auth = Buffer.from(authString).toString("base64");

  return {
    authorization: `IYZWSv2 ${base64Auth}`,
    randomKey,
  };
}

export type IyziLinkOptions = {
  apiKey?: string;
  secretKey?: string;
  baseUrl?: string;
  isSandbox?: boolean;
  orderId: string;
  total: number;
  customerName?: string;
  items?: Array<{ name: string; qty?: number }>;
  encodedImageFile?: string;
};

export type IyziLinkResult = {
  success: boolean;
  paymentUrl?: string;
  paymentToken?: string;
  error?: string;
  isSimulated?: boolean;
  raw?: any;
};

/**
 * Sepet veya sipariş tutarına göre dinamik iyzico Link (iyzilink) oluşturur.
 * https://docs.iyzico.com/urunler/iyzico-link/iyzico-link-api
 */
export async function createIyziPaymentLink(
  opts: IyziLinkOptions
): Promise<IyziLinkResult> {
  const apiKey = (opts.apiKey || process.env.IYZICO_API_KEY || "").trim();
  const secretKey = (opts.secretKey || process.env.IYZICO_SECRET_KEY || "").trim();
  const isSandbox =
    opts.isSandbox ?? (process.env.IYZICO_MODE === "sandbox" || apiKey.includes("sandbox"));
  const baseUrl =
    opts.baseUrl ||
    (isSandbox ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com");

  if (!apiKey || !secretKey) {
    return {
      success: false,
      error: "iyzico API Key veya Secret Key tanımlı değil.",
      isSimulated: true,
    };
  }

  const uriPath = "/v2/iyzilink/products";
  const price = Number(opts.total).toFixed(2);
  const itemsSummary = (opts.items || [])
    .map((i) => `${i.name}${i.qty && i.qty > 1 ? ` (x${i.qty})` : ""}`)
    .join(", ");
  const description = (
    itemsSummary ? `Kürek Kulübü Sipariş - ${itemsSummary}` : "Kürek Kulübü Sipariş Ödemesi"
  ).slice(0, 240);
  const name = `Kürek Kulübü #${opts.orderId}`.slice(0, 100);

  // 1x1 piksel şeffaf PNG base64 (iyzico görsel alanı zorunludur)
  const defaultBase64Image =
    opts.encodedImageFile ||
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const requestBody = {
    locale: "tr",
    conversationId: `ord_${opts.orderId}`,
    name,
    description,
    price,
    currencyCode: "TRY",
    addressIgnorable: false,
    installmentRequested: false,
    stockEnabled: true,
    stockCount: 1,
    encodedImageFile: defaultBase64Image,
  };

  const { authorization, randomKey } = generateIyzWSv2Header({
    apiKey,
    secretKey,
    uriPath,
    body: requestBody,
  });

  try {
    const res = await fetch(`${baseUrl}${uriPath}`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "x-iyzi-rnd": randomKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (data.status === "success" && data.data?.url) {
      return {
        success: true,
        paymentUrl: data.data.url,
        paymentToken: data.data.token,
        raw: data,
      };
    } else {
      return {
        success: false,
        error:
          data.errorMessage ||
          data.errorCode ||
          "iyzico Link API tarafından ödeme linki oluşturulamadı.",
        raw: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: "iyzico API bağlantı hatası: " + (err.message || String(err)),
    };
  }
}
