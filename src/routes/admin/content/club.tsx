import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/content/club")({
  component: ClubEditor,
});

function ClubEditor() {
  // Mock data - in a real app this would come from a database
  const [clubContent, setClubContent] = useState({
    mainTitle: "Bir kulüp,\nbul deniz,\nbul giysi.",
    description: "Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır. 1974'ten beri İstanbul sularında kürek çekiyor, her sabah aynı disiplini suya taşıyoruz.",
    stats: [
      { n: "1974", l: "Kuruluş" },
      { n: "50", l: "Yıl su üstünde" },
      { n: "06:00", l: "İlk kürek" },
      { n: "200", l: "Sınırlı baskı / seri" },
    ],
    craftTitle: "Sabahın disiplini, akşamın dikişi.",
    craftDescription: "Her tişört ağır dokuma organik pamuktan kesilir. Baskılar küçük partiler halinde, kulüp atölyesinde yapılır. Dikişler kürek çekerken ovmayacak yerlere oturur; etekler koltuğun arkasını geçer. Bir tişört bir kış sezonunu atlatamıyorsa raflara hiç gelmez.",
    values: [
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
    ],
  });

  const handleSave = () => {
    // In a real implementation, this would save to a database
    alert("İçerik kaydedildi!");
  };

  return (
    <div className="min-h-screen bg-ink text-paper p-6">
      <div className="max-w-6xl mx-auto">
        <header className="border-b border-paper/15 py-6 mb-8">
          <h1 className="font-display text-3xl uppercase">Kulüp Sayfası İçerik Yönetimi</h1>
          <p className="text-paper/60 mt-2">Kulüp sayfası içeriğini düzenleyin</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Title & Description */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Ana Başlık ve Açıklama</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                <textarea
                  value={clubContent.mainTitle}
                  onChange={(e) => setClubContent({...clubContent, mainTitle: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Açıklama</label>
                <textarea
                  value={clubContent.description}
                  onChange={(e) => setClubContent({...clubContent, description: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">İstatistikler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clubContent.stats.map((stat, index) => (
                <div key={index} className="border border-paper/10 rounded-md p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={stat.n}
                      onChange={(e) => {
                        const newStats = [...clubContent.stats];
                        newStats[index].n = e.target.value;
                        setClubContent({...clubContent, stats: newStats});
                      }}
                      className="w-full rounded-md border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                      placeholder="Numara"
                    />
                    <input
                      type="text"
                      value={stat.l}
                      onChange={(e) => {
                        const newStats = [...clubContent.stats];
                        newStats[index].l = e.target.value;
                        setClubContent({...clubContent, stats: newStats});
                      }}
                      className="w-full rounded-md border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                      placeholder="Etiket"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Craft Section */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Zanaat Bölümü</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                <input
                  type="text"
                  value={clubContent.craftTitle}
                  onChange={(e) => setClubContent({...clubContent, craftTitle: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Açıklama</label>
                <textarea
                  value={clubContent.craftDescription}
                  onChange={(e) => setClubContent({...clubContent, craftDescription: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Değerler</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clubContent.values.map((value, index) => (
                <div key={index} className="border border-paper/10 rounded-md p-4">
                  <div className="mb-3">
                    <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                    <input
                      type="text"
                      value={value.t}
                      onChange={(e) => {
                        const newValues = [...clubContent.values];
                        newValues[index].t = e.target.value;
                        setClubContent({...clubContent, values: newValues});
                      }}
                      className="w-full rounded-md border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Açıklama</label>
                    <textarea
                      value={value.d}
                      onChange={(e) => {
                        const newValues = [...clubContent.values];
                        newValues[index].d = e.target.value;
                        setClubContent({...clubContent, values: newValues});
                      }}
                      className="w-full rounded-md border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="border border-paper/15 rounded-lg p-6">
            <div className="flex justify-end gap-4">
              <button className="px-6 py-3 border border-paper/15 text-sm uppercase tracking-[0.22em] transition hover:border-cyan">
                Vazgeç
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-3 rounded-full bg-crim text-sm uppercase tracking-[0.22em] text-ink transition hover:bg-cyan"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}