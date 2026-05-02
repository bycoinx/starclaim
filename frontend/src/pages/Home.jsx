import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Sparkles, Gift, Crown, Telescope, Scroll, Heart, Users, Users2, TrendingUp, ArrowRight, Check } from "lucide-react";
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
      "Koordinatlar",
      "Uygulama erişimi",
      "Temel AI hikayesi",
    ],
    includesEn: ["Digital certificate PDF", "Coordinates", "App access", "Basic AI story"],
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
      "Gökyüzü haritası",
      "AI hikayesi + görseli",
      "Uygulama erişimi",
    ],
    includesEn: ["Physical certificate", "Sky map", "AI story + image", "App access"],
    count: "8,800 takımyıldızı yıldızı",
  },
  {
    id: "named",
    tag: "Nadir",
    tagEn: "Rare",
    name: "İsimli Yıldız",
    nameEn: "Named Star",
    symbol: "◆",
    priceRange: "$189 – $399",
    tierCls: "tier-named",
    badgeColor: "text-sc-blue",
    includes: [
      "Her şey + Derin mitoloji hikayesi",
      "Premium sertifika tasarımı",
      "Öncelikli destek",
    ],
    includesEn: ["Everything + deep mythology story", "Premium certificate design", "Priority support"],
    count: "450 IAU isimli yıldız",
  },
  {
    id: "zodiac",
    tag: "Burç Yıldızı",
    tagEn: "Zodiac",
    name: "Zodyak",
    nameEn: "Zodiac",
    symbol: "♦",
    priceRange: "$299 – $699",
    tierCls: "tier-zodiac",
    badgeColor: "text-sc-purple",
    includes: [
      "Her şey + Burç temalı sertifika",
      "Kişisel burç yorumu",
      "Özel gökyüzü haritası",
    ],
    includesEn: ["Everything + zodiac-themed cert", "Personal horoscope reading", "Custom sky map"],
    count: "960 burç yıldızı",
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
      "Her şey + NFT sertifikası (yakında)",
      "Koleksiyoner paketi",
      "Özel müşteri temsilcisi",
    ],
    includesEn: ["Everything + NFT cert (soon)", "Collector bundle", "Dedicated account manager"],
    count: "Sirius, Polaris, Vega, Rigel, Betelgeuse…",
    highlight: true,
  },
];

const OCCASIONS = [
  { ic: Heart, label: "Sevgililer", en: "Valentine's" },
  { ic: Gift, label: "Doğum Günü", en: "Birthday" },
  { ic: Sparkles, label: "Yıldönümü", en: "Anniversary" },
  { ic: Star, label: "Yeni Doğan", en: "Newborn" },
  { ic: Scroll, label: "Mezuniyet", en: "Graduation" },
  { ic: Crown, label: "Anma", en: "Memorial" },
  { ic: Users, label: "Arkadaşlık", en: "Friendship" },
  { ic: Heart, label: "Teşekkür", en: "Thanks" },
];

const TESTIMONIALS = [
  { q: "Sevgilime Orion'dan bir yıldız aldım. Gözleri doldu. Hiçbir çiçek bunu yapamazdı.", name: "Kemal, İstanbul" },
  { q: "Annem hayatını kaybettiğinde ona bir yıldız adadım. Şimdi her gece onu gökyüzünde arıyorum.", name: "Fatma, Ankara" },
  { q: "Arkadaş grubumuz olarak 5 kişi aynı takımyıldızından yıldız aldık. En güzel grup hediyesi buydu.", name: "Berkay, İzmir" },
  { q: "Mezuniyetimde kendime bir yıldız aldım. Hatıra olarak sonsuza kadar orada duracak.", name: "Elif, Adana" },
];

const FAQ = [
  { q: "Yıldızım gerçekten benim mi olacak?", a: "StarClaim kayıtlarında yıldızın tek sahibi sensin. IAU (Uluslararası Astronomi Birliği) resmi isimlendirme yapmaz ama StarClaim evreninde yıldızın tamamen sana ait." },
  { q: "Yıldızımı nasıl bulacağım?", a: "Sertifikanındaki koordinatları kullanarak uygulamamızda yıldızını bulabilirsin. Telefonunu gökyüzüne tut, yıldızın ekranda belirir." },
  { q: "Yıldızımı satabilir miyim?", a: "Evet! Marketplace üzerinden istediğin fiyata satışa koyabilirsin. Satıştan yalnızca %10 platform payı alınır." },
  { q: "Sertifika ne zaman gelir?", a: "Dijital sertifikan ödeme sonrası 5-10 dakika içinde emailine gelir. Fiziksel baskı Türkiye'ye 3-5 iş günü." },
  { q: "Hediye olarak nasıl gönderebilirim?", a: "Sipariş sırasında \"Hediye modu\"nu seç. Alıcının adını ve emailini gir. Sertifika ve kişisel hikaye doğrudan ona gönderilir." },
  { q: "İkinci el yıldız almak güvenli mi?", a: "Evet. Tüm işlemler StarClaim güvencesi altında. Sahiplik kayıt sistemimizde anlık güncellenir." },
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
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "url(https://images.pexels.com/photos/20881655/pexels-photo-20881655.jpeg)",
          backgroundSize: "cover", backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }} />
        <StarCanvas density={340} />
        <div className="relative text-center px-6 max-w-5xl mx-auto z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sc-gold/30 bg-sc-gold/5 text-[11px] tracking-[0.3em] uppercase text-sc-gold mb-8 animate-fade-up">
            <Sparkles className="w-3 h-3" /> {lang === "TR" ? "Premium Gökyüzü Deneyimi" : "Premium Sky Experience"}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6 animate-fade-up whitespace-pre-line">
            <span className="gold-gradient-text">{t("hero_title")}</span>
          </h1>
          <p className="text-sc-text/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-accent italic animate-fade-up" style={{ animationDelay: "200ms" }}>
            {t("hero_sub")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <Link to="/stars" className="btn-gold" data-testid="hero-cta-pick">
              <span className="inline-flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" strokeWidth={1.5} /> {t("hero_cta_pick")}
              </span>
            </Link>
            <a href="#how" className="btn-ghost" data-testid="hero-cta-how">{t("hero_cta_how")}</a>
          </div>
          <div className="mt-10 text-sm text-sc-text-muted flex items-center justify-center gap-2 animate-fade-up" style={{ animationDelay: "600ms" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-sc-gold animate-pulse" />
            <span>
              <span className="text-sc-gold font-semibold" data-testid="hero-counter">{claimedToday}</span> {t("hero_counter_suffix")} · {t("hero_counter_prefix")}
            </span>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sc-text-muted text-xs tracking-widest">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-sc-gold/60 mx-auto mb-2" />
          SCROLL
        </div>
      </section>

      {/* Social proof ticker */}
      <section className="border-y border-white/5 bg-[#0A1628]/60 overflow-hidden py-4">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 px-8 text-sm text-sc-gold/90 tracking-wide">
              <span>✦ Ali K. Sirius'u sahiplendi</span>
              <span>✧ Zeynep Büyükayı'ndan bir yıldız aldı</span>
              <span>✦ Mert ve Ayşe komşu yıldızları aldı</span>
              <span>✧ Selin Regulus'u doğum günü hediyesi olarak aldı</span>
              <span>✦ Kemal Betelgeuse'u babasına adadı</span>
              <span>✧ Deniz Altair'i sahiplendi</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-16">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">03 STEPS</div>
              <h2 className="font-display text-4xl md:text-5xl mb-4">{t("how_title")}</h2>
              <div className="divider-gold max-w-[120px] mx-auto" />
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-sc-gold/40 to-transparent" />
            {[
              { ic: Telescope, t: t("how_1_t"), d: t("how_1_d"), n: "01" },
              { ic: Sparkles, t: t("how_2_t"), d: t("how_2_d"), n: "02" },
              { ic: Scroll, t: t("how_3_t"), d: t("how_3_d"), n: "03" },
            ].map((s, i) => {
              const Ic = s.ic;
              return (
                <Reveal key={i} delay={i * 150}>
                  <div className="glass rounded-2xl p-8 text-center relative z-10 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 mx-auto rounded-full border border-sc-gold/40 bg-sc-deep flex items-center justify-center mb-5">
                      <Ic className="w-5 h-5 text-sc-gold" strokeWidth={1.5} />
                    </div>
                    <div className="text-[10px] tracking-[0.4em] text-sc-gold/70 mb-2">{s.n}</div>
                    <h3 className="font-display text-xl mb-3">{s.t}</h3>
                    <p className="text-sm text-sc-text-muted leading-relaxed">{s.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ZODIAC */}
      <section className="py-28 relative bg-[#070F22]">
        <div className="absolute inset-0 nebula-bg opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">ZODIAC</div>
              <h2 className="font-display text-4xl md:text-5xl mb-3">{t("zodiac_title")}</h2>
              <p className="text-sc-text-muted max-w-xl mx-auto">{t("zodiac_sub")}</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {ZODIAC.map((z, i) => (
              <Reveal key={z.cons} delay={i * 40}>
                <Link
                  to={`/stars?constellation=${z.cons}`}
                  data-testid={`zodiac-${z.cons.toLowerCase()}`}
                  className="glass rounded-2xl p-5 text-center hover:border-sc-gold/40 hover:-translate-y-1 transition-all block group"
                >
                  <div className="text-3xl md:text-4xl text-sc-gold mb-2 group-hover:scale-110 transition-transform">{z.sym}</div>
                  <div className="font-display text-base">{lang === "TR" ? z.name : z.en}</div>
                  <div className="text-[10px] tracking-widest text-sc-text-muted mt-1 uppercase">{z.cons}</div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-16">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">5 TIERS</div>
              <h2 className="font-display text-4xl md:text-5xl mb-3">{t("pricing_title")}</h2>
              <p className="text-sc-text-muted">{t("pricing_sub")}</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <div
                  data-testid={`pkg-card-${p.id}`}
                  className={`glass rounded-2xl p-6 border h-full flex flex-col ${p.tierCls} ${p.highlight ? "animate-pulse-gold" : ""}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] tracking-[0.2em] uppercase ${p.badgeColor}`}>{lang === "TR" ? p.tag : p.tagEn}</span>
                    <span className="text-2xl">{p.symbol}</span>
                  </div>
                  <h3 className={`font-display text-xl mb-1 ${p.highlight ? "gold-gradient-text" : "text-sc-text"}`}>
                    {lang === "TR" ? p.name : p.nameEn}
                  </h3>
                  <div className="text-sm text-sc-gold mb-5 font-semibold">{p.priceRange}</div>
                  <ul className="space-y-2 text-[13px] text-sc-text-muted mb-5 flex-1">
                    {(lang === "TR" ? p.includes : p.includesEn).map((inc) => (
                      <li key={inc} className="flex gap-2"><Check className="w-3.5 h-3.5 text-sc-gold shrink-0 mt-0.5" /> {inc}</li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-sc-text-muted uppercase tracking-widest mb-3">{p.count}</div>
                  <Link to="/stars" className="btn-gold text-xs text-center py-2.5">
                    {lang === "TR" ? "Seç" : "Choose"}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-sc-text-muted">
            <span className="text-sc-gold">+Fiziksel baskı</span> $15 · <span className="text-sc-gold">+Çerçeve</span> $20 · <span className="text-sc-gold">+Hediye kutusu</span> $12 · <span className="text-sc-gold">+Ekspres</span> $10
          </div>
        </div>
      </section>

      {/* GIFT MODE */}
      <section className="py-28 relative bg-[#070F22]">
        <div className="absolute inset-0 nebula-bg" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-10 text-center">
          <Reveal>
            <Gift className="w-10 h-10 text-sc-gold mx-auto mb-5" strokeWidth={1.3} />
            <h2 className="font-display text-4xl md:text-5xl mb-3">{t("gift_title")}</h2>
            <p className="text-sc-text-muted max-w-xl mx-auto mb-10">{t("gift_sub")}</p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {OCCASIONS.map((o, i) => {
              const Ic = o.ic;
              return (
                <Reveal key={o.label} delay={i * 30}>
                  <div className="glass rounded-full px-5 py-2.5 text-sm flex items-center gap-2 hover:border-sc-gold/40 transition-colors">
                    <Ic className="w-3.5 h-3.5 text-sc-gold" /> {lang === "TR" ? o.label : o.en}
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal>
            <button onClick={onOpenClaim} className="btn-gold" data-testid="gift-cta">
              <span className="inline-flex items-center gap-2"><Gift className="w-4 h-4" /> {t("gift_cta")}</span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* SOCIAL STARS */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">TOGETHER</div>
              <h2 className="font-display text-4xl md:text-5xl mb-3">{t("social_title")}</h2>
              <p className="text-sc-text-muted max-w-xl mx-auto">{t("social_sub")}</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { ic: Heart, t: t("social_couple_t"), d: t("social_couple_d") },
              { ic: Users, t: t("social_friends_t"), d: t("social_friends_d") },
              { ic: Users2, t: t("social_family_t"), d: t("social_family_d") },
            ].map((c, i) => {
              const Ic = c.ic;
              return (
                <Reveal key={i} delay={i * 100}>
                  <div className="glass rounded-2xl p-8 h-full">
                    <Ic className="w-6 h-6 text-sc-gold mb-5" strokeWidth={1.3} />
                    <h3 className="font-display text-xl mb-3">{c.t}</h3>
                    <p className="text-sm text-sc-text-muted leading-relaxed mb-6">{c.d}</p>
                    <div className="relative h-24 rounded-xl bg-sc-deep border border-white/5 overflow-hidden">
                      <StarCanvas density={40} />
                      <div className="absolute inset-0 flex items-center justify-center gap-3">
                        {["Sen", "Sevgilin", "Dostun"].slice(0, i === 0 ? 2 : 3).map((lbl, j) => (
                          <div key={j} className="relative">
                            <Star className="w-4 h-4 fill-sc-gold text-sc-gold" />
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] text-sc-text-muted whitespace-nowrap">{lbl}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="py-28 relative bg-[#070F22]">
        <div className="absolute inset-0 nebula-bg opacity-70" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">MARKETPLACE</div>
              <h2 className="font-display text-4xl md:text-5xl mb-3">{t("market_preview_title")}</h2>
              <p className="text-sc-text-muted max-w-xl mx-auto">{t("market_preview_sub")}</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { n: "Vega", c: "Lyra", orig: 1499, ask: 2200, gain: 47, owner: "Kaan B.", tier: "tier-legendary" },
              { n: "Alnilam", c: "Orion", orig: 249, ask: 450, gain: 80, owner: "Merve S.", tier: "tier-named" },
              { n: "SC-014", c: "Virgo", orig: 19.99, ask: 75, gain: 275, owner: "Tarık Y.", tier: "tier-standard" },
            ].map((l, i) => (
              <Reveal key={l.n} delay={i * 80}>
                <div className={`glass rounded-2xl p-6 border ${l.tier}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-display text-lg">{l.n}</div>
                      <div className="text-xs text-sc-text-muted">{l.c}</div>
                    </div>
                    <div className="text-xs text-sc-green flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{l.gain}%</div>
                  </div>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-[10px] tracking-widest uppercase text-sc-text-muted">{t("market_original")}</div>
                      <div className="text-sm line-through text-sc-text-muted">${l.orig}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] tracking-widest uppercase text-sc-text-muted">{t("market_asking")}</div>
                      <div className="font-display text-xl text-sc-gold">${l.ask}</div>
                    </div>
                  </div>
                  <div className="text-xs text-sc-text-muted">{lang === "TR" ? "Sahibi" : "Owner"}: <span className="text-sc-blue">{l.owner}</span></div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="text-center">
              <p className="text-sc-text-muted text-sm max-w-2xl mx-auto mb-6">{t("market_commission")}</p>
              <Link to="/marketplace" className="btn-gold" data-testid="market-cta">
                <span className="inline-flex items-center gap-2">{t("market_cta")} <ArrowRight className="w-4 h-4" /></span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">STORIES</div>
              <h2 className="font-display text-4xl md:text-5xl mb-3">{t("testimonial_title")}</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="glass rounded-2xl p-8">
                  <div className="flex gap-1 mb-5 text-sc-gold">
                    {[0,1,2,3,4].map((n) => <Star key={n} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="font-accent italic text-xl text-sc-text/90 mb-5 leading-snug">"{t.q}"</p>
                  <div className="text-xs text-sc-text-muted tracking-widest uppercase">— {t.name}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 bg-[#070F22]">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="text-center mb-14">
              <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">FAQ</div>
              <h2 className="font-display text-4xl md:text-5xl">{t("faq_title")}</h2>
            </div>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="space-y-3" data-testid="faq-accordion">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="glass rounded-2xl border border-white/10 px-6 data-[state=open]:border-sc-gold/40">
                  <AccordionTrigger className="font-display text-left hover:no-underline text-base py-5">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sc-text-muted text-sm leading-relaxed pb-5">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-28">
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <Reveal>
            <div className="text-[11px] tracking-[0.4em] uppercase text-sc-gold mb-4">NEWSLETTER</div>
            <h2 className="font-display text-4xl md:text-5xl mb-3">{t("newsletter_title")}</h2>
            <p className="text-sc-text-muted mb-8">{t("newsletter_sub")}</p>
            <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" data-testid="newsletter-form">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sen@gokyuzu.com"
                data-testid="newsletter-email"
                className="flex-1 glass rounded-full px-5 py-3 text-sm outline-none focus:border-sc-gold/60 bg-transparent text-sc-text placeholder:text-sc-text-muted/60"
              />
              <button type="submit" className="btn-gold" data-testid="newsletter-submit">
                {subscribed ? (lang === "TR" ? "Hoş geldin ✦" : "Welcome ✦") : t("newsletter_cta")}
              </button>
            </form>
            <div className="text-[10px] text-sc-text-muted/70 mt-3">{t("newsletter_small")}</div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
