import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { TrendingUp, Shield, Activity, ArrowUpDown, ChevronRight, Search, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Marketplace() {
  const { t, lang } = useT();
  const { user } = useAuth();
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
          vol: mRes.data.volume_24h,
          cap: mRes.data.market_cap,
          avg: mRes.data.avg_price
        });
        setItems(iRes.data);
      } catch (err) {
        console.error("Market load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadMarket();
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "name-az") return a.star_name.localeCompare(b.star_name);
    if (sortBy === "name-za") return b.star_name.localeCompare(a.star_name);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#010208] pt-28 pb-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        {/* Header HUD */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-3 font-bold">
              <Activity size={12} className="animate-pulse" />
              TERMINAL_ACTIVE // TRADING_DESK_CONNECTED
            </div>
            <h1 className="font-display text-5xl md:text-7xl tracking-tighter text-white uppercase">
              Trading <span className="gold-gradient-text">Desk</span>
            </h1>
            <p className="text-sc-text-muted max-w-xl mt-6 text-sm font-mono opacity-60 leading-relaxed uppercase tracking-widest">
               Sahiplerinden yıldız satın al. Kendi yıldızını sat. Değer kazan. Yıldızlar önem ve fiyat bazında sıralandı.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
            <div className="telemetry-item-box bg-white/2 border-white/5 p-6 min-w-[200px]">
               <div className="text-[8px] text-sc-text-muted uppercase font-bold tracking-[0.2em] mb-3">Volume 24h</div>
               <div className="text-2xl text-white font-mono font-bold">${metrics.vol.toLocaleString()}</div>
               <div className="text-[8px] text-sc-green mt-2 font-bold tracking-widest uppercase">Status: Optimal</div>
            </div>
            <div className="telemetry-item-box bg-white/2 border-white/5 p-6 min-w-[200px]">
               <div className="text-[8px] text-sc-text-muted uppercase font-bold tracking-[0.2em] mb-3">Market Cap</div>
               <div className="text-2xl text-white font-mono font-bold">${(metrics.cap / 1000000).toFixed(1)}M</div>
               <div className="text-[8px] text-sc-blue mt-2 font-bold tracking-widest uppercase">Network: Stable</div>
            </div>
            <div className="telemetry-item-box bg-sc-gold/5 border-sc-gold/20 p-6 min-w-[200px]">
               <div className="text-[8px] text-sc-gold uppercase font-bold tracking-[0.2em] mb-3">Avg. Star Price</div>
               <div className="text-2xl text-sc-gold font-mono font-bold">${metrics.avg.toFixed(2)}</div>
               <div className="text-[8px] text-sc-gold/40 mt-2 font-bold tracking-widest uppercase italic">Importance pricing feed</div>
            </div>
          </div>
        </div>

        {/* Global Market Ticker & Sorting */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-y border-white/5 py-4 px-4 bg-white/2">
           <div className="flex items-center gap-8 overflow-hidden">
              <div className="flex items-center gap-2 whitespace-nowrap">
                 <TrendingUp size={14} className="text-sc-gold" />
                 <span className="text-[10px] font-bold text-sc-gold uppercase tracking-[0.2em]">New Legendary Listing: Sirius X-1</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap opacity-40">
                 <Shield size={14} className="text-sc-blue" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Aegis_Support: Online</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[9px] text-white/40 uppercase tracking-widest font-bold">
                 <ArrowUpDown size={12} /> {isTR ? "Sıralama" : "Sort"}
              </div>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border border-white/10 p-2 rounded hover:border-sc-gold/50 transition-colors"
              >
                 <option value="default" className="bg-sc-deep">{isTR ? "Varsayılan" : "Importance"}</option>
                 <option value="price-high" className="bg-sc-deep">{isTR ? "En Pahalı" : "Price: High"}</option>
                 <option value="price-low" className="bg-sc-deep">{isTR ? "En Ucuz" : "Price: Low"}</option>
                 <option value="name-az" className="bg-sc-deep">A → Z</option>
                 <option value="name-za" className="bg-sc-deep">Z → A</option>
              </select>
           </div>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center">
             <Loader2 className="w-12 h-12 animate-spin text-sc-gold opacity-20" />
             <div className="text-[9px] tracking-[0.4em] text-sc-gold uppercase mt-8 font-black">Syncing_Orderbook...</div>
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
                  className="terminal-frame p-8 border-white/5 hover:border-sc-gold/30 group transition-all duration-500 bg-sc-deep/20"
                >
                  <div className="terminal-scanline" />
                  <div className="flex justify-between items-start mb-8">
                    <div className="px-3 py-1 bg-sc-blue/5 border border-sc-blue/20 rounded text-[8px] font-bold text-sc-blue uppercase tracking-widest">
                       {item.tier} asset
                    </div>
                    <div className="text-[10px] font-mono text-sc-green font-bold">+{Math.floor(Math.random()*300)}%</div>
                  </div>

                  <h3 className="font-display text-3xl text-white mb-2 group-hover:text-sc-gold transition-colors uppercase tracking-tight">{item.star_name}</h3>
                  <div className="text-[9px] text-sc-text-muted font-mono uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                     <Search size={10} /> {item.constellation} // CODE: {item.star_id}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="p-4 bg-white/2 border border-white/5 rounded-lg">
                       <div className="text-[7px] text-sc-text-muted uppercase font-bold tracking-widest mb-1">Original Val.</div>
                       <div className="text-xs text-white/40 font-mono">${(item.price * 0.4).toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-sc-gold/5 border border-sc-gold/20 rounded-lg">
                       <div className="text-[7px] text-sc-gold uppercase font-bold tracking-widest mb-1">Asking Price</div>
                       <div className="text-sm text-sc-gold font-mono font-bold">${item.price.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-8">
                    <div className="opacity-40">
                       <div className="text-[7px] text-sc-text-muted uppercase font-bold mb-1 tracking-widest">Seller_ID</div>
                       <div className="text-[9px] text-white font-mono font-bold uppercase">{item.seller_name || "Anonymous"}</div>
                    </div>
                    <div className="text-right opacity-40">
                       <div className="text-[7px] text-sc-text-muted uppercase font-bold mb-1 tracking-widest">System_Age</div>
                       <div className="text-[9px] text-white font-mono font-bold uppercase">{Math.floor(Math.random()*100)}D</div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-10">
                    <button className="flex-1 btn-gold py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                       Exec_Purchase
                    </button>
                    <button className="px-6 py-4 border border-white/10 rounded-full text-[9px] font-bold text-white/40 hover:text-white hover:border-white/20 uppercase tracking-widest transition-all">
                       Offer
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Legal Disclaimer Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-24 pt-12 border-t border-white/5 text-center opacity-30">
          <div className="text-[8px] font-mono text-sc-text-muted max-w-3xl mx-auto uppercase tracking-widest leading-loose">
            {isTR ? "Fiyatlama protokolleri kullanıcı tarafından belirlenir — her işlem Aegis Akıllı Kontratları tarafından doğrulanır." : "Pricing protocols are user-defined — every transaction is verified by Aegis Smart Contracts."}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
