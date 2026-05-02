import React from "react";
import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";
import { XCircle } from "lucide-react";
import StarCanvas from "../components/StarCanvas";

export default function PaymentCancel() {
  const { lang } = useT();
  return (
    <div className="min-h-screen bg-sc-deep relative flex items-center justify-center overflow-hidden pt-24 pb-16">
      <StarCanvas density={150} />
      <div className="absolute inset-0 nebula-bg pointer-events-none" />
      <div className="relative max-w-md mx-6 glass rounded-2xl p-10 text-center" data-testid="payment-cancel">
        <XCircle className="w-10 h-10 text-sc-text-muted mx-auto mb-5" strokeWidth={1.3} />
        <div className="font-display text-2xl mb-3">
          {lang === "TR" ? "Ödeme iptal edildi" : "Payment cancelled"}
        </div>
        <p className="text-sc-text-muted text-sm mb-6 font-accent italic">
          {lang === "TR"
            ? "Yıldızın seni bekliyor. İstediğin zaman geri dönebilirsin."
            : "Your star is still waiting. Come back anytime."}
        </p>
        <Link to="/stars" className="btn-gold inline-block">
          {lang === "TR" ? "Yıldızını Seç" : "Pick a Star"}
        </Link>
      </div>
    </div>
  );
}
