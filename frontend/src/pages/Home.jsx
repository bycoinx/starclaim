import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Sparkles, Gift, Crown, Telescope, Scroll, Heart, Users, Users2, TrendingUp, ArrowRight, Check, ShieldCheck, Database, Zap, Lock, EyeOff } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import StarCanvas from "../components/StarCanvas";

const ZODIAC = [
  { sym: "♈", name: "Koç", en: "Aries", cons: "Aries" },
  { sym: "♉", name: "Boğa", en: "Taurus", cons: "Taurus" },
  { sym: "♊", name: "İkizler", en: "Gemini", cons: "Gemini" },
  { sym: "♋", name: "Yengeç", en: "Cancer", cons: "Cancer" },
  { sym: "♌", name: "Aslan", en: "Leo", cons: "Leo" },
  { sym: "♍", name: "Başak", en: "Virgo", cons: "Virgo" },
  { sym: "♎", name: "Terazi", en: "Libra", cons: "Libra" },
  { sym: "♏", name: "Akrep", en: "Scorpio", cons: "Scorpius" },
  { sym: "♐", name: "Yay", en: "Sagittarius", cons: "Sagittarius" },
  { sym: "♑", name: "Oğlak", en: "Capricorn", cons: "Capricornus" },
  { sym: "♒", name: "Kova", en: "Aquarius", cons: "Aquarius" },
  { sym: "♓", name: "Balık", en: "Pisces", cons: "Pisces" },
];

const PACKAGES = [
  {
    id: "standard",
    tag: "Başlangıç",
    tagEn: "Starter",
    name: "Standart",
    nameEn: "Standard",
    symbol: "★",
    priceRange: "$9.99 – $24.99",
    tierCls: "tier-standard",
    badgeColor: "text-sc-text-muted",
    includes: [
      "Dijital sertifika PDF",
      "Kuantum imzalı mühür",
      "Temel AI hikayesi",
    ],
    includesEn: ["Digital certificate PDF", "Quantum-signed seal", "Basic AI story"],
    count: "330,000 müsait yıldız",
  },
  {
    id: "constellation",
    tag: "Popüler",
    tagEn: "Popular",
    name: "Takımyıldızı",
    nameEn: "Constellation",
    symbol: "✦",
    priceRange: "$39.99 – $129",
    tierCls: "tier-constellation",
    badgeColor: "text-sc-green",
    includes: [
      "Fiziksel sertifika",
      "Kozmik hafıza alanı (1GB)",
      "AI hikayesi + görseli",
    ],
    includesEn: ["Physical certificate", "Cosmic memory space (1GB)", "AI story + image"],
    count: "8,800 takımyıldızı yıldızı",
  },
  {
    id: "legendary",
    tag: "Ultra Nadir — 10 adet",
    tagEn: "Ultra Rare — only 10",
    name: "Efsanevi",
    nameEn: "Legendary",
    symbol: "👑",
    priceRange: "$999 – $2,999",
    tierCls: "tier-legendary",
    badgeColor: "text-sc-gold",
    includes: [
      "StarVault Offline Sığınak",
      "Vasiyet Protokolü erişimi",
      "NFT Sertifikası (PQC)",
    ],
    includesEn: ["StarVault Offline Sanctuary", "Legacy Protocol access", "NFT Certificate (PQC)"],
    count: "Sirius, Polaris, Vega, Rigel, Betelgeuse…",
    highlight: true,
  },
];

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${visible ? "in-view" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Home({ onOpenClaim, stats }) {
  const { t, lang } = useT();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const claimedToday = stats?.claimed_today ?? 24;

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post("/newsletter", { email });
      setSubscribed(true);
      setEmail("");
    } catch (_) {}
  };

  return (
    <div className="bg-sc-deep">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 nebula-bg" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1464802686167-b939a67e06a1?auto=format&fit=crop&q=80)",
          backgroundSize: "cover", backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }} />
        <StarCanvas density={340} />
        <div className="relative text-center px-6 max-w-5xl mx-auto z-10 pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sc-gold/30 bg-sc-gold/5 text-[11px] tracking-[0.3em] uppercase text-sc-gold mb-8 animate-fade-up">
            <ShieldCheck className="w-3.5 h-3.5" /> {lang === "TR" ? "Kuantum Güvenlikli Hafıza Platformu" : "Quantum-Safe Memory Platform"}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[1] tracking-tight mb-8 animate-fade-up whitespace-pre-line">
            <span className="gold-gradient-text uppercase">{lang === "TR" ? "Gökyüzünde\nSonsuz Bir İz Bırak" : "Leave an Eternal\nMark in the Sky"}</span>
          </h1>
          <p className="text-sc-text/80 text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-accent italic animate-fade-up" style={{ animationDelay: "200ms" }}>
            {lang === "TR" 
              ? "Maddiyatın bittiği noktada, sevdiklerinizin sesini ve anılarını kuantum zırhıyla yıldızlara mühürleyin." 
              : "Where matter ends, seal your loved ones' voices and memories into the stars with quantum armor."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <Link to="/stars" className="btn-gold px-10 py-4 text-lg" data-testid="hero-cta-pick">
              <span className="inline-flex items-center gap-3">
                <Star className="w-5 h-5 fill-current" strokeWidth={1.5} /> {t("hero_cta_pick")}
              </span>
            </Link>
            <Link to="/vision" className="btn-ghost px-10 py-4 text-lg" data-testid="hero-cta-vision">
              <span className="inline-flex items-center gap-3">
                <Zap className="w-5 h-5" /> {lang === "TR" ? "StarVault Vizyonu" : "StarVault Vision"}
              </span>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sc-text-muted text-[10px] tracking-[0.5em] font-display">
          EST. 2026 · SCROLL
        </div>
      </section>

      {/* QUANTUM SECURITY SECTION */}
      <section className="py-32 relative border-y border-sc-gold/10 bg-[#070F22]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-4 blur-3xl bg-sc-gold/10 rounded-full" />
                <div className="relative glass-gold rounded-3xl p-10 overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Lock className="w-12 h-12 text-sc-gold opacity-20" />
                  </div>
                  <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-6">Quantum-Resistant (PQC)</div>
                  <h2 className="font-display text-4xl md:text-5xl mb-8 leading-tight">
                    {lang === "TR" ? "Geleceğin Saldırılarına Karşı Bugünden Hazır" : "Ready Today for the Attacks of Tomorrow"}
                  </h2>
                  <div className="space-y-6">
                    {[
                      { t: "Lattice-Based Encryption", d: "NIST standartlarında Kyber ve Dilithium algoritmaları ile sarsılmaz güvenlik." },
                      { t: "Kuantum Dirençli NFT", d: "Sahiplik kayıtlarınız kuantum bilgisayarlar tarafından bile kırılamaz." },
                      { t: "Hava Boşluklu Arşivleme", d: "En kritik verileriniz internetten izole StarVault sığınaklarında." }
                    ].map((f, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-1 h-12 bg-sc-gold/40 rounded-full" />
                        <div>
                          <div className="text-sm font-display text-sc-gold uppercase tracking-widest mb-1">{f.t}</div>
                          <p className="text-xs text-sc-text-muted leading-relaxed">{f.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="space-y-8">
                <div className="inline-flex p-3 rounded-2xl bg-sc-gold/10 border border-sc-gold/20">
                  <ShieldCheck className="w-8 h-8 text-sc-gold" />
                </div>
                <h2 className="font-display text-4xl md:text-5xl leading-tight">
                  {lang === "TR" ? "Evrensel Hafızanızı Kuantum Zırhıyla Koruyun" : "Protect Your Universal Memory with Quantum Armor"}
                </h2>
                <p className="text-lg text-sc-text-muted font-accent italic leading-relaxed">
                  {lang === "TR" 
                    ? "Geleneksel şifreleme yöntemleri, kuantum bilgisayarların gölgesinde eriyip gidecek. StarClaim, dijital mirasınızı trilyonlarca yıllık kozmik takvime hazırlıyor." 
                    : "Traditional encryption methods will dissolve in the shadow of quantum computers. StarClaim prepares your digital legacy for a trillion-year cosmic calendar."}
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-6">
                    <div className="text-3xl font-display text-sc-gold mb-1">99.9%</div>
                    <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">Kuantum Direnci</div>
                  </div>
                  <div className="glass rounded-2xl p-6">
                    <div className="text-3xl font-display text-sc-gold mb-1">AES-256</div>
                    <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">Simetrik Zırh</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STARVAULT / FAMILY PROTOCOL */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 nebula-bg opacity-40" />
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-20">
            <Reveal>
              <div className="inline-flex p-3 rounded-2xl bg-sc-blue/10 border border-sc-blue/20 mb-6">
                <Database className="w-8 h-8 text-sc-blue" />
              </div>
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-blue mb-4">THE FAMILY PROTOCOL</div>
              <h2 className="font-display text-4xl md:text-6xl mb-6">StarVault: Gizli Miras Katmanı</h2>
              <p className="text-sc-text-muted max-w-2xl mx-auto font-accent italic text-xl">
                "Herkes gökyüzüne bakar, ama sadece anahtarı olanlar içeriği görür."
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                ic: EyeOff, 
                t: "Görünmez Mühür", 
                d: "Güneş, Mars ve Jüpiter gibi ana gök cisimleri katalogda görünmez; sadece 'Aile Protokolü' sahiplerine özel sığınaklardır." 
              },
              { 
                ic: Heart, 
                t: "Sesli Biyografi", 
                d: "Sevdiklerinizin gülüşlerini ve itiraflarını ses frekansları olarak gezegenlerin çekirdeklerine mühürleyin." 
              },
              { 
                ic: Scroll, 
                t: "Vasiyet Modu", 
                d: "Sizden sonraki nesillere bırakılacak en değerli 'gerçek servet' — anılarınız ve hayat dersleriniz." 
              }
            ].map((s, i) => {
              const Ic = s.ic;
              return (
                <Reveal key={i} delay={i * 150}>
                  <div className="glass rounded-3xl p-8 border-sc-blue/20 hover:border-sc-blue/40 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-sc-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Ic className="w-6 h-6 text-sc-blue" />
                    </div>
                    <h3 className="font-display text-2xl mb-4 text-sc-text">{s.t}</h3>
                    <p className="text-sm text-sc-text-muted leading-relaxed">{s.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIERS (Updated with new vision) */}
      <section id="pricing" className="py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-16">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">EVOLUTION</div>
              <h2 className="font-display text-4xl md:text-5xl mb-3">Sahiplik Seviyeleri</h2>
              <p className="text-sc-text-muted">Dijitalden Kozmiğe uzanan bir yolculuk.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <div
                  data-testid={`pkg-card-${p.id}`}
                  className={`glass rounded-3xl p-8 border h-full flex flex-col ${p.tierCls} ${p.highlight ? "glass-gold" : ""}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-[10px] tracking-[0.3em] uppercase ${p.badgeColor}`}>{lang === "TR" ? p.tag : p.tagEn}</span>
                    <span className="text-3xl">{p.symbol}</span>
                  </div>
                  <h3 className={`font-display text-3xl mb-2 ${p.highlight ? "gold-gradient-text" : "text-sc-text"}`}>
                    {lang === "TR" ? p.name : p.nameEn}
                  </h3>
                  <div className="text-lg text-sc-gold mb-6 font-semibold">{p.priceRange}</div>
                  <ul className="space-y-4 text-sm text-sc-text-muted mb-8 flex-1">
                    {(lang === "TR" ? p.includes : p.includesEn).map((inc) => (
                      <li key={inc} className="flex gap-3"><Check className="w-4 h-4 text-sc-gold shrink-0 mt-0.5" /> {inc}</li>
                    ))}
                  </ul>
                  <Link to="/stars" className="btn-gold text-center py-4">
                    {lang === "TR" ? "Yıldızını Seç" : "Choose Your Star"}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-32 relative bg-[#070F22] overflow-hidden">
        <div className="absolute inset-0 nebula-bg opacity-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sc-gold/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-display text-5xl md:text-7xl mb-8 leading-tight">
              {lang === "TR" ? "Maddiyat Biter,\nAnılar Kalır." : "Matter Ends,\nMemories Remain."}
            </h2>
            <p className="text-xl md:text-2xl text-sc-text-muted mb-12 font-accent italic">
              {lang === "TR" 
                ? "Göklerdeki yerinizi bugün ayırtın, mirasınızı kuantum mühürlerle sonsuzluğa emanet edin." 
                : "Reserve your place in the heavens today, entrust your legacy to eternity with quantum seals."}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/stars" className="btn-gold px-12 py-4 text-lg">
                {lang === "TR" ? "Hemen Başla" : "Start Now"}
              </Link>
              <button onClick={onOpenClaim} className="btn-ghost px-12 py-4 text-lg">
                {lang === "TR" ? "Hediye Gönder" : "Send a Gift"}
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
