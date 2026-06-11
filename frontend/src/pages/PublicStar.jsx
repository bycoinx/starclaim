import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { Globe, ShieldCheck, Share2, Loader2, Sparkles } from "lucide-react";
import StarCanvas from "../components/StarCanvas";
import { motion } from "framer-motion";

export default function PublicStar() {
  const { code } = useParams();
  const { lang } = useT();
  const [star, setStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/stars/registry/${code}`)
      .then(({ data }) => {
        setStar(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Registry fetch error:", err);
        setError(true);
        setLoading(false);
      });
  }, [code]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `StarClaim - ${star.custom_name || star.name}`,
        text: `${star.custom_name || star.name} yıldızını keşfedin!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(lang === "TR" ? "Link kopyalandı!" : "Link copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sc-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sc-gold" />
      </div>
    );
  }

  if (error || !star) {
    return (
      <div className="min-h-screen bg-sc-deep flex items-center justify-center pt-24">
        <div className="text-center p-10 glass rounded-2xl max-w-md">
          <h2 className="font-display text-2xl mb-4">Registry Entry Not Found</h2>
          <p className="text-sc-text-muted mb-8 italic font-accent">Aegis was unable to locate star code "{code}" in the interstellar registry.</p>
          <Link to="/stars" className="btn-gold px-10">Back to Map</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sc-deep pt-32 pb-24 relative overflow-hidden">
      <StarCanvas density={400} />
      <div className="absolute inset-0 nebula-bg pointer-events-none opacity-60" />
      
      <div className="relative max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="terminal-frame p-12 relative"
        >
          <div className="terminal-scanline" />
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.5em] text-sc-gold font-bold mb-4 uppercase">
                <Sparkles size={12} /> INTERSTELLAR_REGISTRY_OFFICIAL
              </div>
              <h1 className="font-display text-6xl gold-gradient-text mb-2">
                {star.custom_name || star.name || "Unnamed Star"}
              </h1>
              <div className="text-xl text-sc-text-muted font-accent italic">
                {star.name || star.code} {" // "} {(star.constellation || "Deep Space").toUpperCase()}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="glass px-4 py-2 rounded-lg border-sc-gold/20 flex items-center gap-2 mb-4">
                 <ShieldCheck size={16} className="text-sc-gold" />
                 <span className="text-[10px] tracking-widest font-bold uppercase">Ownership Verified</span>
              </div>
              <button onClick={handleShare} className="btn-ghost flex items-center gap-2 text-xs py-3 px-6">
                <Share2 size={14} /> SHARE_COORDINATES
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-8">
               <div className="telemetry-grid">
                  <div className="telemetry-item-box p-6">
                    <div className="telemetry-label">RIGHT_ASCENSION</div>
                    <div className="telemetry-value text-2xl">{star.ra}</div>
                  </div>
                  <div className="telemetry-item-box p-6">
                    <div className="telemetry-label">DECLINATION</div>
                    <div className="telemetry-value text-2xl">{star.dec}</div>
                  </div>
                  <div className="telemetry-item-box p-6 col-span-2">
                    <div className="telemetry-label">BRIGHTNESS_MAGNITUDE</div>
                    <div className="telemetry-value text-2xl">{star.magnitude}</div>
                  </div>
               </div>
               
               <div className="glass p-8 rounded-2xl border-white/5 bg-white/[0.02]">
                  <div className="text-[10px] tracking-widest text-sc-gold font-bold uppercase mb-4">PROVENANCE</div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-sc-gold/10 flex items-center justify-center border border-sc-gold/20">
                       <Globe size={24} className="text-sc-gold" />
                    </div>
                    <div>
                       <div className="text-xs text-sc-text-muted uppercase tracking-tighter">Current Guardian</div>
                       <div className="text-xl font-display text-sc-text">{star.owner_name || "The Aegis Preserve"}</div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="relative">
               <div className="absolute -inset-1 bg-sc-gold/10 blur-xl rounded-2xl" />
               <div className="relative glass p-8 rounded-2xl border-sc-gold/20 h-full bg-[#0A1628]/60">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-1.5 h-1.5 bg-sc-gold rounded-full animate-pulse" />
                     <span className="text-[10px] tracking-[0.2em] font-bold text-sc-gold uppercase">Quantum Narrative // Decrypted</span>
                  </div>
                  <p className="font-accent italic text-sc-text/90 leading-relaxed text-sm md:text-base whitespace-pre-line">
                    {star.ai_story || (lang === "TR" ? "Bu yıldızın hikayesi henüz kuantum alanında oluşmamış." : "This star's story is still forming in the quantum field.")}
                  </p>
               </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex justify-between items-center text-[9px] text-sc-text-muted font-mono tracking-widest uppercase">
            <div>StarClaim // Verified on Solana Mainnet</div>
            <div>Registry Date: {star.claimed_at ? new Date(star.claimed_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </motion.div>
        
        <div className="mt-12 text-center">
          <p className="text-sc-text-muted text-sm mb-6">{lang === "TR" ? "Kendi yıldızınızı sahiplenmek ister misiniz?" : "Want to claim your own star?"}</p>
          <Link to="/stars" className="btn-gold px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-xs">
            {lang === "TR" ? "Gök Yüzünü Keşfet" : "Explore the Heavens"}
          </Link>
        </div>
      </div>
    </div>
  );
}
