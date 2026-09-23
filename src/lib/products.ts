import sabahKuregi from "@/assets/product-sabah-kuregi.jpg";
import tuzluRuzgar from "@/assets/product-tuzlu-ruzgar.jpg";
import kurekci from "@/assets/product-kurekci.jpg";
import regatta from "@/assets/product-regatta.jpg";
import alacakaranlik from "@/assets/product-alacakaranlik.jpg";
import gelGit from "@/assets/product-gel-git.jpg";

export type Product = {
  slug: string;
  name: string;
  price: number;
  image: string;
  description: string;
  detail: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  tag?: string;
};

export const products: Product[] = [
  {
    slug: "sabah-kuregi",
    name: "Sabah Küreği",
    price: 420,
    image: sabahKuregi,
    description: "Kürek kulübü temalı, organik pamuk.",
    detail:
      "Sabahın ilk ışığında suya değen kürek ilhamlı baskı. Ağır dokuma organik pamuk, 220 gsm. Üst düzey konfor için fırçalanmış iç yüzey.",
    colors: [
      { name: "Lacivert", hex: "#17263b" },
      { name: "Krem", hex: "#f3eee2" },
      { name: "Teal", hex: "#12707f" },
    ],
    sizes: ["S", "M", "L", "XL"],
    tag: "Yeni",
  },
  {
    slug: "tuzlu-ruzgar",
    name: "Tuzlu Rüzgâr",
    price: 460,
    image: tuzluRuzgar,
    description: "Deniz küreği temalı baskı, ağır dokuma.",
    detail:
      "Sis perdesini yırtan bir tekne gövdesinden esinlenmiş grafik. Deniz küreği ritmini taşıyan, tuzlu rüzgâra dayanıklı kumaş.",
    colors: [
      { name: "Teal", hex: "#12707f" },
      { name: "Lacivert", hex: "#17263b" },
      { name: "Kum", hex: "#c9b99a" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    slug: "kurekci",
    name: "Kürekçi",
    price: 390,
    image: kurekci,
    description: "Kulüp arması, sınırlı baskı.",
    detail:
      "Kulüp armasını taşıyan sınırlı baskı seri. Sadece 200 adet üretildi. Her tişört numaralandırılmış etiketle gelir.",
    colors: [
      { name: "Lacivert", hex: "#17263b" },
      { name: "Beyaz", hex: "#f5f1e6" },
    ],
    sizes: ["S", "M", "L", "XL"],
    tag: "Sınırlı",
  },
  {
    slug: "regatta",
    name: "Regatta",
    price: 480,
    image: regatta,
    description: "Yarış startı temalı, dinamik baskı.",
    detail:
      "Regatta start çizgisindeki patlayıcı enerjiyi yakalar. Hareketli kompozisyon, yüksek kontrast baskı. Yarış günü için tasarlandı.",
    colors: [
      { name: "Crimson", hex: "#e23a2e" },
      { name: "Lacivert", hex: "#17263b" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    slug: "alacakaranlik",
    name: "Alacakaranlık",
    price: 440,
    image: alacakaranlik,
    description: "Gün batımı silüeti, minimal baskı.",
    detail:
      "Alacakaranlıkta kürek çeken bir silüetten esinlenildi. Sıcak tonların soğuk suyla buluştuğu an. Minimal, zarif hat.",
    colors: [
      { name: "Kum", hex: "#c9b99a" },
      { name: "Lacivert", hex: "#17263b" },
      { name: "Teal", hex: "#12707f" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    slug: "gel-git",
    name: "Gel-Git",
    price: 410,
    image: gelGit,
    description: "Sakin su yüzeyi, ton üstü ton baskı.",
    detail:
      "Dalgaların gel-git ritmini taşıyan ton üstü ton baskı. Sakin, neredeyse görünmez bir grafik. Günlük kullanım için ideal.",
    colors: [
      { name: "Teal", hex: "#12707f" },
      { name: "Krem", hex: "#f3eee2" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
