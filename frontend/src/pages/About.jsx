import React from "react";
import { useT } from "../lib/i18n";
import { Shield, Sparkles, Compass, Heart, Mail, Target, Zap, Globe } from "lucide-react";

export default function About() {
  const { lang } = useT();
  return (
    <div className="min-h-screen bg-black pt-28 pb-24 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[#050510] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,211,238,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-5xl mx-auto px-6 md:px-10">
        {/* Header Section */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-[10px] uppercase tracking-[0.4em] text-cyan-400 mb-6 font-bold shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" /> MISSION PROTOCOL
          </div>
          <h1 className="font-display text-4xl md:text-6xl mb-6 text-white tracking-tight">
            {lang === "TR" ? "GÖKYÜZÜ, HEPİMİZİN" : "THE SKY IS OURS"}
          </h1>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-6" />
          <p className="font-accent italic text-cyan-200/60 text-xl max-w-2xl mx-auto">
            {lang === "TR"
              ? "StarClaim, anıları sonsuza taşımak için doğdu."
              : "StarClaim was born to carry memories into eternity."}
          </p>
        </div>

        {/* Main Mission Block */}
        <div className="glass-dark border border-cyan-500/20 rounded-3xl p-10 mb-12 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
            <Globe className="w-24 h-24 text-cyan-400" />
          </div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30" />
          
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-2xl text-white tracking-widest uppercase">{lang === "TR" ? "Misyonumuz" : "Our Mission"}</h2>
          </div>
          
          <div className="space-y-6 relative z-10">
            <p className="text-cyan-50/80 text-lg leading-relaxed font-light">
              {lang === "TR"
                ? "Bir çiçek solar. Bir kutu küçülür. Ama bir yıldız — o orada kalır. Milyonlarca yıl boyunca, her gece. StarClaim'i sevdiklerimize verebileceğimiz en kalıcı hediyeyi mümkün kılmak için kurduk."
                : "Flowers fade. Boxes shrink. But a star stays — for millions of years, every single night. We founded StarClaim to make the most permanent gift we can give those we love."}
            </p>
            <div className="h-[1px] w-full bg-white/5" />
            <p className="text-cyan-100/70 leading-relaxed italic">
              {lang === "TR"
                ? "Hikayeler, anılar ve mesajlar — hepsi gökyüzüne yazılır. Yapay zeka ile kişiselleştirilir, altın kenarlıklı bir sertifikayla sunulur, Marketplace'te el değiştirir. Her yıldız bir anı taşır."
                : "Stories, memories, messages — all written into the sky. Personalized with AI, delivered as a gold-bordered certificate, passed on through the Marketplace. Every star carries a memory."}
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { ic: Shield, t: lang === "TR" ? "Şeffaflık" : "Transparency", d: lang === "TR" ? "IAU resmi isimlendirme yapmaz — ama StarClaim evreninde kayıtlar sende." : "IAU doesn't officially name stars — but in StarClaim's universe, the record is yours." },
            { ic: Zap, t: lang === "TR" ? "Yapay Zeka" : "AI Powered", d: lang === "TR" ? "Her yıldız için kişisel, duygusal hikaye Claude Sonnet tarafından yazılır." : "Every star gets a personal, emotional story written by Claude Sonnet." },
            { ic: Heart, t: lang === "TR" ? "Sahiplik" : "Ownership", d: lang === "TR" ? "Marketplace üzerinden yıldızını sat. Sadece %10 komisyon, %90 sana." : "Sell your star on Marketplace. Only 10% commission, 90% to you." },
          ].map((c, i) => {
            const Ic = c.ic;
            return (
              <div key={i} className="glass-dark border border-white/5 hover:border-cyan-500/30 rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 group bg-cyan-950/10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                  <Ic className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-display text-xl mb-3 text-white tracking-wide">{c.t}</h3>
                <p className="text-sm text-cyan-200/50 leading-relaxed font-light">{c.d}</p>
              </div>
            );
          })}
        </div>

        {/* Contact Module */}
        <div className="glass-dark border border-cyan-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
          <Mail className="w-8 h-8 text-cyan-400 mx-auto mb-6 animate-bounce" />
          <h2 className="font-display text-3xl mb-4 text-white tracking-widest uppercase">{lang === "TR" ? "İletişim" : "Contact"}</h2>
          <p className="text-cyan-200/60 mb-8 max-w-md mx-auto font-light">
            {lang === "TR" ? "Bir yıldız için özel bir ricamız mı var? Hemen yazın." : "Special request for a star? Drop us a line."}
          </p>
          <a href="mailto:hello@starclaim.net" 
             className="inline-block px-10 py-4 rounded-2xl bg-cyan-500 text-black font-display font-bold uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1 active:scale-95">
            {lang === "TR" ? "BİZE ULAŞIN" : "CONTACT US"}
          </a>
        </div>
      </div>
    </div>
  );
}
