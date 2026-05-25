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

const pillars = [
  {
    icon: ShieldCheck,
    title: "Gizlilik Katmanı",
    body: "Monero ve Zcash mantığından ilham alan ZK-proof mimarisiyle mesaj, görsel ve ses gibi kişisel veriler sunucuda açık metin olarak tutulmaz.",
  },
  {
    icon: Bot,
    title: "n8n Otomasyonu",
    body: "Satın alma, AI hikaye üretimi, PDF sertifika, e-posta ve fiziksel baskı siparişi sıfır manuel operasyon prensibiyle birbirine bağlanır.",
  },
  {
    icon: Boxes,
    title: "NFT Mülkiyeti",
    body: "Yıldızlar ERC-721 uyumlu benzersiz varlıklara dönüştürülür; sahiplik, transfer ve miras senaryoları zincir üstünde kanıtlanabilir hale gelir.",
  },
];

const tiers = [
  ["Tier 1", "Efsaneviler", "Top 88 ana yıldız, zodyak ve mitolojik olarak yüksek prestijli varlıklar. Açık artırma ve kurumsal koleksiyon modeli."],
  ["Tier 2", "Seçkinler", "Çıplak gözle net görülen ilk 3.000 yıldız. Fiziksel sertifika, premium AI biyografi ve hediye deneyimi."],
  ["Tier 3", "Kaşifler", "Uygulama içinden keşfedilen uygun fiyatlı dijital sahiplikler. Marketplace likiditesi ve topluluk büyümesi için giriş seviyesi."],
];

const roadmap = [
  ["dNFT", "NASA/ESA verileriyle yıldız parlaklığı ve gök olaylarına tepki veren dinamik NFT görselleri."],
  ["StarClaim Social", "Sahiplerin yıldızları arasında dijital radyo dalgalarıyla mesajlaşabildiği sosyal katman."],
  ["Legacy Mode", "Şifreli mesajların 10, 20 veya 50 yıl sonra seçilen bir cüzdana devredildiği miras protokolü."],
  ["Global POD", "ABD, Türkiye ve Avrupa baskı merkezleriyle otomatik fiziksel sertifika ve aksesuar gönderimi."],
];

const comparison = [
  ["Sahiplik Kanıtı", "Blockchain NFT", "Geçersiz kağıt kaydı"],
  ["İnteraktiflik", "3D harita, AR ve sosyal yıldız ağı", "Statik sertifika"],
  ["Gizlilik", "ZK-proof şifreli mesaj kasası", "Veri açık veya belirsiz"],
  ["Operasyon", "n8n + AI ile zero-touch", "Manuel işlem ve yavaş teslimat"],
];

export default function Vision() {
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
              Evrenin Dijital ve Fiziksel <span className="gold-gradient-text">Sahiplik Protokolü</span>
            </h1>
            <p className="text-lg md:text-xl text-sc-text-muted/80 leading-relaxed max-w-3xl mb-8 font-accent italic">
              StarClaim, yaklaşık 10.000 yüksek görünürlüklü yıldızı dijital varlıklara dönüştüren; NFT mülkiyeti,
              şifreli kişisel anılar, AI hikayeleştirme, marketplace ve fiziksel sertifika lojistiğini tek ekosistemde
              birleştiren prestij odaklı bir uzay-zaman kapsülüdür.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/stars" className="btn-gold shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <span className="inline-flex items-center gap-2 uppercase tracking-widest text-xs font-bold">Yıldızları Gör <ArrowUpRight className="w-4 h-4" /></span>
              </Link>
              <Link to="/marketplace" className="btn-ghost text-xs uppercase tracking-widest font-bold">Marketplace</Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="glass-dark rounded-2xl p-8 border border-white/5 backdrop-blur-sm transition-all hover:border-sc-gold/20">
                  <Icon className="w-6 h-6 text-sc-gold/60 mb-5" strokeWidth={1.4} />
                  <h2 className="font-display text-xl mb-3 gold-gradient-text uppercase tracking-wide">{pillar.title}</h2>
                  <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <div>
              <div className="text-[10px] tracking-[0.35em] uppercase text-sc-gold/60 mb-3 font-mono">Technical Architecture</div>
              <h2 className="font-display text-3xl md:text-4xl mb-5 uppercase text-white">Soğuk teknolojiyi duygusal mülkiyete çeviren katmanlar</h2>
              <p className="text-sc-text-muted/70 leading-relaxed italic">
                Kullanıcı yıldızı satın aldığında AI, bilimsel verileri ve mitolojik arka planı harmanlar; n8n teslimatı
                otomatikleştirir; NFT katmanı mülkiyeti kanıtlar; gizlilik katmanı kişisel mesajları sadece sahibin
                açabileceği bir kasaya dönüştürür.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                [LockKeyhole, "ZK-proof Mesaj Kasası", "Metin, ses ve görseller sahiplik anahtarı olmadan okunamaz."],
                [KeyRound, "Sahiplik Anahtarı", "Mesajların kilidi NFT cüzdanı veya yetkili miras cüzdanıyla açılır."],
                [Truck, "Otonom Lojistik", "PDF, e-posta ve fiziksel baskı merkezleri otomatik tetiklenir."],
                [Network, "Marketplace Likiditesi", "İkinci el satışlar ve komisyon muhasebesi platform içinde akar."],
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
              <h2 className="font-display text-3xl gold-gradient-text uppercase">Global pazar ve yıldız klasmanları</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {tiers.map(([kicker, title, body]) => (
                <div key={title} className="bg-black/40 rounded-xl p-5 border border-white/5">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-2">{kicker}</div>
                  <h3 className="font-display text-xl mb-2 text-white">{title}</h3>
                  <p className="text-sm text-sc-text-muted/70 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-black/35 rounded-xl p-5 border border-white/5">
                <h3 className="font-display text-lg mb-2 text-white uppercase">Amerika ve Avrupa</h3>
                <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">
                  POD entegrasyonu, yüksek alım gücü, premium hediye pazarı ve Amazon/marketplace kanallarıyla hızlı
                  ölçeklenebilir prestige segmenti.
                </p>
              </div>
              <div className="bg-black/35 rounded-xl p-5 border border-white/5">
                <h3 className="font-display text-lg mb-2 text-white uppercase">Türkiye ve çok dilli büyüme</h3>
                <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">
                  Yerel güven, gümüş mühür/aksesuar, fiziksel sertifika ve Türkçe, İngilizce, İspanyolca, Rusça gibi
                  çok dilli deneyimle elite topluluk oluşturma.
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
                {roadmap.map(([title, body]) => (
                  <div key={title} className="border-l-2 border-sc-gold/20 pl-6">
                    <h3 className="font-display text-lg text-white uppercase tracking-wide">{title}</h3>
                    <p className="text-sm text-sc-text-muted/70 leading-relaxed font-light">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-dark border border-white/5 rounded-2xl p-10 backdrop-blur-sm overflow-hidden">
              <Sparkles className="w-6 h-6 text-sc-gold mb-4" strokeWidth={1.4} />
              <h2 className="font-display text-3xl mb-6 gold-gradient-text uppercase">Neden StarClaim?</h2>
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-sc-gold">
                    <tr>
                      <th className="py-3 pr-4 uppercase tracking-widest text-[10px]">Özellik</th>
                      <th className="py-3 pr-4 uppercase tracking-widest text-[10px]">StarClaim</th>
                      <th className="py-3 uppercase tracking-widest text-[10px]">Geleneksel</th>
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
