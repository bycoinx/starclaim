import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { TrendingUp, Clock, Loader2, ArrowUpRight, ShoppingCart, BarChart3, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    api.get("/marketplace/listings")
      .then(({ data }) => {
        if (Array.isArray(data)) setListings(data);
        else setListings([]);
      })
      .catch((err) => {
        console.error("Marketplace fetch error:", err);
        setListings([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
    <div className="min-h-screen bg-sc-deep pt-28 pb-24 relative overflow-hidden">
      <div className="absolute inset-0 nebula-bg opacity-40 pointer-events-none" />
      
      {/* Background Grid for "Trading Desk" feel */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.4em] text-sc-gold mb-5">
              <Activity className="w-3 h-3 animate-pulse" /> Terminal Active
            </div>
            <h1 className="font-display text-4xl md:text-6xl mb-3 tracking-tight">Trading <span className="text-sc-gold">Desk</span></h1>
            <p className="text-sc-text-muted max-w-md">{t("market_sub")}</p>
          </div>

          <div className="flex gap-4">
             <div className="glass-dark p-4 rounded-2xl border-white/5 min-w-[140px]">
                <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-1">Volume 24h</div>
                <div className="text-xl font-display text-white">$12,450</div>
             </div>
             <div className="glass-dark p-4 rounded-2xl border-white/5 min-w-[140px]">
                <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-1">Market Cap</div>
                <div className="text-xl font-display text-sc-gold">$2.4M</div>
             </div>
          </div>
        </div>

        {/* Live Ticker Banner */}
        <div className="glass-dark border border-white/5 rounded-2xl p-4 mb-10 overflow-hidden relative">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            {[1,2,3].map(i => (
              <React.Fragment key={i}>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sc-gold/60 flex items-center gap-2">
                   <BarChart3 className="w-3 h-3" /> {t("market_banner")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sc-blue flex items-center gap-2">
                   <TrendingUp className="w-3 h-3" /> New Legendary Listing: SIRIUS X-1
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sc-green flex items-center gap-2">
                   <Activity className="w-3 h-3" /> System Status: OPTIMAL
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-sc-gold" /></div>
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
                  className={`glass-dark rounded-3xl p-6 border ${tierCls[l.tier] || tierCls.standard} hover:border-sc-gold/40 transition-all group`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-sc-gold/60 mb-1 font-display">{l.tier}</div>
                      <h3 className="font-display text-2xl text-white group-hover:text-sc-gold transition-colors">{l.star_name}</h3>
                      <div className="text-xs text-sc-text-muted italic">{l.constellation}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5 ${l.percent_increase >= 0 ? "bg-sc-green/10 text-sc-green" : "bg-sc-red/10 text-sc-red"}`}>
                      <ArrowUpRight className="w-3 h-3" /> {l.percent_increase >= 0 ? "+" : ""}{l.percent_increase}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] uppercase tracking-widest text-sc-text-muted mb-1">{t("market_original")}</div>
                      <div className="text-sm line-through text-sc-text-muted font-mono">${l.original_price}</div>
                    </div>
                    <div className="bg-sc-gold/5 rounded-2xl p-4 border border-sc-gold/10">
                      <div className="text-[9px] uppercase tracking-widest text-sc-gold/40 mb-1">{t("market_asking")}</div>
                      <div className="text-xl font-display text-sc-gold">${l.asking_price}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex flex-col">
                       <span className="text-[9px] uppercase tracking-widest text-sc-text-muted">{lang === "TR" ? "Satıcı" : "Seller"}</span>
                       <span className="text-xs text-sc-blue font-medium">{l.owner_name}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] uppercase tracking-widest text-sc-text-muted">{lang === "TR" ? "Süre" : "Age"}</span>
                       <div className="text-xs text-white/60 flex items-center justify-end gap-1.5">
                          <Clock className="w-3 h-3" /> {l.days_ago}d
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => buyListing(l)} 
                      disabled={buyingId === l.listing_id} 
                      className="flex-[2] py-3.5 rounded-2xl bg-sc-gold text-sc-deep text-[10px] uppercase tracking-[0.2em] font-bold shadow-[0_0_20px_rgba(251,191,36,0.1)] hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid={`buy-${l.star_code}`}
                    >
                      {buyingId === l.listing_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      {t("market_buy")}
                    </button>
                    <button className="flex-1 py-3.5 rounded-2xl border border-white/10 text-white/60 text-[10px] uppercase tracking-widest hover:border-white/30 hover:text-white transition-all" data-testid={`offer-${l.star_code}`}>{t("market_offer")}</button>
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
          className="glass-dark border border-sc-gold/20 rounded-3xl p-10 mt-20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sc-gold/50 to-transparent" />
          <BarChart3 className="w-8 h-8 text-sc-gold/20 mx-auto mb-6" strokeWidth={1} />
          <p className="font-display text-2xl text-sc-gold mb-3 uppercase tracking-widest">{t("market_commission_box")}</p>
          <div className="text-xs text-sc-text-muted tracking-[0.3em] uppercase max-w-lg mx-auto leading-relaxed">
            {lang === "TR" ? "Fiyatı sen belirlersin — her işlem akıllı kontratlar tarafından doğrulanır." : "You set the price — every transaction is verified by smart protocols."}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

