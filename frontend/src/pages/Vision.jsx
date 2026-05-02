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
import StarCanvas from "../components/StarCanvas";

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
    <div className="min-h-screen bg-sc-deep relative overflow-hidden">
      <StarCanvas density={240} />
      <div className="absolute inset-0 nebula-bg pointer-events-none" />

      <main className="relative pt-28 pb-24">
        <section className="max-w-7xl mx-auto px-6 md:px-10 min-h-[72vh] flex items-center">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-6">
              <Stars className="w-3 h-3" /> Investor Vision
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6">
              Evrenin Dijital ve Fiziksel <span className="gold-gradient-text">Sahiplik Protokolü</span>
            </h1>
            <p className="text-lg md:text-xl text-sc-text/85 leading-relaxed max-w-3xl mb-8">
              StarClaim, yaklaşık 10.000 yüksek görünürlüklü yıldızı dijital varlıklara dönüştüren; NFT mülkiyeti,
              şifreli kişisel anılar, AI hikayeleştirme, marketplace ve fiziksel sertifika lojistiğini tek ekosistemde
              birleştiren prestij odaklı bir uzay-zaman kapsülüdür.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/stars" className="btn-gold">
                <span className="inline-flex items-center gap-2">Yıldızları Gör <ArrowUpRight className="w-4 h-4" /></span>
              </Link>
              <Link to="/marketplace" className="btn-ghost">Marketplace</Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="grid md:grid-cols-3 gap-5">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="glass rounded-2xl p-6 border border-white/10">
                  <Icon className="w-6 h-6 text-sc-gold mb-5" strokeWidth={1.4} />
                  <h2 className="font-display text-xl mb-3">{pillar.title}</h2>
                  <p className="text-sm text-sc-text-muted leading-relaxed">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
            <div>
              <div className="text-[10px] tracking-[0.35em] uppercase text-sc-gold mb-3">Technical Architecture</div>
              <h2 className="font-display text-3xl md:text-4xl mb-5">Soğuk teknolojiyi duygusal mülkiyete çeviren katmanlar</h2>
              <p className="text-sc-text-muted leading-relaxed">
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
                <div key={title} className="glass rounded-2xl p-5">
                  <Icon className="w-5 h-5 text-sc-blue mb-4" strokeWidth={1.4} />
                  <h3 className="font-display text-lg mb-2">{title}</h3>
                  <p className="text-xs text-sc-text-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="glass-gold rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-7">
              <Globe2 className="w-6 h-6 text-sc-gold" strokeWidth={1.4} />
              <h2 className="font-display text-3xl">Global pazar ve yıldız klasmanları</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {tiers.map(([kicker, title, body]) => (
                <div key={title} className="bg-sc-deep/40 rounded-xl p-5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-2">{kicker}</div>
                  <h3 className="font-display text-xl mb-2">{title}</h3>
                  <p className="text-sm text-sc-text-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-sc-deep/35 rounded-xl p-5 border border-white/10">
                <h3 className="font-display text-lg mb-2">Amerika ve Avrupa</h3>
                <p className="text-sm text-sc-text-muted leading-relaxed">
                  POD entegrasyonu, yüksek alım gücü, premium hediye pazarı ve Amazon/marketplace kanallarıyla hızlı
                  ölçeklenebilir prestige segmenti.
                </p>
              </div>
              <div className="bg-sc-deep/35 rounded-xl p-5 border border-white/10">
                <h3 className="font-display text-lg mb-2">Türkiye ve çok dilli büyüme</h3>
                <p className="text-sm text-sc-text-muted leading-relaxed">
                  Yerel güven, gümüş mühür/aksesuar, fiziksel sertifika ve Türkçe, İngilizce, İspanyolca, Rusça gibi
                  çok dilli deneyimle elite topluluk oluşturma.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-8">
              <Radio className="w-6 h-6 text-sc-gold mb-4" strokeWidth={1.4} />
              <h2 className="font-display text-3xl mb-6">Roadmap</h2>
              <div className="space-y-4">
                {roadmap.map(([title, body]) => (
                  <div key={title} className="border-l border-sc-gold/40 pl-4">
                    <h3 className="font-display text-lg">{title}</h3>
                    <p className="text-sm text-sc-text-muted leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-8 overflow-hidden">
              <Sparkles className="w-6 h-6 text-sc-gold mb-4" strokeWidth={1.4} />
              <h2 className="font-display text-3xl mb-6">Neden StarClaim?</h2>
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-sc-gold">
                    <tr>
                      <th className="py-3 pr-4">Özellik</th>
                      <th className="py-3 pr-4">StarClaim</th>
                      <th className="py-3">Geleneksel</th>
                    </tr>
                  </thead>
                  <tbody className="text-sc-text-muted">
                    {comparison.map(([feature, starclaim, legacy]) => (
                      <tr key={feature} className="border-t border-white/10">
                        <td className="py-3 pr-4 text-sc-text">{feature}</td>
                        <td className="py-3 pr-4">{starclaim}</td>
                        <td className="py-3">{legacy}</td>
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
