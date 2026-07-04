import React from "react";
import { BookOpen, Heart, Share2, Shield, Sparkles, Wallet } from "lucide-react";
import { useCatalogStore } from "../../lib/CatalogStore";
import { StarRepository } from "../../lib/StarRepository";
import { useT } from "../../lib/i18n";
import { shareStarTarget } from "../../lib/StarLinks";

export default function ActionBar({
  starId,
  layout = "card",
  onReadStory = null,
}) {
  const { lang } = useT();
  const isTR = lang === "TR";
  const store = useCatalogStore();
  const star = StarRepository.getStarById(starId);

  if (!star) return null;

  const isFavorite = store.isFavorite(starId);
  const isForSale = !!star.forSale || !!star.askingPrice;

  const handleClaim = (event) => {
    event.stopPropagation();
    store.onClaim?.(star);
  };

  const handleFavorite = (event) => {
    event.stopPropagation();
    store.toggleFavorite(starId);
  };

  const handleShare = async (event) => {
    event.stopPropagation();
    try {
      const copied = await shareStarTarget(star);
      if (copied && !navigator.share) alert("Yildiz baglantisi kopyalandi!");
    } catch (error) {
      console.warn("Star share failed", error);
    }
  };

  const handleStory = (event) => {
    event.stopPropagation();
    if (onReadStory) {
      onReadStory(star);
    } else {
      alert(`${star.name} hikayesi yakinda sizlerle!`);
    }
  };

  if (layout === "card") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleFavorite}
          className={`p-2 rounded-lg border border-white/10 hover:border-white/20 transition-all ${
            isFavorite ? "text-sc-gold bg-sc-gold/5 border-sc-gold/20" : "text-white/40 hover:text-white"
          }`}
          title={isFavorite ? "Favorilerden cikar" : "Favorilere ekle"}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {!star.isClaimed || isForSale ? (
          <button
            onClick={handleClaim}
            className="px-4 py-2 rounded-lg bg-sc-gold hover:bg-sc-gold/90 text-[#050814] text-[10px] font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            {isForSale ? (isTR ? "Satin Al" : "Buy Now") : (isTR ? "Sahiplen" : "Claim")}
          </button>
        ) : (
          <button
            disabled
            className="px-4 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-white/30 text-[10px] font-mono uppercase tracking-widest cursor-not-allowed flex items-center gap-1.5"
          >
            <Shield className="w-3 h-3" />
            {isTR ? "Sahipli" : "Owned"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {!star.isClaimed ? (
        <button
          onClick={handleClaim}
          className="w-full py-3 rounded-xl bg-sc-gold hover:bg-sc-gold/90 text-[#050814] text-xs font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Yildizi Sahiplen
        </button>
      ) : (
        <button
          onClick={() => {
            if (star.certificateUrl) {
              window.open(star.certificateUrl, "_blank");
            } else {
              alert("Sertifika dosyasi yukleniyor...");
            }
          }}
          className="w-full py-3 rounded-xl bg-[#0b1026]/80 hover:bg-[#111738] text-white text-xs font-mono font-bold uppercase border border-white/10 hover:border-sc-gold/20 tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4 text-sc-gold" />
          Sertifikayi Goruntule
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          onClick={handleFavorite}
          className={`py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white/60 hover:text-white ${
            isFavorite ? "text-sc-gold bg-sc-gold/5 border-sc-gold/20" : ""
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
          {isFavorite ? "Favori" : "Begen"}
        </button>

        <button
          onClick={handleShare}
          className="py-2 rounded-lg border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-wider"
        >
          <Share2 className="w-3.5 h-3.5" />
          Paylas
        </button>

        <button
          disabled={!star.isClaimed}
          className="py-2 rounded-lg border border-white/10 hover:border-white/20 text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-wider"
        >
          <Wallet className="w-3.5 h-3.5" />
          Mint NFT
        </button>
      </div>

      <button
        onClick={handleStory}
        className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 hover:text-white text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2"
      >
        <BookOpen className="w-4 h-4 text-sc-gold" />
        Hikayesini Oku ({star.storyCount || 0})
      </button>
    </div>
  );
}
