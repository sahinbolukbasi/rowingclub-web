import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import boathouseImg from "@/assets/story-boathouse.jpg";
import flatlayImg from "@/assets/story-flatlay.jpg";

export const Route = createFileRoute("/kulup")({
  head: () => ({
    meta: [
      { title: "Kulüp — Kürek Kulübü" },
      {
        name: "description",
        content:
          "Kürek Kulübü'nün hikâyesi, zanaati ve deniz küreği tutkusu.",
      },
      { property: "og:title", content: "Kulüp — Kürek Kulübü" },
      {
        property: "og:description",
        content: "Kürek Kulübü'nün hikâyesi, zanaati ve deniz küreği tutkusu.",
      },
    ],
  }),
  component: KulupPage,
});

function KulupPage() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then(setContent)
      .catch(() => {});
  }, []);

  const imageSrc = content?.clubImage || boathouseImg;

  return (
    <>
      <section className="px-6 py-12 lg:px-10">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cyan">
          — Kulüp
        </p>
        <h1 className="font-display text-4xl uppercase leading-[0.95] md:text-7xl whitespace-pre-line">
          {content?.clubTitle || "Bir kulüp,\nbir deniz,\nbir giysi."}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/70">
          {content?.clubDescription ||
            "Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır. 1974'ten beri İstanbul sularında kürek çekiyor, her sabah aynı disiplini suya taşıyoruz."}
        </p>
      </section>

      <section className="px-6 py-12 lg:px-10">
        <div className="overflow-hidden rounded-lg">
          <img
            src={imageSrc}
            alt="Boathouse at dawn"
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-paper/15 px-6 py-12 lg:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { n: "1974", l: "Kuruluş" },
            { n: "50", l: "Yıl su üstünde" },
            { n: "06:00", l: "İlk kürek" },
            { n: "200", l: "Sınırlı baskı / seri" },
          ].map((s) => (
            <div key={s.l} className="text-center md:text-left">
              <p className="font-display text-4xl text-crim md:text-5xl">{s.n}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-paper/50">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Craft */}
      <section className="bg-paper px-6 py-16 text-ink lg:px-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-teal">
              — Zanaat
            </p>
            <h2 className="font-display text-3xl uppercase leading-[0.95] md:text-5xl">
              Sabahın disiplini, akşamın dikişi.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink/70">
              Her tişört ağır dokuma organik pamuktan kesilir. Baskılar küçük
              partiler halinde, kulüp atölyesinde yapılır. Dikişler kürek
              çekerken ovmayacak yerlere oturur; etekler koltuğun arkasını geçer.
              Bir tişört bir kış sezonunu atlatamıyorsa raflara hiç gelmez.
            </p>
          </div>
          <img
            src={flatlayImg}
            alt="Tişört flatlay"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-16 lg:px-10">
        <h2 className="mb-10 font-display text-3xl uppercase md:text-4xl">
          Değerlerimiz
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              t: "Disiplin",
              d: "Kürek suya her sabah aynı saatte değer. Biz de öyle.",
            },
            {
              t: "Zanaat",
              d: "Küçük partiler, elle bitiş, numaralandırılmış etiketler.",
            },
            {
              t: "Sorumluluk",
              d: "Organik pamuk, yerel atölye, sıfır stok israfı.",
            },
          ].map((v) => (
            <div key={v.t} className="border-t border-paper/15 pt-6">
              <h3 className="font-display text-xl uppercase text-crim">{v.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-paper/60">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
