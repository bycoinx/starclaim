import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { useWallet } from "@solana/wallet-adapter-react";
import { Star, LogIn, Loader2, Download, Tag, ShieldCheck, Zap, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading, login } = useAuth();
  const { t, lang } = useT();
  const { wallet, publicKey, signTransaction } = useWallet();
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
      // Initialize bridge with real wallet from component scope
      const bridge = new EventHorizonBridge(wallet); 
      
      // In a real scenario, the starAccountPubKey would be stored in the star record in DB
      // For this demo, we use a placeholder or derived key if available
      const starAccountPubKey = star.solana_address || star.star_id; 

      const tx = await bridge.instantExit(starAccountPubKey);
      toast.success(lang === "TR" ? "Kuantum Çıkış Başarılı! SOL cüzdanınıza aktarıldı." : "Quantum Exit Successful! SOL returned to wallet.", { id: loadingToast });
      
      // Notify backend to release ownership
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen bg-sc-deep flex items-center justify-center pt-28 px-6">
        <div className="glass rounded-2xl p-10 max-w-md text-center" data-testid="login-required">
          <Star className="w-10 h-10 text-sc-gold fill-sc-gold mx-auto mb-5" strokeWidth={1.2} />
          <h2 className="font-display text-2xl mb-3">{lang === "TR" ? "Yildizlarini Gormek Icin Giris Yap" : "Sign In to See Your Stars"}</h2>
          <p className="text-sc-text-muted mb-7 text-sm">
            {lang === "TR" ? "Google ile tek tikla. Gokyuzundeki yerini guvende tut." : "One click with Google. Keep your place in the sky."}
          </p>
          <button onClick={login} className="btn-gold" data-testid="dashboard-login">
            <span className="inline-flex items-center gap-2"><LogIn className="w-4 h-4" /> {lang === "TR" ? "Google ile Giris" : "Sign in with Google"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sc-deep pt-28 pb-24 relative">
      <div className="absolute inset-0 nebula-bg opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2">My Constellation</div>
            <h1 className="font-display text-4xl">
              {lang === "TR" ? "Hos geldin," : "Welcome,"} <span className="gold-gradient-text">{user.name}</span>
            </h1>
            <p className="text-sc-text-muted mt-2">{user.email}</p>
          </div>
          <div className="glass rounded-xl px-5 py-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">{lang === "TR" ? "Yildizlarin" : "Your stars"}</div>
            <div className="font-display text-3xl text-sc-gold">{stars.length}</div>
          </div>
        </div>

        {fetching ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-sc-gold" /></div>
        ) : stars.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Star className="w-10 h-10 text-sc-gold/60 mx-auto mb-5" strokeWidth={1.3} />
            <p className="text-sc-text-muted mb-6">{lang === "TR" ? "Henuz bir yildizin yok. Ilk yildizini sahiplen." : "You don't own any stars yet."}</p>
            <button onClick={() => navigate("/stars")} className="btn-gold">{lang === "TR" ? "Yildizini Sec" : "Pick a Star"}</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="my-stars-grid">
            {stars.map((s) => (
              <div key={s.star_id} className="glass rounded-2xl p-6 border tier-legendary" data-testid={`my-star-${s.code}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-sc-gold">{t(`tier_${s.tier}`)}</span>
                  <Star className="w-4 h-4 fill-sc-gold text-sc-gold" />
                </div>
                <h3 className="font-display text-xl mb-1 gold-gradient-text">{s.custom_name || s.name}</h3>
                <div className="text-xs text-sc-text-muted mb-3">{s.name} - {s.constellation}</div>
                {s.personal_message && <p className="font-accent italic text-sc-text/80 text-sm mb-3 leading-relaxed">"{s.personal_message}"</p>}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-sc-text-muted mb-4">
                  <div>RA - {s.ra || "N/A"}</div><div>Dec - {s.dec || "N/A"}</div>
                </div>

                {/* Aegis Info */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-sc-green/5 rounded-lg border border-sc-green/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-sc-green" />
                  <div className="text-[10px] text-sc-green font-bold uppercase tracking-wider">
                    Aegis Protected - 70% Reserve
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => downloadCertificate(s)} className="btn-ghost text-xs py-2 flex-1" data-testid={`cert-${s.code}`}>
                      <span className="inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> {lang === "TR" ? "Sertifika" : "Certificate"}</span>
                    </button>
                    <button onClick={() => listForSale(s)} className="btn-gold text-xs py-2 flex-1" data-testid={`sell-${s.code}`}>
                      <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {s.for_sale ? (lang === "TR" ? "Satista" : "Listed") : (lang === "TR" ? "Satis" : "List")}</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleInstantExit(s)}
                    className="w-full py-2 rounded-lg bg-sc-red/10 border border-sc-red/20 text-sc-red text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-sc-red/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3 h-3" /> Instant Exit (70% Refund)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
