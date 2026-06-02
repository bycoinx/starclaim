import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { TrendingUp, Clock, Loader2, ArrowUpRight, ShoppingCart, BarChart3, Activity, RefreshCw, Telescope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import "./Console.css";

const tierCls = {
  legendary: "border-sc-gold shadow-[0_0_20px_rgba(251,191,36,0.1)]",
  zodiac: "border-purple-500/30",
  named: "border-blue-500/30",
  constellation: "border-green-500/30",
  standard: "border-white/10",
};

export default function Marketplace() {
  const { t, lang } = useT();
  const { user, login } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingId, setBuyingId] = useState(null);
  const [metrics, setMetrics] = useState({ market_cap: 2400000, volume_24h: 12450 });

  const loadListings = () => {
    setLoading(true);
    setError("");
    api.get("/marketplace/listings")
      .then(({ data }) => {
        if (Array.isArray(data)) setListings(data);
        else setListings([]);
      })
      .catch((err) => {
        console.error("Marketplace fetch error:", err);
        setListings([]);
        setError(lang === "TR" ? "Marketplace verileri şu anda yüklenemedi." : "Marketplace data could not be loaded.");
      })
      .finally(() => setLoading(false));
  };

  const loadMetrics = () => {
    api.get("/marketplace/metrics")
      .then(({ data }) => {
        if (data) setMetrics(data);
      })
      .catch(err => console.error("Metrics fetch error:", err));
  };

  useEffect(() => {
    loadListings();
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const buyListing = async (listing) => {
    if (!user) {
      login();
      return;
    }
    setBuyingId(listing.listing_id);
    try {
      const { data } = await api.post("/marketplace/checkout/session", {
        listing_id: listing.listing_id,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || (lang === "TR" ? "Satin alma baslatilamadi." : "Purchase could not be started."));
      setBuyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-28 pb-24 relative overflow-hidden dashboard-container">
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      {/* Background Grid for "Trading Desk" feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2 font-bold">
              <Activity size={12} className="animate-pulse" />
              TERMINAL_ACTIVE // TRADING_DESK_CONNECTED
            </div>
            <h1 className="font-display text-4xl md:text-6xl tracking-tight">
              Trading <span className="gold-gradient-text">Desk</span>
            </h1>
            <p className="text-sc-text-muted max-w-md mt-4 text-sm font-mono opacity-70">
              {t("market_sub")}
            </p>
          </div>

          <div className="flex gap-4">
             <div className="dashboard-stats-card min-w-[160px]">
                <div className="corner-accent corner-tl" />
                <div className="corner-accent corner-br" />
                <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-1 font-bold">Volume 24h</div>
                <div className="text-2xl font-display text-white">${metrics.volume_24h.toLocaleString()}</div>
                <div className={`text-[8px] mt-1 font-mono ${metrics.volume_24h > 0 ? "text-sc-green" : "text-sc-gold opacity-50"}`}>
                   STATUS: {metrics.volume_24h > 0 ? "OPTIMAL" : "STABLE"}
                </div>
             </div>
             <div className="dashboard-stats-card min-w-[160px]">
                <div className="corner-accent corner-tl" />
                <div className="corner-accent corner-br" />
                <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-1 font-bold">Market Cap</div>
                <div className="text-2xl font-display text-sc-gold">
                  {metrics.market_cap >= 1000000 ? `$${(metrics.market_cap / 1000000).toFixed(1)}M` : `$${metrics.market_cap.toLocaleString()}`}
                </div>
                <div className="text-[8px] text-sc-blue mt-1 font-mono">NETWORK: STABLE</div>
             </div>
          </div>
        </div>

        {/* Live Ticker Banner */}
        <div className="terminal-frame border-white/5 p-4 mb-10 overflow-hidden relative">
          <div className="terminal-scanline" />
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            {[1,2,3].map(i => (
              <React.Fragment key={i}>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sc-gold/60 flex items-center gap-2 font-bold">
                   <BarChart3 className="w-3 h-3" /> {t("market_banner")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sc-blue flex items-center gap-2 font-bold">
                   <TrendingUp className="w-3 h-3" /> NEW LEGENDARY LISTING: SIRIUS X-1
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sc-green flex items-center gap-2 font-bold">
                   <Activity className="w-3 h-3" /> AEGIS_SUPPORT: ONLINE
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-sc-gold opacity-50" />
            <div className="text-[10px] tracking-[0.3em] text-sc-gold/60 uppercase font-bold font-mono">Syncing with Marketplace Protocol...</div>
          </div>
        ) : error ? (
          <div className="terminal-frame border-sc-red/30 p-10 text-center max-w-2xl mx-auto">
            <div className="terminal-scanline" />
            <Activity className="w-10 h-10 text-sc-red mx-auto mb-5" />
            <h2 className="font-display text-3xl mb-3">{lang === "TR" ? "Bağlantı Kurulamadı" : "Connection Failed"}</h2>
            <p className="text-sc-text-muted mb-7 font-mono text-xs">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button type="button" onClick={loadListings} className="btn-gold justify-center text-[10px] font-bold uppercase tracking-widest px-8">
                <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> RETRY_PROTOCOL</span>
              </button>
              <Link to="/stars" className="btn-ghost justify-center text-[10px] font-bold uppercase tracking-widest px-8">
                <span className="inline-flex items-center gap-2"><Telescope className="w-4 h-4" /> CATALOG_REDIRECT</span>
              </Link>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="terminal-frame border-white/10 p-10 text-center max-w-2xl mx-auto">
            <div className="terminal-scanline" />
            <BarChart3 className="w-10 h-10 text-sc-gold/40 mx-auto mb-5" />
            <h2 className="font-display text-3xl mb-3">{lang === "TR" ? "Aktif Liste Yok" : "No Active Listings"}</h2>
            <p className="text-sc-text-muted mb-8 font-mono text-xs max-w-xs mx-auto">
              {lang === "TR"
                ? "Marketplace protokolü çevrimiçi. İlk yıldızını katalogdan sahiplenerek sisteme dahil olabilirsin."
                : "Marketplace protocol online. Register your first star from the catalog to participate in the network."}
            </p>
            <Link to="/stars" className="btn-gold px-8 py-3 rounded-xl uppercase tracking-widest text-[10px] font-bold">
              {lang === "TR" ? "Yıldız Kataloğu" : "Star Catalog"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="market-grid">
            <AnimatePresence>
              {listings.map((l, idx) => (
                <motion.div
                  key={l.listing_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  data-testid={`listing-${l.star_code}`}
                  className={`terminal-frame p-6 border ${tierCls[l.tier] || tierCls.standard} group`}
                >
                  <div className="terminal-scanline" />
                  <div className="terminal-header" />

                  <div className="flex items-start justify-between mt-4 mb-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-sc-gold font-bold mb-1">{l.tier}</div>
                      <h3 className="font-display text-2xl gold-gradient-text tracking-tight">{l.star_name}</h3>
                      <div className="text-[10px] text-sc-text-muted font-mono tracking-wider flex items-center gap-1 mt-1">
                        <Activity size={10} /> {l.constellation.toUpperCase()} // CODE: {l.star_code}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded border text-[9px] font-bold font-mono flex items-center gap-1 ${l.percent_increase >= 0 ? "border-sc-green/20 text-sc-green bg-sc-green/5" : "border-sc-red/20 text-sc-red bg-sc-red/5"}`}>
                      {l.percent_increase >= 0 ? "+" : ""}{l.percent_increase}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="telemetry-item-box">
                      <div className="telemetry-label">Original Val.</div>
                      <div className="telemetry-value text-sc-text-muted line-through opacity-50">${l.original_price}</div>
                    </div>
                    <div className="telemetry-item-box border-sc-gold/40 bg-sc-gold/5">
                      <div className="telemetry-label text-sc-gold">Asking Price</div>
                      <div className="telemetry-value text-sc-gold font-bold">${l.asking_price}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 px-1 border-t border-white/5 pt-4">
                    <div className="flex flex-col">
                       <span className="text-[8px] uppercase tracking-widest text-sc-text-muted font-bold">Seller_ID</span>
                       <span className="text-[10px] text-sc-blue font-mono font-bold">{l.owner_name.toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[8px] uppercase tracking-widest text-sc-text-muted font-bold">System_Age</span>
                       <div className="text-[10px] text-white/60 flex items-center justify-end gap-1.5 font-mono">
                          <Clock className="w-3 h-3" /> {l.days_ago}D
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => buyListing(l)} 
                      disabled={buyingId === l.listing_id} 
                      className="flex-[2] py-3 rounded-lg bg-sc-gold text-sc-deep text-[10px] uppercase tracking-[0.2em] font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid={`buy-${l.star_code}`}
                    >
                      {buyingId === l.listing_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      EXEC_PURCHASE
                    </button>
                    <button className="flex-1 py-3 rounded-lg border border-white/10 text-white/40 text-[9px] uppercase tracking-widest font-bold hover:border-white/30 hover:text-white transition-all" data-testid={`offer-${l.star_code}`}>OFFER</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer Info Box */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="terminal-frame p-10 mt-20 text-center relative overflow-hidden"
        >
          <div className="terminal-scanline" />
          <div className="terminal-header" />
          <BarChart3 className="w-8 h-8 text-sc-gold/20 mx-auto mb-6" strokeWidth={1} />
          <p className="font-display text-2xl text-sc-gold mb-3 uppercase tracking-[0.2em]">{t("market_commission_box")}</p>
          <div className="text-[9px] text-sc-text-muted tracking-[0.3em] uppercase max-w-lg mx-auto leading-relaxed font-mono">
            {lang === "TR" ? "Fiyatlandırma protokolleri kullanıcılar tarafından belirlenir — her işlem Aegis Akıllı Kontratları tarafından doğrulanır." : "Pricing protocols are user-defined — every transaction is verified by Aegis Smart Contracts."}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
