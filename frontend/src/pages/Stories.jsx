import React from "react";
import { useT } from "../lib/i18n";
import { 
  Heart, Users, Crown, Radio, Map as MapIcon, Sparkles, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";

const LORE_ENTRIES = [
  {
    id: "CON-01",
    title: "Orion: Göklerin Avcısı",
    titleEn: "Orion: Hunter of the Heavens",
    myth: "Poseidon'un oğlu efsanevi avcı Orion, ölümüyle gökyüzüne yükseldi. Üç kuşak yıldızı (Alnitak, Alnilam, Mintaka), antik çağlardan beri kaşiflerin pusulası olmuştur.",
    mythEn: "The legendary hunter Orion, son of Poseidon, ascended to the stars upon his death. His three belt stars have served as a compass for explorers since antiquity.",
    vision: "StarClaim ekosisteminde Orion, 'Kaşifler' (Explorers) sınıfını temsil eder. Bu bölgeden bir yıldız sahiplenmek, sonsuz arayışın bir parçası olmaktır.",
    visionEn: "In the StarClaim ecosystem, Orion represents the 'Explorers' class. Owning a star here means being part of the eternal quest.",
    img: "https://images.unsplash.com/photo-1464802686167-b939a67e06a1",
    color: "#C9A84C"
  },
  {
    id: "CON-02",
    title: "Ursa Major: Büyük Ayı",
    titleEn: "Ursa Major: The Great Bear",
    myth: "Zeus tarafından bir ayıya dönüştürülen Kallisto'nun hikayesidir. Kuzey Yıldızı'nı (Polaris) bulmak için kullanılan yedi parlak yıldız, gökyüzünün en sadık rehberidir.",
    mythEn: "The story of Callisto, transformed into a bear by Zeus. The seven bright stars used to find the North Star (Polaris) are the most faithful guides of the sky.",
    vision: "Aegis sisteminde Ursa Major, 'Muhafızlar' (Guardians) bölgesidir. Buradaki yıldızlar, ebedi mirasın korunmasını ve yol göstericiliği simgeler.",
    visionEn: "In the Aegis system, Ursa Major is the 'Guardians' sector. Stars here symbolize the protection of eternal legacy and guidance.",
    img: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986",
    color: "#4A90E2"
  },
  {
    id: "CON-03",
    title: "Scorpius: Akrep Kapısı",
    titleEn: "Scorpius: The Scorpion Gate",
    myth: "Orion'un kibirlenmesine karşı gönderilen dev akrep. Mitolojide bu iki takımyıldızı asla aynı anda göremezsiniz; biri doğarken diğeri kaçar.",
    mythEn: "The giant scorpion sent against Orion's hubris. In mythology, you never see these two constellations at once; as one rises, the other flees.",
    vision: "StarVault veritabanında Scorpius, 'Zaman Kapsülleri'nin (Time Capsules) en yoğun olduğu derin uzay geçididir. Gizem ve derinlik arayanlar içindir.",
    visionEn: "In the StarVault database, Scorpius is the deep space passage with the highest density of Time Capsules. For those seeking mystery and depth.",
    img: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78",
    color: "#E94E77"
  }
];

const STORIES = [
  { ic: Heart, title: "Sonsuz Bağ", titleEn: "Eternal Bond", excerpt: "Kız arkadaşıma evlenme teklifi ettiğim gece, o anın tanığı olan yıldızı adına tescil ettirdim. Şimdi her baktığımızda o sözü görüyoruz.", excerptEn: "The night I proposed to my girlfriend, I registered the witness star in her name. Now every time we look up, we see that promise.", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23", code: "ARC-01/LV" },
  { ic: Users, title: "Dostluk Takımı", titleEn: "Friendship Constellation", excerpt: "Lise grubumuzla Pleiades'ten 7 yıldız seçtik. Her birimiz bir yıldızın muhafızıyız. Aramızdaki mesafe ne olursa olsun, gökyüzünde yan yanayız.", excerptEn: "We chose 7 stars from Pleiades with our high school group. Each of us is a guardian of one star. No matter the distance, we are side by side in the sky.", img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", code: "ARC-02/GR" },
  { ic: Crown, title: "Baba Yadigarı", titleEn: "Father's Legacy", excerpt: "Babamın vefatından sonra onun anısına bir yıldız adadım. Aegis AI her yıl ölüm yıldönümünde yıldızın telemetrisini bana özel bir mesajla gönderiyor.", excerptEn: "After my father passed away, I dedicated a star to his memory. Aegis AI sends me the star's telemetry with a special message every year on his anniversary.", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564", code: "ARC-03/MM" },
];

export default function Stories() {
  const { lang, t } = useT();
  const isTR = lang === "TR";

  return (
    <div className="min-h-screen bg-[#010208] pt-28 pb-24 relative overflow-hidden">
      {/* Background Starfield (Static) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        {/* Cinematic Header */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sc-gold/20 bg-sc-gold/5 text-[10px] uppercase tracking-[0.4em] text-sc-gold mb-6 font-bold"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Stellar Archive // Transmissions Active
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display text-5xl md:text-7xl mb-6 gold-gradient-text uppercase tracking-tight"
          >
            {t("stories_title")}
          </motion.h1>
          <p className="text-sc-text-muted/60 max-w-2xl mx-auto uppercase tracking-[0.3em] text-[10px] font-mono leading-relaxed">
            {t("stories_sub")}
          </p>
        </div>

        {/* Section 1: Constellation Lore (The New Content) */}
        <div className="mb-32">
          <div className="flex items-center gap-3 mb-12">
            <MapIcon className="w-5 h-5 text-sc-gold" />
            <h2 className="font-display text-2xl text-white tracking-[0.2em] uppercase">{isTR ? "Takımyıldız" : "Constellation"} <span className="text-sc-gold">{isTR ? "Mitolojisi" : "Mythology"}</span></h2>
          </div>
          
          <div className="space-y-12">
            {LORE_ENTRIES.map((entry, idx) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/5 bg-sc-deep/30 backdrop-blur-xl group hover:border-${entry.color}/30 transition-all duration-500`}
                style={{ borderColor: entry.color + '20' }}
              >
                <div className={`h-80 md:h-auto relative overflow-hidden ${idx % 2 !== 0 ? 'md:order-2' : ''}`}>
                  <img src={entry.img} alt={entry.title} className="w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-80 transition-all duration-[3001ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#010208] via-transparent to-transparent" />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-black/60 border border-white/10 rounded text-[9px] font-mono text-white tracking-[0.2em]">{entry.id}</span>
                  </div>
                </div>
                <div className="p-12 flex flex-col justify-center border-l border-white/5">
                  <div className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: entry.color }}>Ancient Mythology</div>
                  <h3 className="font-display text-3xl mb-6 text-white tracking-tight uppercase">{isTR ? entry.title : entry.titleEn}</h3>
                  
                  <div className="space-y-6">
                     <p className="text-sc-text-muted text-sm leading-relaxed border-l-2 pl-6" style={{ borderLeftColor: entry.color + '40' }}>
                       {isTR ? entry.myth : entry.mythEn}
                     </p>
                     
                     <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[9px] text-sc-gold uppercase tracking-widest font-black mb-3">
                           <Sparkles size={12} /> Aegis Vision
                        </div>
                        <p className="text-[11px] text-sc-text-muted/60 font-mono italic">
                           {isTR ? entry.vision : entry.visionEn}
                         </p>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 2: User Experiences (Restored & Refined) */}
        <div className="mb-32">
          <div className="flex items-center gap-3 mb-12">
            <BookOpen className="w-5 h-5 text-sc-blue" />
            <h2 className="font-display text-2xl text-white tracking-[0.2em] uppercase">{isTR ? "Kaşif" : "Explorer"} <span className="text-sc-blue">{isTR ? "Günlükleri" : "Logs"}</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {STORIES.map((s, i) => {
              const Ic = s.ic;
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-dark border border-white/5 hover:border-sc-blue/40 rounded-2xl overflow-hidden transition-all duration-700 group relative"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img src={s.img} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-[2001ms]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#010208] to-transparent" />
                    <div className="absolute bottom-4 left-6 p-2 rounded-lg bg-sc-blue/10 border border-sc-blue/20">
                      <Ic className="w-4 h-4 text-sc-blue" />
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="font-display text-lg text-white mb-4 tracking-wide group-hover:text-sc-blue transition-colors">{isTR ? s.title : s.titleEn}</h3>
                    <p className="text-sc-text-muted/60 text-xs leading-relaxed italic font-light italic">
                      "{isTR ? s.excerpt : s.excerptEn}"
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Call to Action */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="terminal-frame p-16 text-center border-sc-gold/20 bg-sc-gold/5 relative overflow-hidden"
        >
          <div className="terminal-scanline" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl text-white mb-6 tracking-widest uppercase">{isTR ? "Kendi Hikayeni" : "Write Your Own"} <span className="gold-gradient-text">{isTR ? "Yaz" : "Story"}</span></h2>
            <p className="text-sc-text-muted/70 text-sm font-mono max-w-xl mx-auto mb-10 uppercase tracking-wider">
               {t("stories_cta_sub")}
            </p>
            <button className="btn-gold px-12 py-4 text-xs font-black tracking-[0.4em] uppercase hover:scale-105 transition-transform">
               {t("stories_cta_btn")}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
