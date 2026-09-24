import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/content/homepage")({
  component: HomepageEditor,
});

function HomepageEditor() {
  // Mock data - in a real app this would come from a database
  const [homepageContent, setHomepageContent] = useState({
    heroTitle: "Kürek\nKulübü",
    heroSubtitle: "Denizi giyin. Her tişört, bir sabah küreği ve tuzlu rüzgar için tasarlandı.",
    featuredHeading: "Öne çıkan tişörtler",
    clubStory: "Bir kulüp,\nbul deniz,\nbul giysi.",
    clubDescription: "Kürek Kulübü, deniz küreği tutkusunu giyilebilir kılar. Her tasarım kulübün ritmini, sabahın ilk ışığını ve küreğin suya değdiği anı taşır.",
  });

  const handleSave = () => {
    // In a real implementation, this would save to a database
    alert("İçerik kaydedildi!");
  };

  return (
    <div className="min-h-screen bg-ink text-paper p-6">
      <div className="max-w-6xl mx-auto">
        <header className="border-b border-paper/15 py-6 mb-8">
          <h1 className="font-display text-3xl uppercase">Ana Sayfa İçerik Yönetimi</h1>
          <p className="text-paper/60 mt-2">Ana sayfa içeriğini düzenleyin</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hero Section */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Hero Bölümü</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                <textarea
                  value={homepageContent.heroTitle}
                  onChange={(e) => setHomepageContent({...homepageContent, heroTitle: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Alt Başlık</label>
                <textarea
                  value={homepageContent.heroSubtitle}
                  onChange={(e) => setHomepageContent({...homepageContent, heroSubtitle: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Öne Çıkan Ürünler</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                <input
                  type="text"
                  value={homepageContent.featuredHeading}
                  onChange={(e) => setHomepageContent({...homepageContent, featuredHeading: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
            </div>
          </div>

          {/* Club Story */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Kulüp Hikayesi</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                <textarea
                  value={homepageContent.clubStory}
                  onChange={(e) => setHomepageContent({...homepageContent, clubStory: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Açıklama</label>
                <textarea
                  value={homepageContent.clubDescription}
                  onChange={(e) => setHomepageContent({...homepageContent, clubDescription: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="lg:col-span-2 border border-paper/15 rounded-lg p-6">
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