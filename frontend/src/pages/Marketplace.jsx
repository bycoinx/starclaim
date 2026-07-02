import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { TrendingUp, Shield, Activity, ArrowUpDown, Search, Loader2, Globe2, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell, SectionHeader, SurfacePanel, MetricCard, StatusBadge } from "../components/shell";

export default function Marketplace() {
  const { lang } = useT();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ vol: 0, cap: 0, avg: 0 });
  const [sortBy, setSortBy] = useState("default");
  const isTR = lang === "TR";

  useEffect(() => {
    const loadMarket = async () => {
      try {
        const [mRes, iRes] = await Promise.all([
          api.get("/marketplace/metrics"),
          api.get("/marketplace/listings")
        ]);
        setMetrics({
          vol: mRes.data?.volume_24h || 0,
          cap: mRes.data?.market_cap || 0,
          avg: mRes.data?.avg_price || 0
        });
        setItems(Array.isArray(iRes.data) ? iRes.data : []);
      } catch (err) {
        console.error("Market load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadMarket();
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
    if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
    if (sortBy === "name-az") return (a.star_name || "").localeCompare(b.star_name || "");
    if (sortBy === "name-za") return (b.star_name || "").localeCompare(a.star_name || "");
    return 0;
  });

  return (
    <PageShell>
      <SectionHeader
        title={isTR ? "Marketplace" : "Marketplace"}
        description={isTR ? "Yıldız alım-satım piyasasını premium bir tezgahla keşfedin." : "Explore star trading with a premium marketplace experience."}
        action={isTR ? "Yıldız Keşfet" : "Browse Listings"}
      />

      <SurfacePanel className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr] mb-8">
        <div>
          <SectionHeader
            title={isTR ? "Pazar Verileri" : "Market Metrics"}
            description={isTR ? "24 saatlik likidite, toplam değer ve ortalama fiyat akışı." : "24h liquidity, total market cap, and average star pricing."}
            action={isTR ? "Tüm Grafikleri Gör" : "View Charts"}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label={isTR ? "Volume 24s" : "Volume 24h"}
              value={`$${metrics.vol.toLocaleString()}`}
              caption={isTR ? "Son gün içinde gerçekleşen işlem hacmi." : "Trading volume in the last 24 hours."}
              icon={TrendingUp}
              tone="gold"
            />
            <MetricCard
              label={isTR ? "Pazar Değeri" : "Market Cap"}
              value={`$${(metrics.cap / 1000000).toFixed(1)}M`}
              caption={isTR ? "Ekosistem içindeki toplam değer." : "Total value across the marketplace."}
              icon={Globe2}
              tone="blue"
            />
            <MetricCard
              label={isTR ? "Ortalama Fiyat" : "Avg. Price"}
              value={`$${metrics.avg.toFixed(2)}`}
              caption={isTR ? "Her yıldız için dinamik önem bazlı fiyat." : "Dynamic star pricing from importance feed."}
              icon={Star}
              tone="emerald"
            />
          </div>
        </div>

        <div>
          <SectionHeader
            title={isTR ? "Piyasa Durumu" : "Market Pulse"}
            description={isTR ? "Pazarın nabzını premium terminal ekranıyla takip edin." : "Track the pulse of the market with a premium terminal view."}
            action={isTR ? "Detayları İncele" : "Inspect"}
          />
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#050614]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3 text-sm text-white/80 mb-4">
                <TrendingUp className="h-4 w-4 text-sc-gold" />
                <span>{isTR ? "Nadir listede Sirius X-1" : "Rare listing: Sirius X-1"}</span>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">{isTR ? "Ağ Durumu" : "Network Status"}</p>
                <p className="mt-2 text-lg font-semibold text-white">{isTR ? "Stabil" : "Stable"}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#050614]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3 text-sm text-white/80 mb-4">
                <Shield className="h-4 w-4 text-sc-blue" />
                <span>{isTR ? "Aegis Destek: Çevrimiçi" : "Aegis Support: Online"}</span>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">{isTR ? "Güvenlik" : "Security"}</p>
                <p className="mt-2 text-lg font-semibold text-white">{isTR ? "Korunuyor" : "Protected"}</p>
              </div>
            </div>
          </div>
        </div>
      </SurfacePanel>

      <div className="relative mb-8 rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.24)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%)] rounded-[2rem]" />
        <div className="relative z-10 grid gap-4 md:grid-cols-[1.5fr_0.8fr] items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-sc-gold/70">{isTR ? "Öne Çıkan" : "Featured"}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{isTR ? "Pazarın en seçkin yıldızlarına göz atın." : "Discover the most coveted stars on the marketplace."}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{isTR ? "Vault koleksiyonunuz ile bağlantılı, premium alım-satım deneyimini yaşayın." : "Stay connected to your Vault collection with a premium trading experience."}</p>
          </div>
          <button className="btn-gold w-full md:w-auto">{isTR ? "Pazara Git" : "Open Marketplace"}</button>
        </div>
      </div>

      <SurfacePanel>
        <SectionHeader
          title={isTR ? "Listelenen Yıldızlar" : "Listed Stars"}
          description={isTR ? "Pazardaki yıldızları başarı, nadirlik ve fiyat kriterlerine göre inceleyin." : "Browse listings by prestige, rarity, and value."}
          action={isTR ? "Yeni Listele" : "Create Listing"}
        />

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center">
             <Loader2 className="w-12 h-12 animate-spin text-sc-gold opacity-20" />
             <div className="text-[9px] tracking-[0.4em] text-sc-gold uppercase mt-8 font-black">{isTR ? "Pazar senkronize ediliyor..." : "Syncing orderbook..."}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {sortedItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050814]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition duration-500 hover:-translate-y-1 hover:border-sc-gold/30 hover:shadow-[0_34px_90px_rgba(212,175,55,0.18)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(77,142,255,0.08),transparent_34%)] opacity-40 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className="px-3 py-1 bg-sc-blue/5 border border-sc-blue/20 rounded text-[8px] font-bold text-sc-blue uppercase tracking-widest">
                         {item.tier} {isTR ? "varlık" : "asset"}
                      </div>
                      <div className="text-[10px] font-mono text-sc-green font-bold">+{Math.floor(Math.random()*300)}%</div>
                    </div>

                    <h3 className="font-display text-3xl text-white mb-2 group-hover:text-sc-gold transition-colors uppercase tracking-tight">{item.star_name}</h3>
                    <div className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] mb-8 flex flex-wrap gap-2">
                       <Search size={10} /> {item.constellation} <span className="text-white/40">{isTR ? "KOD" : "CODE"}</span> {item.star_id}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                         <p className="text-[7px] text-slate-400 uppercase font-bold tracking-widest mb-1">{isTR ? "Orijinal Değ." : "Original Val."}</p>
                         <p className="text-xs text-white/40 font-mono">${(item.price * 0.4).toFixed(2)}</p>
                      </div>
                      <div className="rounded-[1.75rem] border border-sc-gold/20 bg-sc-gold/5 p-4">
                         <p className="text-[7px] text-sc-gold uppercase font-bold tracking-widest mb-1">{isTR ? "İstenen Fiyat" : "Asking Price"}</p>
                         <p className="text-sm text-sc-gold font-mono font-bold">${item.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 mb-10 text-sm text-slate-300">
                      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                         <p className="text-[7px] uppercase tracking-widest text-white/50">{isTR ? "Satıcı" : "Seller"}</p>
                         <p className="mt-2 font-semibold text-white uppercase">{item.seller_name || (isTR ? "Anonim" : "Anonymous")}</p>
                      </div>
                      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                         <p className="text-[7px] uppercase tracking-widest text-white/50">{isTR ? "Sistem Yaşı" : "System Age"}</p>
                         <p className="mt-2 font-semibold text-white uppercase">{Math.floor(Math.random()*100)}D</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button className="flex-1 btn-gold py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                         {isTR ? "Satın Al" : "Purchase"}
                      </button>
                      <button className="btn-ghost w-full sm:w-auto py-4 text-[9px] font-bold uppercase tracking-widest">
                         {isTR ? "Teklif Ver" : "Offer"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-24 pt-12 border-t border-white/5 text-center opacity-30">
          <div className="text-[8px] font-mono text-slate-400 max-w-3xl mx-auto uppercase tracking-widest leading-loose">
            {isTR ? "Fiyatlama protokolleri kullanıcı tarafından belirlenir — her işlem Aegis Akıllı Kontratları tarafından doğrulanır." : "Pricing protocols are user-defined — every transaction is verified by Aegis Smart Contracts."}
          </div>
        </motion.div>
      </main>
    </PageShell>
  );
}
