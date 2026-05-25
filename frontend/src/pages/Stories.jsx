import React from "react";
import { useT } from "../lib/i18n";
import { Heart, Gift, Users, GraduationCap, Baby, Crown, TrendingUp, BookOpen, Radio, Database, Activity } from "lucide-react";

const STORIES = [
  { ic: Heart, title: "Sevgililer için yıldız", excerpt: "Bir yılbaşı gecesi Orion'u işaret ettik. Altı ay sonra oradaki yıldız bize aitti.", img: "https://images.pexels.com/photos/32732569/pexels-photo-32732569.png", code: "ARC-01" },
  { ic: Users, title: "Grup yıldızı", excerpt: "Altı arkadaş, aynı takımyıldızında komşu altı yıldız. Grubumuzun WhatsApp fotoğrafı artık Lyra.", img: "https://images.unsplash.com/photo-1720675009618-a38716724700", code: "ARC-02" },
  { ic: Crown, title: "Anma yıldızı", excerpt: "Babama Betelgeuse'u adadım. Her gece Orion'a baktığımda o bana bakıyor.", img: "https://images.unsplash.com/photo-1749544812189-193ccae5e2f4", code: "ARC-03" },
  { ic: GraduationCap, title: "Mezuniyet hediyesi", excerpt: "Kendime mezun olurken bir yıldız aldım. Hayatımın bu anı, gökyüzünde yıldız olarak duruyor.", img: "https://images.pexels.com/photos/20881655/pexels-photo-20881655.jpeg", code: "ARC-04" },
  { ic: Baby, title: "Bebek yıldızı", excerpt: "Oğlumuz doğduğu gün gökyüzünde ona bir isim bıraktık. Büyüdüğünde ona anlatacağız.", img: "https://images.pexels.com/photos/32732569/pexels-photo-32732569.png", code: "ARC-05" },
  { ic: TrendingUp, title: "Yatırım yıldızı", excerpt: "50 dolara aldığım SC-014 yıldızı üç ay sonra 300 dolara satıldı. Değeri zamanla büyüyor.", img: "https://images.unsplash.com/photo-1720675009618-a38716724700", code: "ARC-06" },
];

const ASTRO = [
  { t: "Bu Gece Gökyüzünde Ne Var?", d: "Bu haftaki gezegen hareketleri, meteor yağmurları ve görünür takımyıldızları.", id: "DATA-01" },
  { t: "Orion Neden Bu Kadar Özel?", d: "Üç kuşak yıldızı, efsanevi avcı ve Orion'un gizemli bulutsusu hakkında her şey.", id: "DATA-02" },
  { t: "Takımyıldızların Hikayesi", d: "Mitolojiden günümüze — gökyüzündeki 88 takımyıldızı anlatımıyla.", id: "DATA-03" },
];

export default function Stories() {
  const { lang } = useT();
  return (
    <div className="min-h-screen bg-black pt-28 pb-24 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[#020208] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,211,238,0.2) 1px, transparent 0)', backgroundSize: '30px 30px' }} />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-[10px] uppercase tracking-[0.4em] text-cyan-400 mb-6 font-bold shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> COSMIC TRANSMISSIONS
          </div>
          <h1 className="font-display text-4xl md:text-6xl mb-4 text-white tracking-tight">
            {lang === "TR" ? "GÖKYÜZÜNDE İZ BIRAKANLAR" : "THOSE WHO LEFT A MARK"}
          </h1>
          <p className="text-cyan-200/50 uppercase tracking-[0.2em] text-xs font-mono">
            {lang === "TR" ? "Gerçek insanlar, gerçek anılar — yıldızlara yazılmış." : "Real people, real memories — written in the stars."}
          </p>
        </div>

        {/* Featured Story - HUD Style */}
        <div className="glass-dark border border-cyan-500/20 rounded-3xl overflow-hidden mb-16 grid md:grid-cols-2 relative group backdrop-blur-3xl shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[200%] -translate-y-1/2 animate-scanline pointer-events-none z-20" />
          
          <div className="h-80 md:h-auto relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1749544812189-193ccae5e2f4" alt="Featured" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10" />
            <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2">
              <div className="px-3 py-1 bg-cyan-500 text-black text-[10px] font-display font-bold rounded-md">VERIFIED ENTRY</div>
              <div className="px-3 py-1 bg-black/50 border border-white/20 text-white text-[10px] font-mono rounded-md">REF: ARC-00-RED</div>
            </div>
          </div>
          
          <div className="p-10 flex flex-col justify-center relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="text-[10px] tracking-[0.4em] uppercase text-cyan-400 font-bold">Featured Transmission</div>
            </div>
            <h2 className="font-display text-4xl mb-6 text-white tracking-tight leading-tight">"Betelgeuse'u Babama Adadım"</h2>
            <p className="font-accent italic text-cyan-50/70 text-lg leading-relaxed mb-8 border-l-2 border-cyan-500/30 pl-6">
              Babam hayatını kaybettiğinde gökyüzünde ona bir yer istedim. Orion'un omzundaki bu kırmızı dev, onun bana bıraktığı bütün hikayelerin evi oldu. Bir yıldız verdim — ama o bana bir galaksi kadar sessiz, bir o kadar derin bir anı bıraktı…
            </p>
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-cyan-400/60 tracking-[0.2em] uppercase font-mono">Kemal T., İstanbul // 08 MIN READ</div>
              <Activity className="w-4 h-4 text-cyan-500/40" />
            </div>
          </div>
        </div>

        {/* Grid of Archive Entries */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {STORIES.map((s, i) => {
            const Ic = s.ic;
            return (
              <div key={i} className="glass-dark border border-white/5 hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-all duration-500 group relative">
                <div className="h-48 overflow-hidden relative">
                  <img src={s.img} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4 px-2 py-0.5 bg-black/60 border border-white/10 rounded text-[8px] font-mono text-cyan-400 tracking-widest">
                    {s.code}
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Ic className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-display text-xl mb-3 text-white tracking-wide group-hover:text-cyan-200 transition-colors">{s.title}</h3>
                  <p className="text-cyan-200/40 text-sm leading-relaxed italic font-light line-clamp-2">{s.excerpt}</p>
                </div>
                {/* Decorative Line */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-cyan-500 group-hover:w-full transition-all duration-700" />
              </div>
            );
          })}
        </div>

        {/* Astronomy Guide - Data Terminals */}
        <div className="animate-in fade-in duration-1000">
          <div className="flex items-center gap-3 mb-10">
            <Database className="w-6 h-6 text-cyan-400" />
            <h2 className="font-display text-2xl text-white tracking-[0.2em] uppercase">{lang === "TR" ? "ASTRONOMİ REHBERİ" : "ASTRONOMY GUIDE"}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ASTRO.map((a, i) => (
              <div key={i} className="glass-dark border border-cyan-500/10 rounded-2xl p-8 hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all group relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Radio className="w-24 h-24 text-cyan-400" />
                </div>
                <div className="text-[9px] font-mono text-cyan-500/40 mb-3 tracking-widest">{a.id}</div>
                <h3 className="font-display text-lg mb-3 text-cyan-100 tracking-wide">{a.t}</h3>
                <p className="text-sm text-cyan-200/40 leading-relaxed font-light">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
