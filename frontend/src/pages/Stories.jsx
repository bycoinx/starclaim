import React from "react";
import { useT } from "../lib/i18n";
import { Heart, Gift, Users, GraduationCap, Baby, Crown, TrendingUp, BookOpen } from "lucide-react";

const STORIES = [
  { ic: Heart, title: "Sevgililer için yıldız", excerpt: "Bir yılbaşı gecesi Orion'u işaret ettik. Altı ay sonra oradaki yıldız bize aitti.", img: "https://images.pexels.com/photos/32732569/pexels-photo-32732569.png" },
  { ic: Users, title: "Grup yıldızı", excerpt: "Altı arkadaş, aynı takımyıldızında komşu altı yıldız. Grubumuzun WhatsApp fotoğrafı artık Lyra.", img: "https://images.unsplash.com/photo-1720675009618-a38716724700" },
  { ic: Crown, title: "Anma yıldızı", excerpt: "Babama Betelgeuse'u adadım. Her gece Orion'a baktığımda o bana bakıyor.", img: "https://images.unsplash.com/photo-1749544812189-193ccae5e2f4" },
  { ic: GraduationCap, title: "Mezuniyet hediyesi", excerpt: "Kendime mezun olurken bir yıldız aldım. Hayatımın bu anı, gökyüzünde yıldız olarak duruyor.", img: "https://images.pexels.com/photos/20881655/pexels-photo-20881655.jpeg" },
  { ic: Baby, title: "Bebek yıldızı", excerpt: "Oğlumuz doğduğu gün gökyüzünde ona bir isim bıraktık. Büyüdüğünde ona anlatacağız.", img: "https://images.pexels.com/photos/32732569/pexels-photo-32732569.png" },
  { ic: TrendingUp, title: "Yatırım yıldızı", excerpt: "50 dolara aldığım SC-014 yıldızı üç ay sonra 300 dolara satıldı. Değeri zamanla büyüyor.", img: "https://images.unsplash.com/photo-1720675009618-a38716724700" },
];

const ASTRO = [
  { t: "Bu Gece Gökyüzünde Ne Var?", d: "Bu haftaki gezegen hareketleri, meteor yağmurları ve görünür takımyıldızları." },
  { t: "Orion Neden Bu Kadar Özel?", d: "Üç kuşak yıldızı, efsanevi avcı ve Orion'un gizemli bulutsusu hakkında her şey." },
  { t: "Takımyıldızların Hikayesi", d: "Mitolojiden günümüze — gökyüzündeki 88 takımyıldızı anlatımıyla." },
];

export default function Stories() {
  const { lang } = useT();
  return (
    <div className="min-h-screen bg-sc-deep pt-28 pb-24 relative">
      <div className="absolute inset-0 nebula-bg opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-5">
            <BookOpen className="w-3 h-3" /> Stories
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">{lang === "TR" ? "Gökyüzünde İz Bırakanlar" : "Those Who Left a Mark"}</h1>
          <p className="text-sc-text-muted">{lang === "TR" ? "Gerçek insanlar, gerçek anılar — yıldızlara yazılmış." : "Real people, real memories — written in the stars."}</p>
        </div>

        {/* Featured */}
        <div className="glass-gold rounded-2xl overflow-hidden mb-14 grid md:grid-cols-2" data-testid="featured-story">
          <div className="h-64 md:h-auto relative">
            <img src="https://images.unsplash.com/photo-1749544812189-193ccae5e2f4" alt="Featured" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-sc-deep via-transparent to-transparent" />
          </div>
          <div className="p-10 flex flex-col justify-center">
            <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-4">Featured</div>
            <h2 className="font-display text-3xl mb-4 gold-gradient-text">"Betelgeuse'u Babama Adadım"</h2>
            <p className="font-accent italic text-sc-text/90 leading-relaxed mb-5">
              Babam hayatını kaybettiğinde gökyüzünde ona bir yer istedim. Orion'un omzundaki bu kırmızı dev, onun bana bıraktığı bütün hikayelerin evi oldu. Bir yıldız verdim — ama o bana bir galaksi kadar sessiz, bir o kadar derin bir anı bıraktı…
            </p>
            <div className="text-xs text-sc-text-muted tracking-widest uppercase">— Kemal T., İstanbul · 8 dk okuma</div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {STORIES.map((s, i) => {
            const Ic = s.ic;
            return (
              <div key={i} data-testid={`story-${i}`} className="glass rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform group">
                <div className="h-40 overflow-hidden relative">
                  <img src={s.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-sc-deep to-transparent" />
                  <Ic className="absolute bottom-3 left-3 w-5 h-5 text-sc-gold" strokeWidth={1.3} />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg mb-2">{s.title}</h3>
                  <p className="font-accent italic text-sc-text-muted text-sm leading-relaxed">{s.excerpt}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Astro content */}
        <div>
          <h2 className="font-display text-2xl mb-6">{lang === "TR" ? "Astronomi Rehberi" : "Astronomy Guide"}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {ASTRO.map((a, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-sc-gold/30 transition-colors">
                <h3 className="font-display text-lg mb-2">{a.t}</h3>
                <p className="text-sm text-sc-text-muted leading-relaxed">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
