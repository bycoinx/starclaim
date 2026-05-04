import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { TrendingUp, Clock, Loader2, ArrowUpRight, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const tierCls = {
  legendary: "tier-legendary", zodiac: "tier-zodiac", named: "tier-named",
  constellation: "tier-constellation", standard: "tier-standard",
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
    <div className="min-h-screen bg-sc-deep pt-28 pb-24 relative">
      <div className="absolute inset-0 nebula-bg opacity-70 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/30 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-5">
            <TrendingUp className="w-3 h-3" /> Trading Desk
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">{t("market_title")}</h1>
          <p className="text-sc-text-muted max-w-2xl mx-auto">{t("market_sub")}</p>
        </div>

        <div className="glass rounded-2xl p-5 mb-10 text-center text-sm text-sc-gold tracking-wider">
          {t("market_banner")}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-sc-gold" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="market-grid">
            {listings.map((l) => (
              <div
                key={l.listing_id}
                data-testid={`listing-${l.star_code}`}
                className={`glass rounded-2xl p-6 border ${tierCls[l.tier] || tierCls.standard} hover:-translate-y-1 transition-transform`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl">{l.star_name}</h3>
                    <div className="text-xs text-sc-text-muted">{l.constellation}</div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-mono ${l.percent_increase >= 0 ? "text-sc-green" : "text-sc-red"}`}>
                    <ArrowUpRight className="w-3 h-3" /> {l.percent_increase >= 0 ? "+" : ""}{l.percent_increase}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="glass rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">{t("market_original")}</div>
                    <div className="text-sm line-through text-sc-text-muted font-mono">${l.original_price}</div>
                  </div>
                  <div className="glass-gold rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">{t("market_asking")}</div>
                    <div className="text-lg font-display text-sc-gold">${l.asking_price}</div>
                  </div>
                </div>

                <div className="text-xs text-sc-text-muted flex items-center gap-2 mb-4">
                  <Clock className="w-3 h-3" /> {lang === "TR" ? "Sahibi" : "Owner"}:
                  <span className="text-sc-blue">{l.owner_name}</span>
                  <span>· {l.days_ago} {lang === "TR" ? t("market_days_ago") : t("market_days_ago")}</span>
                </div>
                <div className="text-[10px] text-sc-text-muted uppercase tracking-widest mb-4">
                  {l.hops} {lang === "TR" ? "el değiştirdi" : "hand over"}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => buyListing(l)} disabled={buyingId === l.listing_id} className="btn-gold flex-1 text-xs py-2.5 disabled:opacity-60" data-testid={`buy-${l.star_code}`}>
                    <span className="inline-flex items-center justify-center gap-1.5">
                      {buyingId === l.listing_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      {t("market_buy")}
                    </span>
                  </button>
                  <button className="btn-ghost flex-1 text-xs py-2.5" data-testid={`offer-${l.star_code}`}>{t("market_offer")}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass-gold rounded-2xl p-8 mt-14 text-center">
          <p className="font-accent italic text-lg text-sc-text mb-2">{t("market_commission_box")}</p>
          <div className="text-xs text-sc-text-muted tracking-widest uppercase">
            {lang === "TR" ? "Fiyatı sen belirlersin — alt veya üst limit yok." : "You set the price — no limits."}
          </div>
        </div>
      </div>
    </div>
  );
}
