import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { useWallet } from "@solana/wallet-adapter-react";
import { Star, LogIn, Loader2, Download, Tag, ShieldCheck, Zap, RotateCcw, Cpu, Terminal as TerminalIcon, Activity, Globe } from "lucide-react";
import { toast } from "sonner";
import StarCanvas from "../components/StarCanvas";
import "./Console.css";

export default function Dashboard() {
  const { user, loading, login } = useAuth();
  const { t, lang } = useT();
  const { wallet, publicKey } = useWallet();
  const [stars, setStars] = useState([]);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  const handleInstantExit = async (star) => {
    if (!publicKey) {
      toast.error(lang === "TR" ? "Lütfen önce Solana cüzdanınızı bağlayın." : "Please connect your Solana wallet first.");
      return;
    }

    const confirm = window.confirm(
      lang === "TR" 
        ? "Yıldızını geri satmak istediğine emin misin? Rezervin anında cüzdanına aktarılacak." 
        : "Are you sure you want to sell your star back? Your reserve will be returned to your wallet instantly."
    );
    if (!confirm) return;
    
    const loadingToast = toast.loading("Aegis: Initializing Instant Exit Transaction...");
    
    try {
      const { EventHorizonBridge } = await import("../lib/solana/event_horizon");
      const bridge = new EventHorizonBridge(wallet); 
      const starAccountPubKey = star.solana_address || star.star_id; 

      const tx = await bridge.instantExit(starAccountPubKey);
      toast.success(lang === "TR" ? "Kuantum Çıkış Başarılı! SOL cüzdanınıza aktarıldı." : "Quantum Exit Successful! SOL returned to wallet.", { id: loadingToast });
      
      await api.post("/stars/exit", { star_id: star.star_id, tx_signature: tx });
      refreshStars();
    } catch (err) {
      console.error(err);
      toast.error(lang === "TR" ? "İşlem başarısız oldu." : "Transaction failed.", { id: loadingToast });
    }
  };

  const refreshStars = () => {
    if (!user) return;
    setFetching(true);
    api.get("/stars/mine/list").then(({ data }) => setStars(data)).finally(() => setFetching(false));
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    refreshStars();
  }, [user, loading]);

  const downloadCertificate = async (star) => {
    if (!star.order_id) {
      toast.error(lang === "TR" ? "Bu yildiz icin siparis kaydi bulunamadi." : "No order record found for this star.");
      return;
    }
    try {
      const { data } = await api.get(`/orders/certificate/${star.order_id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `StarClaim-${star.code}-Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) {
      toast.error(lang === "TR" ? "Sertifika indirilemedi." : "Certificate could not be downloaded.");
    }
  };

  const listForSale = async (star) => {
    const input = window.prompt(
      lang === "TR" ? "Satis fiyati (USD)" : "Sale price (USD)",
      star.asking_price || star.price || ""
    );
    if (!input) return;
    const askingPrice = Number(input.replace(",", "."));
    if (!Number.isFinite(askingPrice) || askingPrice < 1) {
      toast.error(lang === "TR" ? "Gecerli bir fiyat gir." : "Enter a valid price.");
      return;
    }
    try {
      await api.post("/marketplace/list", { star_id: star.star_id, asking_price: askingPrice });
      toast.success(lang === "TR" ? "Yildiz marketplace'e eklendi." : "Star listed on marketplace.");
      refreshStars();
    } catch (e) {
      toast.error(e?.response?.data?.detail || (lang === "TR" ? "Listeleme basarisiz." : "Listing failed."));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sc-deep flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-sc-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sc-deep flex items-center justify-center pt-28 px-6 relative">
        <StarCanvas />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-10 max-w-md text-center relative z-10" 
          data-testid="login-required"
        >
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="corner-accent corner-bl" />
          <div className="corner-accent corner-br" />
          
          <Star className="w-10 h-10 text-sc-gold fill-sc-gold mx-auto mb-5" strokeWidth={1.2} />
          <h2 className="font-display text-2xl mb-3">{lang === "TR" ? "Yıldızlarını Görmek İçin Giriş Yap" : "Sign In to See Your Stars"}</h2>
          <p className="text-sc-text-muted mb-7 text-sm">
            {lang === "TR" ? "Google ile tek tıkla. Gökyüzündeki yerini güvende tut." : "One click with Google. Keep your place in the sky."}
          </p>
          <button onClick={login} className="btn-gold w-full py-4 rounded-xl">
            <span className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
              <LogIn className="w-4 h-4" /> {lang === "TR" ? "Google ile Giriş" : "Sign in with Google"}
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sc-deep pt-28 pb-24 relative dashboard-container">
      <StarCanvas />
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2 font-bold">
              <TerminalIcon size={12} />
              COMMAND_CENTER // USER_ID: {user.email.split('@')[0].toUpperCase()}
            </div>
            <h1 className="font-display text-5xl">
              {lang === "TR" ? "Hoş geldin," : "Welcome,"} <span className="gold-gradient-text">{user.name}</span>
            </h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-xs text-sc-text-muted">
                <Activity size={14} className="text-sc-green animate-pulse" />
                SYSTEM_READY
              </div>
              <div className="flex items-center gap-2 text-xs text-sc-text-muted">
                <Globe size={14} className="text-sc-blue" />
                NEURAL_LINK_ESTABLISHED
              </div>
            </div>
          </div>
          
          <div className="dashboard-stats-card min-w-[200px]">
            <div className="corner-accent corner-tl" />
            <div className="corner-accent corner-br" />
            <div className="text-[10px] uppercase tracking-[0.2em] text-sc-text-muted mb-1 font-bold">{lang === "TR" ? "Varlık Sayısı" : "Total Assets"}</div>
            <div className="font-display text-4xl text-sc-gold">{stars.length}</div>
            <div className="text-[9px] text-sc-green mt-1 font-mono tracking-tighter">ESTIMATED_VALUE: ${(stars.length * 45).toFixed(2)} USD</div>
          </div>
        </motion.div>

        {fetching ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-sc-gold opacity-50" />
            <div className="text-[10px] tracking-[0.3em] text-sc-gold/60 uppercase font-bold">Syncing with StarVault...</div>
          </div>
        ) : stars.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="terminal-frame p-20 text-center"
          >
            <div className="terminal-scanline" />
            <Star className="w-12 h-12 text-sc-gold/40 mx-auto mb-6" strokeWidth={1} />
            <h3 className="font-display text-2xl mb-4 text-sc-text">{lang === "TR" ? "Henüz Bir Yıldızın Yok" : "No Stars Detected"}</h3>
            <p className="text-sc-text-muted mb-8 max-w-sm mx-auto">{lang === "TR" ? "Gök yüzündeki yerini ayırtmak için sisteme ilk yıldızını kaydet." : "Register your first star in the system to claim your place in the cosmos."}</p>
            <button onClick={() => navigate("/stars")} className="btn-gold px-8 py-3 rounded-xl uppercase tracking-widest text-xs font-bold">
              {lang === "TR" ? "Yıldız Kataloğu" : "Star Catalog"}
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="my-stars-grid">
            <AnimatePresence>
              {stars.map((s, idx) => (
                <motion.div 
                  key={s.star_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="terminal-frame p-6 group" 
                  data-testid={`my-star-${s.code}`}
                >
                  <div className="terminal-scanline" />
                  <div className="terminal-header" />
                  
                  <div className="flex items-center justify-between mt-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] tracking-[0.3em] uppercase text-sc-gold font-bold">{t(`tier_${s.tier}`)}</span>
                      <span className="text-[8px] text-sc-text-muted font-mono">CODE: {s.code}</span>
                    </div>
                    <div className="relative">
                      <Star className="w-5 h-5 text-sc-gold fill-sc-gold/20 group-hover:fill-sc-gold transition-all duration-500" />
                      <div className="absolute inset-0 bg-sc-gold blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                    </div>
                  </div>

                  <h3 className="font-display text-2xl mb-2 gold-gradient-text tracking-tight">{s.custom_name || s.name}</h3>
                  <div className="text-[11px] text-sc-text-muted mb-4 font-mono tracking-wider flex items-center gap-2">
                    <Globe size={10} /> {s.name} // {s.constellation.toUpperCase()}
                  </div>

                  {s.personal_message && (
                    <div className="relative mb-5 p-3 bg-white/5 border-l-2 border-sc-gold/30 rounded-r-md">
                      <p className="font-accent italic text-sc-text/70 text-sm leading-relaxed">"{s.personal_message}"</p>
                    </div>
                  )}

                  <div className="telemetry-grid mb-6">
                    <div className="telemetry-item-box">
                      <div className="telemetry-label">Right Ascension</div>
                      <div className="telemetry-value">{s.ra || "00h 00m 00s"}</div>
                    </div>
                    <div className="telemetry-item-box">
                      <div className="telemetry-label">Declination</div>
                      <div className="telemetry-value">{s.dec || "+00° 00' 00\""}</div>
                    </div>
                  </div>

                  <div className="aegis-badge-dashboard mb-6">
                    <ShieldCheck size={14} />
                    <span>AEGIS_RESERVE_ACTIVE // 70.00%</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <button onClick={() => downloadCertificate(s)} className="btn-ghost text-[10px] py-2.5 flex-1 uppercase tracking-widest font-bold" data-testid={`cert-${s.code}`}>
                        <span className="inline-flex items-center gap-2"><Download className="w-3.5 h-3.5" /> CERT_DL</span>
                      </button>
                      <button onClick={() => listForSale(s)} className="btn-gold text-[10px] py-2.5 flex-1 uppercase tracking-widest font-bold" data-testid={`sell-${s.code}`}>
                        <span className="inline-flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> {s.for_sale ? "LISTED" : "MARKET"}</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleInstantExit(s)}
                      className="w-full py-3 rounded-lg bg-sc-red/5 border border-sc-red/20 text-sc-red text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-sc-red/10 transition-all flex items-center justify-center gap-2 group/exit"
                    >
                      <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" /> EVACUATE_PROTOCOL (70% REFUND)
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
