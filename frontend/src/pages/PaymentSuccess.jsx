import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";
import { Loader2, Star, Mail, ArrowRight, Download } from "lucide-react";
import StarCanvas from "../components/StarCanvas";

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 8;

export default function PaymentSuccess() {
  const { lang } = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | paid | failed | timeout
  const [info, setInfo] = useState(null);
  const attemptsRef = useRef(0);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;
      try {
        const { data } = await api.get(`/checkout/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setInfo(data);
          setStatus("paid");
          return;
        }
        if (data.status === "expired") {
          setStatus("failed");
          return;
        }
      } catch (e) {
        // continue polling
      }
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
    return () => { cancelled = true; };
  }, [location.search]);

  return (
    <div className="min-h-screen bg-sc-deep relative flex items-center justify-center overflow-hidden pt-24 pb-16">
      <StarCanvas density={200} />
      <div className="absolute inset-0 nebula-bg pointer-events-none" />
      <div className="relative max-w-xl w-full mx-6">
        {status === "checking" && (
          <div className="glass rounded-2xl p-12 text-center" data-testid="payment-checking">
            <Loader2 className="w-8 h-8 text-sc-gold animate-spin mx-auto mb-5" />
            <div className="font-display text-2xl mb-2">
              {lang === "TR" ? "Yıldızın hazırlanıyor..." : "Preparing your star..."}
            </div>
            <p className="text-sc-text-muted text-sm font-accent italic">
              {lang === "TR" ? "Ödemen onaylanıyor — birkaç saniye." : "Confirming your payment — just a moment."}
            </p>
          </div>
        )}

        {status === "paid" && (
          <div className="glass-gold rounded-2xl p-12 text-center animate-fade-up" data-testid="payment-success">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 blur-3xl bg-sc-gold/40 rounded-full" />
              <div className="relative w-20 h-20 rounded-full border border-sc-gold/40 flex items-center justify-center bg-sc-deep">
                <Star className="w-10 h-10 fill-sc-gold text-sc-gold" strokeWidth={1.2} />
              </div>
            </div>
            <div className="font-display text-3xl gold-gradient-text mb-3">
              {lang === "TR" ? "Yıldız Senin!" : "The Star is Yours!"}
            </div>
            <div className="font-accent italic text-lg text-sc-text mb-2">{info?.custom_name}</div>
            <p className="text-sc-text-muted text-sm leading-relaxed mb-8">
              <Mail className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {lang === "TR"
                ? "Sertifikan PDF olarak email adresine gönderildi. Birkaç dakika içinde gelinceye kadar bekleyebilirsin."
                : "Your certificate PDF has been emailed to you. It should arrive in a few minutes."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate("/dashboard")} className="btn-gold" data-testid="success-dashboard">
                <span className="inline-flex items-center gap-2">
                  {lang === "TR" ? "Yıldızlarım" : "My Stars"} <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <Link to="/stars" className="btn-ghost" data-testid="success-more">
                {lang === "TR" ? "Bir tane daha al" : "Get another"}
              </Link>
            </div>
          </div>
        )}

        {status === "timeout" && (
          <div className="glass rounded-2xl p-10 text-center" data-testid="payment-timeout">
            <div className="font-display text-xl mb-3">
              {lang === "TR" ? "İşlem onayı uzun sürdü" : "Confirmation took too long"}
            </div>
            <p className="text-sc-text-muted text-sm mb-6">
              {lang === "TR"
                ? "Ödemen muhtemelen başarılı. Sertifikan email'ine düşecek. Yıldızlarım bölümünden kontrol edebilirsin."
                : "Your payment likely went through. Your certificate will arrive via email. Check My Stars."}
            </p>
            <button onClick={() => navigate("/dashboard")} className="btn-gold">
              {lang === "TR" ? "Yıldızlarım" : "My Stars"}
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="glass rounded-2xl p-10 text-center" data-testid="payment-failed">
            <div className="font-display text-xl mb-3">
              {lang === "TR" ? "Ödeme tamamlanamadı" : "Payment didn't complete"}
            </div>
            <p className="text-sc-text-muted text-sm mb-6">
              {lang === "TR" ? "Tekrar denemek ister misin?" : "Would you like to try again?"}
            </p>
            <Link to="/stars" className="btn-gold inline-block">
              {lang === "TR" ? "Yıldızını Seç" : "Pick a Star"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
