import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/content/contact")({
  component: ContactEditor,
});

function ContactEditor() {
  // Mock data - in a real app this would come from a database
  const [contactContent, setContactContent] = useState({
    mainTitle: "Bize ulaş.",
    description: "Sipariş, beden rehberi, kulüp üyeliği veya toplu sipariş — ne isterseniz yazın. Cevap aynı gün içinde, en geç ertesi sabah küreğinden önce.",
    contactInfo: [
      { l: "E-posta", v: "merhaba@kurekkulubu.com" },
      { l: "Telefon", v: "+90 212 000 00 00" },
      { l: "Atölye", v: "Boğaz İskelesi 4, İstanbul" },
      { l: "Saatler", v: "Pzt–Cmt · 09:00–18:00" },
    ],
    formTitle: "Mesaj gönder",
    formFields: {
      name: "Ad",
      email: "E-posta",
      subject: "Konu",
      message: "Mesaj",
    }
  });

  const handleSave = () => {
    // In a real implementation, this would save to a database
    alert("İçerik kaydedildi!");
  };

  return (
    <div className="min-h-screen bg-ink text-paper p-6">
      <div className="max-w-6xl mx-auto">
        <header className="border-b border-paper/15 py-6 mb-8">
          <h1 className="font-display text-3xl uppercase">İletişim Sayfası İçerik Yönetimi</h1>
          <p className="text-paper/60 mt-2">İletişim sayfası içeriğini düzenleyin</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Title & Description */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Ana Başlık ve Açıklama</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Başlık</label>
                <input
                  type="text"
                  value={contactContent.mainTitle}
                  onChange={(e) => setContactContent({...contactContent, mainTitle: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Açıklama</label>
                <textarea
                  value={contactContent.description}
                  onChange={(e) => setContactContent({...contactContent, description: e.target.value})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">İletişim Bilgileri</h2>
            <div className="grid grid-cols-1 gap-4">
              {contactContent.contactInfo.map((info, index) => (
                <div key={index} className="border border-paper/10 rounded-md p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={info.l}
                      onChange={(e) => {
                        const newInfo = [...contactContent.contactInfo];
                        newInfo[index].l = e.target.value;
                        setContactContent({...contactContent, contactInfo: newInfo});
                      }}
                      className="w-full rounded-md border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                      placeholder="Başlık"
                    />
                    <input
                      type="text"
                      value={info.v}
                      onChange={(e) => {
                        const newInfo = [...contactContent.contactInfo];
                        newInfo[index].v = e.target.value;
                        setContactContent({...contactContent, contactInfo: newInfo});
                      }}
                      className="w-full rounded-md border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-cyan"
                      placeholder="Değer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="border border-paper/15 rounded-lg p-6">
            <h2 className="font-display text-xl uppercase mb-4">Form Alanları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Ad Alanı</label>
                <input
                  type="text"
                  value={contactContent.formFields.name}
                  onChange={(e) => setContactContent({...contactContent, formFields: {...contactContent.formFields, name: e.target.value}})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">E-posta Alanı</label>
                <input
                  type="text"
                  value={contactContent.formFields.email}
                  onChange={(e) => setContactContent({...contactContent, formFields: {...contactContent.formFields, email: e.target.value}})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Konu Alanı</label>
                <input
                  type="text"
                  value={contactContent.formFields.subject}
                  onChange={(e) => setContactContent({...contactContent, formFields: {...contactContent.formFields, subject: e.target.value}})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.22em] text-paper/50 mb-2">Mesaj Alanı</label>
                <input
                  type="text"
                  value={contactContent.formFields.message}
                  onChange={(e) => setContactContent({...contactContent, formFields: {...contactContent.formFields, message: e.target.value}})}
                  className="w-full rounded-md border border-paper/15 bg-ink px-4 py-3 text-sm text-paper outline-none focus:border-cyan"
                />
              </div>
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