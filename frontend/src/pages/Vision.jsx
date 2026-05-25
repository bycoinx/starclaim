import React from "react";
import {
  ArrowUpRight,
  Bot,
  Boxes,
  Globe2,
  KeyRound,
  LockKeyhole,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Stars,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

const tiers = [
  ["Tier 1", "Efsaneviler", "Legendary", "Top 88 ana yıldız, zodyak ve mitolojik olarak yüksek prestijli varlıklar. Açık artırma ve kurumsal koleksiyon modeli.", "Top 88 major stars, zodiac and mythological assets of high prestige. Auction and corporate collection model."],
  ["Tier 2", "Seçkinler", "Elite", "Çıplak gözle net görülen ilk 3.000 yıldız. Fiziksel sertifika, premium AI biyografi ve hediye deneyimi.", "First 3,000 stars clearly visible to the naked eye. Physical certificate, premium AI biography and gift experience."],
  ["Tier 3", "Kaşifler", "Explorers", "Uygulama içinden keşfedilen uygun fiyatlı dijital sahiplikler. Marketplace likiditesi ve topluluk büyümesi için giriş seviyesi.", "Affordable digital ownerships discovered within the app. Entry level for marketplace liquidity and community growth."],
];

const roadmap = [
  ["dNFT", "NASA/ESA verileriyle yıldız parlaklığı ve gök olaylarına tepki veren dinamik NFT görselleri.", "Dynamic NFT visuals reacting to star brightness and celestial events with NASA/ESA data."],
  ["StarClaim Social", "Sahiplerin yıldızları arasında dijital radyo dalgalarıyla mesajlaşabildiği sosyal katman.", "Social layer where owners can message between their stars with digital radio waves."],
  ["Legacy Mode", "Şifreli mesajların 10, 20 veya 50 yıl sonra seçilen bir cüzdana devredildiği miras protokolü.", "Legacy protocol where encrypted messages are transferred to a selected wallet after 10, 20 or 50 years."],
  ["Global POD", "ABD, Türkiye ve Avrupa baskı merkezleriyle otomatik fiziksel sertifika ve aksesuar gönderimi.", "Automatic physical certificate and accessory shipment with print centers in US, Turkey and Europe."],
];

export default function Vision() {
  const { t, lang } = useT();

  const comparison = [
    [lang === "TR" ? "Sahiplik Kanıtı" : "Proof of Ownership", "Blockchain NFT", lang === "TR" ? "Geçersiz kağıt kaydı" : "Invalid paper record"],
    [lang === "TR" ? "İnteraktiflik" : "Interactivity", lang === "TR" ? "3D harita, AR ve sosyal yıldız ağı" : "3D map, AR and social star network", lang === "TR" ? "Statik sertifika" : "Static certificate"],
    [lang === "TR" ? "Gizlilik" : "Privacy", lang === "TR" ? "ZK-proof şifreli mesaj kasası" : "ZK-proof encrypted message vault", lang === "TR" ? "Veri açık veya belirsiz" : "Data open or uncertain"],
    [lang === "TR" ? "Operasyon" : "Operation", "n8n + AI ile zero-touch", lang === "TR" ? "Manuel işlem ve yavaş teslimat" : "Manual process and slow delivery"],
  ];

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Subtle Overlay */}
      <div className="absolute inset-0 bg-[#020208]/40 pointer-events-none" />

      <main className="relative pt-28 pb-24 z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-10 min-h-[72vh] flex items-center">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/20 bg-sc-gold/5 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-6">
              <Stars className="w-3 h-3" /> INVESTOR VISION
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6 uppercase">
              {lang === "TR" ? "Evrenin Dijital ve Fiziksel" : "Universal Digital and Physical"} <span className="gold-gradient-text">{lang === "TR" ? "Sahiplik Protokolü" : "Ownership Protocol"}</span>
            </h1>
            <p className="text-lg md:text-xl text-sc-text-muted/80 leading-relaxed max-w-3xl mb-8 font-accent italic">
              {lang === "TR" 
                ? "StarClaim, yaklaşık 10.000 yüksek görünürlüklü yıldızı dijital varlıklara dönüştüren; NFT mülkiyeti, şifreli kişisel anılar, AI hikayeleştirme, marketplace ve fiziksel sertifika lojistiğini tek ekosistemde birleştiren prestij odaklı bir uzay-zaman kapsülüdür."
                : "StarClaim is a prestige-oriented space-time capsule that transforms approximately 10,000 high-visibility stars into digital assets; combining NFT ownership, encrypted personal memories, AI storytelling, marketplace and physical certificate logistics into a single ecosystem."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/stars" className="btn-gold shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <span className="inline-flex items-center gap-2 uppercase tracking-widest text-xs font-bold">{lang === "TR" ? "Yıldızları Gör" : "See Stars"} <ArrowUpRight className="w-4 h-4" /></span>
              </Link>
              <Link to="/marketplace" className="btn-ghost text-xs uppercase tracking-widest font-bold">Marketplace</Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, t: t("vision_pillars_1_t"), d: t("vision_pillars_1_d") },
              { icon: Bot, t: t("vision_pillars_2_t"), d: t("vision_pillars_2_d") },
              { icon: Boxes, t: t("vision_pillars_3_t"), d: t("vision_pillars_3_d") },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.t} className="glass-dark rounded-2xl p-8 border border-white/5 backdrop-blur-sm transition-all hover:border-sc-gold/20">
                  <Icon className="w-6 h-6 text-sc-gold/60 mb-5" strokeWidth={1.4} />
                  <h2 className="font-display text-xl mb-3 gold-gradient-text uppercase tracking-wide">{pillar.t}</h2>
                  <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">{pillar.d}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <div>
              <div className="text-[10px] tracking-[0.35em] uppercase text-sc-gold/60 mb-3 font-mono">Technical Architecture</div>
              <h2 className="font-display text-3xl md:text-4xl mb-5 uppercase text-white">{lang === "TR" ? "Soğuk teknolojiyi duygusal mülkiyete çeviren katmanlar" : "Layers turning cold tech into emotional ownership"}</h2>
              <p className="text-sc-text-muted/70 leading-relaxed italic">
                {lang === "TR" 
                  ? "Kullanıcı yıldızı satın aldığında AI, bilimsel verileri ve mitolojik arka planı harmanlar; n8n teslimatı otomatikleştirir; NFT katmanı mülkiyeti kanıtlar; gizlilik katmanı kişisel mesajları sadece sahibin açabileceği bir kasaya dönüştürür."
                  : "When a user purchases a star, AI blends scientific data and mythological background; n8n automates delivery; the NFT layer proves ownership; the privacy layer turns personal messages into a vault only the owner can open."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                [LockKeyhole, lang === "TR" ? "ZK-proof Mesaj Kasası" : "ZK-proof Message Vault", lang === "TR" ? "Metin, ses ve görseller sahiplik anahtarı olmadan okunamaz." : "Text, audio and images cannot be read without the ownership key."],
                [KeyRound, lang === "TR" ? "Sahiplik Anahtarı" : "Ownership Key", lang === "TR" ? "Mesajların kilidi NFT cüzdanı veya yetkili miras cüzdanıyla açılır." : "Messages are unlocked with an NFT wallet or authorized legacy wallet."],
                [Truck, lang === "TR" ? "Otonom Lojistik" : "Autonomous Logistics", lang === "TR" ? "PDF, e-posta ve fiziksel baskı merkezleri otomatik tetiklenir." : "PDF, email and physical print centers are automatically triggered."],
                [Network, lang === "TR" ? "Marketplace Likiditesi" : "Marketplace Liquidity", lang === "TR" ? "İkinci el satışlar ve komisyon muhasebesi platform içinde akar." : "Secondary sales and commission accounting flow within the platform."],
              ].map(([Icon, title, body]) => (
                <div key={title} className="glass-dark rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                  <Icon className="w-5 h-5 text-sc-gold/40 mb-4" strokeWidth={1.4} />
                  <h3 className="font-display text-lg mb-2 text-white uppercase tracking-wide">{title}</h3>
                  <p className="text-xs text-sc-text-muted/60 leading-relaxed font-light">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="glass-dark border border-sc-gold/20 rounded-2xl p-10 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-7">
              <Globe2 className="w-6 h-6 text-sc-gold" strokeWidth={1.4} />
              <h2 className="font-display text-3xl gold-gradient-text uppercase">{lang === "TR" ? "Global pazar ve yıldız klasmanları" : "Global market and star categories"}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {tiers.map(([kicker, title, titleEn, body, bodyEn]) => (
                <div key={title} className="bg-black/40 rounded-xl p-5 border border-white/5">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-2">{kicker}</div>
                  <h3 className="font-display text-xl mb-2 text-white">{lang === "TR" ? title : titleEn}</h3>
                  <p className="text-sm text-sc-text-muted/70 leading-relaxed">{lang === "TR" ? body : bodyEn}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-black/35 rounded-xl p-5 border border-white/5">
                <h3 className="font-display text-lg mb-2 text-white uppercase">{lang === "TR" ? "Amerika ve Avrupa" : "Americas and Europe"}</h3>
                <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">
                  {lang === "TR" 
                    ? "POD entegrasyonu, yüksek alım gücü, premium hediye pazarı ve Amazon/marketplace kanallarıyla hızlı ölçeklenebilir prestige segmenti."
                    : "POD integration, high purchasing power, premium gift market and fast scalable prestige segment with Amazon/marketplace channels."}
                </p>
              </div>
              <div className="bg-black/35 rounded-xl p-5 border border-white/5">
                <h3 className="font-display text-lg mb-2 text-white uppercase">{lang === "TR" ? "Türkiye ve çok dilli büyüme" : "Turkey and multi-lingual growth"}</h3>
                <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">
                  {lang === "TR" 
                    ? "Yerel güven, gümüş mühür/aksesuar, fiziksel sertifika ve Türkçe, İngilizce, İspanyolca, Rusça gibi çok dilli deneyimle elite topluluk oluşturma."
                    : "Local trust, silver seals/accessories, physical certificate and multi-lingual experience like Turkish, English, Spanish, Russian for elite community building."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass-dark border border-white/5 rounded-2xl p-10 backdrop-blur-sm">
              <Radio className="w-6 h-6 text-sc-gold mb-4" strokeWidth={1.4} />
              <h2 className="font-display text-3xl mb-6 gold-gradient-text uppercase">Roadmap</h2>
              <div className="space-y-6">
                {roadmap.map(([title, body, bodyEn]) => (
                  <div key={title} className="border-l-2 border-sc-gold/20 pl-6">
                    <h3 className="font-display text-lg text-white uppercase tracking-wide">{title}</h3>
                    <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">{lang === "TR" ? body : bodyEn}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-dark border border-white/5 rounded-2xl p-10 backdrop-blur-sm overflow-hidden">
              <Sparkles className="w-6 h-6 text-sc-gold mb-4" strokeWidth={1.4} />
              <h2 className="font-display text-3xl mb-6 gold-gradient-text uppercase">{lang === "TR" ? "Neden StarClaim?" : "Why StarClaim?"}</h2>
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-sc-gold">
                    <tr>
                      <th className="py-3 pr-4 uppercase tracking-widest text-[10px]">{lang === "TR" ? "Özellik" : "Feature"}</th>
                      <th className="py-3 pr-4 uppercase tracking-widest text-[10px]">StarClaim</th>
                      <th className="py-3 uppercase tracking-widest text-[10px]">{lang === "TR" ? "Geleneksel" : "Traditional"}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sc-text-muted/70">
                    {comparison.map(([feature, starclaim, legacy]) => (
                      <tr key={feature} className="border-t border-white/5">
                        <td className="py-4 pr-4 text-sc-text/90 font-medium">{feature}</td>
                        <td className="py-4 pr-4 text-cyan-200/60">{starclaim}</td>
                        <td className="py-4 font-light">{legacy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
