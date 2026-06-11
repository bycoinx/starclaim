import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { Loader2, Telescope, Activity, Star, Info, ArrowUpDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./Console.css";

const tierCls = {
  legendary: "border-sc-gold shadow-[0_0_20px_rgba(251,191,36,0.1)]",
  zodiac: "border-purple-500/30",
  supernova: "border-sc-blue/40",
  nova: "border-sc-green/30",
  standard: "border-white/10",
};

export default function StarPicker({ onClaim }) {
  const { t, lang } = useT();
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default"); // default, price-high, price-low, name-az, name-za

  const loadStars = () => {
    setLoading(true);
    setError("");
    api.get("/stars", { params: { limit: 100 } })
      .then(({ data }) => {
        if (Array.isArray(data)) setStars(data);
        else setStars([]);
      })
      .catch((err) => {
        console.error("Star Catalog fetch error:", err);
        setStars([]);
        setError(lang === "TR" ? "Yıldız kataloğu şu anda yüklenemedi." : "Star catalog could not be loaded.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStars();
  }, [lang]);

  const sortedStars = [...stars].sort((a, b) => {
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "name-az") return (a.proper || a.name).localeCompare(b.proper || b.name);
    if (sortBy === "name-za") return (b.proper || b.name).localeCompare(a.proper || a.name);
    return 0; // default (ranking from API)
  });

  const filteredStars = sortedStars.filter(s => filter === "all" || s.tier?.toLowerCase() === filter);

  return (
    <div className="min-h-screen bg-[#010208] pt-28 pb-24 relative overflow-hidden dashboard-container">
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2 font-bold">
              <Telescope size={12} className="animate-pulse" />
              AEGIS_TELESCOPE // STAR_CATALOG_PRIMARY
            </div>
            <h1 className="font-display text-4xl md:text-6xl tracking-tight">
              Yıldızını <span className="gold-gradient-text">Seç</span>
            </h1>
            <p className="text-sc-text-muted max-w-md mt-4 text-sm font-mono opacity-70">
              {lang === "TR" 
                ? "Evrendeki ebedi mirasınızı seçin. Her yıldız kendine has bir koordinat ve tarihe sahiptir." 
                : "Choose your eternal legacy in the universe. Each star has unique coordinates and history."}
            </p>
          </div>

          {/* Sorting Controls */}
          <div className="flex items-center gap-4 bg-sc-deep/40 p-2 rounded-xl border border-white/5 self-start md:self-end">
             <div className="flex items-center gap-2 px-3 text-[10px] text-sc-gold/60 font-bold tracking-widest border-r border-white/10 uppercase">
                <ArrowUpDown size={12} /> {isTR ? "Sıralama" : "Sort"}
             </div>
             <select 
               value={sortBy} 
               onChange={(e) => setSortBy(e.target.value)}
               className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer pr-4"
             >
                <option value="default" className="bg-sc-deep">{isTR ? "Varsayılan" : "Default"}</option>
                <option value="price-high" className="bg-sc-deep">{isTR ? "En Pahalı" : "Price: High"}</option>
                <option value="price-low" className="bg-sc-deep">{isTR ? "En Ucuz" : "Price: Low"}</option>
                <option value="name-az" className="bg-sc-deep">A → Z</option>
                <option value="name-za" className="bg-sc-deep">Z → A</option>
             </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          {["all", "legendary", "zodiac", "supernova", "nova"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                filter === t ? "border-sc-gold bg-sc-gold/10 text-sc-gold" : "border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              {t === "all" ? (isTR ? "Tümü" : "All") : t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-sc-gold opacity-50" />
            <div className="text-[10px] tracking-[0.3em] text-sc-gold/60 uppercase font-bold font-mono">Scanning Deep Space...</div>
          </div>
        ) : error ? (
          <div className="terminal-frame border-sc-red/30 p-10 text-center max-w-2xl mx-auto">
            <div className="terminal-scanline" />
            <Activity className="w-10 h-10 text-sc-red mx-auto mb-5" />
            <p className="text-sc-text-muted mb-7 font-mono text-xs">{error}</p>
            <button onClick={loadStars} className="btn-gold px-8 py-3 uppercase text-[10px] font-bold">RETRY_PROTOCOL</button>
          </div>
        ) : filteredStars.length === 0 ? (
          <div className="text-center py-20 text-sc-text-muted uppercase tracking-[0.2em] text-xs font-mono">
            Bu kategoride uygun yıldız bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStars.map((s, idx) => (
                <motion.div
                  key={s.star_id || s.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`terminal-frame p-6 border ${tierCls[s.tier?.toLowerCase()] || tierCls.standard} group`}
                >
                  <div className="terminal-scanline" />
                  <div className="flex items-start justify-between mt-4 mb-6">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.2em] text-sc-gold font-bold mb-1">{s.tier}</div>
                      <h3 className="font-display text-2xl gold-gradient-text tracking-tight">{s.name}</h3>
                      <div className="text-[9px] text-sc-text-muted font-mono tracking-wider mt-1 uppercase">
                         {s.constellation} // {s.code}
                      </div>
                    </div>
                    {s.spect && (
                      <div className="px-2 py-1 rounded border border-sc-blue/20 text-[8px] font-bold font-mono text-sc-blue bg-sc-blue/5">
                        {s.spect}
                      </div>
                    )}
                  </div>

                  <div className="telemetry-item-box border-sc-gold/40 bg-sc-gold/5 mb-6">
                    <div className="telemetry-label text-sc-gold">Sahiplenme Bedeli</div>
                    <div className="telemetry-value text-sc-gold font-bold text-2xl">${s.price}</div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => onClaim(s)} 
                      className="flex-1 py-3 rounded-lg bg-sc-gold text-sc-deep text-[10px] uppercase tracking-[0.2em] font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      SAHİPLEN
                    </button>
                    <button className="p-3 rounded-lg border border-white/10 text-white/40 hover:text-white transition-all">
                      <Info size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
