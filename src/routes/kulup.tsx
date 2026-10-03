import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import boathouseImg from "@/assets/story-boathouse.jpg";
import flatlayImg from "@/assets/story-flatlay.jpg";

export const Route = createFileRoute("/kulup")({
  head: () => ({
    meta: [
      { title: "Hakkımızda — Rowing Club" },
      {
        name: "description",
        content:
          "Küreğe tutkulu insanların tasarımlarla kumaşa ruh kazandırdığı yer. Rowing Club'ın hikâyesi ve tasarım felsefesi.",
      },
      { property: "og:title", content: "Hakkımızda — Rowing Club" },
      {
        property: "og:description",
        content:
          "Küreğe tutkulu insanların tasarımlarla tişörte bir ruh kazandırdığı tasarım kolektifi.",
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
      {/* 1. Hero Manifest Section */}
      <section className="px-6 py-16 lg:px-12 xl:px-16 w-full">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-[#ff5500]">
          — Rowing Club Manifestosu
        </p>
        <h1 className="font-display text-4xl uppercase leading-[1.2] md:leading-[1.12] md:text-6xl lg:text-7xl whitespace-pre-line text-paper">
          {content?.clubTitle || "Küreğin ruhu,\nkumaşın hafızası."}
        </h1>
        <p className="mt-8 max-w-3xl text-lg md:text-xl leading-relaxed text-paper/75 font-light">
          {content?.clubDescription ||
            "Bizler sabahın alacakaranlığında denizle konuşan, suyun ritmini ezbere bilen bir kürek topluluğuyuz. Tasarladığımız her tişört; basit bir tekstil ürünü değil, dalgaların sesini, dümencinin nefesini ve sabah küreğinin o saf tutkusunu üzerinde taşıyan yaşayan birer hikâyedir."}
        </p>
      </section>

      {/* 2. Visual Narrative (Edge-to-Edge Full Bleed - Tall Cinematic View) */}
      <section className="w-full pb-16">
        <div className="relative overflow-hidden w-full group">
          <img
            src={imageSrc}
            alt="Rowing Club Boathouse at dawn"
            loading="lazy"
            className="h-[85vh] sm:h-[100vh] lg:h-[115vh] min-h-[720px] max-h-[1300px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 lg:left-16 max-w-3xl">
            <span className="inline-block rounded-full bg-[#ff5500] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink mb-3 shadow-lg">
              Kolektif Felsefe
            </span>
            <p className="font-display text-2xl md:text-4xl lg:text-5xl uppercase tracking-wide text-paper leading-tight drop-shadow-md">
              "Tasarımlarımız masa başında değil, sabah antrenmanından sonra kulüp iskelesinde doğar."
            </p>
          </div>
        </div>
      </section>

      {/* 3. "Kumaşa Ruh Kazandıran Tutku" (The 3 Creative Pillars) */}
      <section className="border-t border-paper/15 px-6 py-20 lg:px-12 xl:px-16 w-full">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan mb-2">
            — Kürekçiden Tasarımcıya
          </p>
          <h2 className="font-display text-3xl md:text-5xl uppercase text-paper tracking-wide">
            Kumaşa Can Veren Tutku
          </h2>
        </div>

        <div className="grid gap-8 lg:gap-10 md:grid-cols-3">
          <div className="group rounded-2xl border border-paper/20 bg-ink/50 p-8 md:p-10 transition-all hover:border-[#ff5500]/50 hover:bg-ink/80 shadow-xl">
            <span className="font-display text-5xl text-[#ff5500] mb-6 block font-bold">
              01
            </span>
            <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-paper mb-4 group-hover:text-cyan transition-colors">
              Suyla Başlayan İlham
            </h3>
            <p className="text-base md:text-lg leading-relaxed text-paper/90 font-normal">
              Fikirlerimiz çizim masasında değil, sabahın 06:00'sında suyun üzerinde şekillenir. Palanın suya girdiği o anki dinginlik, dalgaların oluşturduğu geometrik izler ve dümencinin sesi grafiklerimize can verir.
            </p>
          </div>

          <div className="group rounded-2xl border border-paper/20 bg-ink/50 p-8 md:p-10 transition-all hover:border-[#ff5500]/50 hover:bg-ink/80 shadow-xl">
            <span className="font-display text-5xl text-[#ff5500] mb-6 block font-bold">
              02
            </span>
            <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-paper mb-4 group-hover:text-cyan transition-colors">
              Kürekçinin Kalemi
            </h3>
            <p className="text-base md:text-lg leading-relaxed text-paper/90 font-normal">
              Tasarımcılarımız aynı zamanda bu kulübün lisanslı kürekçileri. Kumaşa neyin yakışacağını, hangi çizginin o sabahki eforun heyecanını taşıyacağını ancak ellerinde kürek nasırı olanlar bilir.
            </p>
          </div>

          <div className="group rounded-2xl border border-paper/20 bg-ink/50 p-8 md:p-10 transition-all hover:border-[#ff5500]/50 hover:bg-ink/80 shadow-xl">
            <span className="font-display text-5xl text-[#ff5500] mb-6 block font-bold">
              03
            </span>
            <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-paper mb-4 group-hover:text-cyan transition-colors">
              Yaşayan Kumaşlar
            </h3>
            <p className="text-base md:text-lg leading-relaxed text-paper/90 font-normal">
              Bir tişört sadece giyilmez; kürekçinin karakterini, denizin kokusunu ve o günkü zaferin anısını taşır. Ağır gramajlı organik pamuğa işlenen her detay, yaşayan bir kulüp hatırasıdır.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Craft & Atelier Section (Krem/Paper Zemin) */}
      <section className="bg-paper px-6 py-20 text-ink lg:px-12 xl:px-16 w-full">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#ff5500]">
              — Atölye & Zanaat
            </p>
            <h2 className="font-display text-3xl uppercase leading-[1.1] md:text-5xl lg:text-6xl text-ink">
              Sabahın disiplini, akşamın dikişi.
            </h2>
            <p className="mt-6 leading-relaxed text-ink/80 text-base md:text-lg">
              Her tişört 220 gsm ağır dokuma organik pamuktan kesilir. Baskılar sınırlı partiler halinde, kulüp atölyesinde özenle uygulanır. Dikişler kürek çekerken sürtünmeyecek noktalara oturur; formlar küreğin dinamik hareketine uyum sağlar.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <span className="size-2 rounded-full bg-[#ff5500]" />
              <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-ink/70">
                100% Organik Pamuk · Kulüp İçi Özel Üretim
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-2xl">
            <img
              src={flatlayImg}
              alt="Tişört zanaat detayları"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* 5. Values Section */}
      <section className="px-6 py-20 lg:px-12 xl:px-16 w-full">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan mb-2">
            — Değerlerimiz
          </p>
          <h2 className="font-display text-3xl uppercase md:text-4xl text-paper">
            Bizi Bir Arada Tutan İnançlar
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              t: "Tutku",
              d: "Kürek sadece bir spor değil, bir yaşam biçimi. Çizgilerimiz bu tutkunun tuvale ve kumaşa dökülmüş halidir.",
            },
            {
              t: "Özgünlük",
              d: "Modanın geçici akımlarını değil; denizin kalıcı sadeliğini ve kürekçinin asi, yalın karakterini tasarlarız.",
            },
            {
              t: "Kolektif Ruh",
              d: "Her tasarım ortak bir aidiyetin sembolüdür. Giydiğiniz şey bir logodan fazlası; suya gönül verenlerin ortak sesidir.",
            },
          ].map((v) => (
            <div key={v.t} className="border-t-2 border-paper/30 pt-6">
              <h3 className="font-display text-2xl md:text-3xl uppercase text-[#ff5500] tracking-wider mb-3">
                {v.t}
              </h3>
              <p className="text-base md:text-lg leading-relaxed text-paper/90 font-normal">
                {v.d}
              </p>
            </div>
          ))}
        </div>

        {/* 6. Call To Action Banner */}
        <div className="mt-20 rounded-2xl border border-paper/15 bg-gradient-to-r from-ink via-teal/20 to-ink p-10 md:p-14 text-center shadow-2xl">
          <h3 className="font-display text-3xl md:text-4xl uppercase text-paper mb-4">
            Bu Ruhu Üzerinizde Taşıyın
          </h3>
          <p className="text-paper/70 max-w-xl mx-auto mb-8 text-sm md:text-base font-light">
            Sınırlı sayıda üretilen ve küreğin dinamizmini yansıtan koleksiyonumuzu inceleyin.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 rounded-full bg-[#ff5500] px-8 py-4 font-display text-sm uppercase tracking-[0.18em] text-ink font-bold transition hover:bg-cyan hover:text-ink shadow-xl cursor-pointer"
          >
            Koleksiyonu Keşfet →
          </Link>
        </div>
      </section>
    </>
  );
}
