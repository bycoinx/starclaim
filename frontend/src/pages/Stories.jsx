import React from "react";
import { useT } from "../lib/i18n";
import { Heart, Users, GraduationCap, Baby, Crown, TrendingUp, Radio, Database, Activity } from "lucide-react";

const STORIES = [
  { ic: Heart, title: "Sevgililer için yıldız", titleEn: "Star for Lovers", excerpt: "Bir yılbaşı gecesi Orion'u işaret ettik. Altı ay sonra oradaki yıldız bize aitti.", excerptEn: "On a New Year's Eve, we pointed at Orion. Six months later, that star was ours.", img: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986", code: "ARC-01/LV" },
  { ic: Users, title: "Grup yıldızı", titleEn: "Group Star", excerpt: "Altı arkadaş, aynı takımyıldızında komşu altı yıldız. Grubumuzun WhatsApp fotoğrafı artık Lyra.", excerptEn: "Six friends, six neighboring stars in the same constellation. Our WhatsApp group photo is now Lyra.", img: "https://images.unsplash.com/photo-1464802686167-b939a67e06a1", code: "ARC-02/GR" },
  { ic: Crown, title: "Anma yıldızı", titleEn: "Memorial Star", excerpt: "Babama Betelgeuse'u adadım. Her gece Orion'a baktığımda o bana bakıyor.", excerptEn: "I dedicated Betelgeuse to my father. Every night I look at Orion, he looks back at me.", img: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78", code: "ARC-03/MM" },
  { ic: GraduationCap, title: "Mezuniyet hediyesi", titleEn: "Graduation Gift", excerpt: "Kendime mezun olurken bir yıldız aldım. Hayatımın bu anı, gökyüzünde yıldız olarak duruyor.", excerptEn: "I bought myself a star when I graduated. This moment of my life stands as a star in the sky.", img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", code: "ARC-04/GD" },
  { ic: Baby, title: "Bebek yıldızı", titleEn: "Newborn Star", excerpt: "Oğlumuz doğduğu gün gökyüzünde ona bir isim bıraktık. Büyüdüğünde ona anlatacağız.", excerptEn: "The day our son was born, we left a name for him in the sky. We'll tell him when he grows up.", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23", code: "ARC-05/NB" },
  { ic: TrendingUp, title: "Yatırım yıldızı", titleEn: "Investment Star", excerpt: "50 dolara aldığım SC-014 yıldızı üç ay sonra 300 dolara satıldı. Değeri zamanla büyüyor.", excerptEn: "The SC-014 star I bought for $50 sold for $300 three months later. Its value grows over time.", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564", code: "ARC-06/IV" },
];

const ASTRO = [
  { t: "Bu Gece Gökyüzünde Ne Var?", tEn: "What's in the Sky Tonight?", d: "Bu haftaki gezegen hareketleri, meteor yağmurları ve görünür takımyıldızları.", dEn: "This week's planetary movements, meteor showers, and visible constellations.", id: "DATA-01" },
  { t: "Orion Neden Bu Kadar Özel?", tEn: "Why is Orion So Special?", d: "Üç kuşak yıldızı, efsanevi avcı ve Orion'un gizemli bulutsusu hakkında her şey.", dEn: "Everything about the three belt stars, the legendary hunter, and Orion's mysterious nebula.", id: "DATA-02" },
  { t: "Takımyıldızların Hikayesi", tEn: "The Story of Constellations", d: "Mitolojiden günümüze — gökyüzündeki 88 takımyıldızı anlatımıyla.", dEn: "From mythology to today — with the narration of the 88 constellations in the sky.", id: "DATA-03" },
];

export default function Stories() {
  const { t, lang } = useT();
  return (
    <div className="min-h-screen bg-transparent pt-28 pb-24 relative overflow-hidden">
      {/* Subtle Overlay */}
      <div className="absolute inset-0 bg-[#020208]/60 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sc-gold/20 bg-sc-gold/5 text-[10px] uppercase tracking-[0.4em] text-sc-gold mb-6 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> COSMIC TRANSMISSIONS
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-4 gold-gradient-text uppercase tracking-tight">
            {t("stories_title")}
          </h1>
          <p className="text-sc-text-muted/70 uppercase tracking-[0.2em] text-[10px] font-mono">
            {t("stories_sub")}
          </p>
        </div>

        {/* Featured Story - HUD Style Refined */}
        <div className="glass-dark border border-white/5 rounded-3xl overflow-hidden mb-16 grid md:grid-cols-2 relative group backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="h-80 md:h-auto relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1749544812189-193ccae5e2f4" alt="Featured" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10" />
            <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2">
              <div className="px-2 py-0.5 bg-sc-gold/80 text-black text-[8px] font-display font-bold rounded">VERIFIED ENTRY</div>
            </div>
          </div>
          
          <div className="p-10 flex flex-col justify-center relative z-10">
            <div className="text-[9px] tracking-[0.3em] uppercase text-sc-gold/60 mb-4">Featured Transmission</div>
            <h2 className="font-display text-3xl mb-6 text-white tracking-tight gold-gradient-text uppercase">{t("stories_featured_title")}</h2>
            <p className="font-accent italic text-sc-text-muted leading-relaxed mb-8 border-l border-sc-gold/20 pl-6 text-sm">
              {t("stories_featured_p")}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-sc-text-muted/50 tracking-[0.2em] uppercase font-mono">{lang === "TR" ? "Kemal T., İstanbul // 08 DK OKUMA" : "Kemal T., Istanbul // 08 MIN READ"}</div>
              <Activity className="w-4 h-4 text-sc-gold/30" />
            </div>
          </div>
        </div>

        {/* Grid of Archive Entries */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {STORIES.map((s, i) => {
            const Ic = s.ic;
            return (
              <div key={i} className="glass-dark border border-white/5 hover:border-sc-gold/40 rounded-2xl overflow-hidden transition-all duration-700 group relative backdrop-blur-sm">
                {/* Kinetic HUD Frame */}
                <div className="absolute inset-0 border-2 border-sc-gold/0 group-hover:border-sc-gold/20 transition-all duration-700 pointer-events-none z-20 rounded-2xl" />
                
                <div className="h-48 overflow-hidden relative">
                  <img src={s.img} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-90 scale-100 group-hover:scale-110 transition-all duration-[2000ms] ease-out" />
                  
                  {/* Atmospheric Moving Stars Overlay */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 pointer-events-none" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  
                  <div className="absolute top-4 right-4 px-2 py-0.5 bg-black/80 border border-sc-gold/30 rounded text-[7px] font-mono text-sc-gold tracking-widest z-20 group-hover:scale-110 transition-transform">
                    {s.code}
                  </div>
                  
                  {/* Bottom Scanline Animation on Hover */}
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-sc-gold/40 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20" />
                </div>
                <div className="p-8 relative z-20">
                  <div className="flex items-center gap-3 mb-4 group-hover:translate-x-1 transition-transform duration-500">
                    <div className="p-1.5 rounded-lg bg-sc-gold/5 border border-sc-gold/20 group-hover:bg-sc-gold/10 transition-colors">
                      <Ic className="w-4 h-4 text-sc-gold/80" />
                    </div>
                    <h3 className="font-display text-lg text-white tracking-wide uppercase group-hover:text-sc-gold transition-colors">{lang === "TR" ? s.title : s.titleEn}</h3>
                  </div>
                  <p className="text-sc-text-muted/60 text-xs leading-relaxed italic font-light line-clamp-3 group-hover:text-sc-text-muted transition-colors">
                    {lang === "TR" ? s.excerpt : s.excerptEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Astronomy Guide */}
        <div className="animate-in fade-in duration-1000">
          <div className="flex items-center gap-3 mb-10">
            <Database className="w-5 h-5 text-sc-gold/60" />
            <h2 className="font-display text-2xl text-white tracking-[0.2em] uppercase gold-gradient-text">{t("stories_guide_title")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ASTRO.map((a, i) => (
              <div key={i} className="glass-dark border border-white/5 rounded-2xl p-8 hover:bg-white/5 hover:border-sc-gold/20 transition-all group relative overflow-hidden backdrop-blur-sm">
                <div className="text-[8px] font-mono text-sc-gold/40 mb-3 tracking-widest">{a.id}</div>
                <h3 className="font-display text-lg mb-3 text-cyan-50 uppercase tracking-wide">
                  {lang === "TR" ? a.t : a.tEn}
                </h3>
                <p className="text-xs text-sc-text-muted/60 leading-relaxed font-light">
                  {lang === "TR" ? a.d : a.dEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
