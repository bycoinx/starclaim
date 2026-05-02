import React from "react";
import { Link } from "react-router-dom";
import { Star, Instagram, Twitter, Youtube } from "lucide-react";
import { useT } from "../lib/i18n";

export default function Footer() {
  const { t } = useT();
  return (
    <footer data-testid="footer" className="relative border-t border-white/5 bg-[#050A1A] pt-20 pb-10">
      <div className="absolute inset-0 nebula-bg opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-sc-gold fill-sc-gold" strokeWidth={1.5} />
              <span className="font-display text-2xl tracking-widest">
                Star<span className="gold-gradient-text">Claim</span>
              </span>
            </div>
            <p className="font-accent italic text-sc-text-muted text-lg max-w-xs leading-snug">
              "Yıldızlar sonsuz, anılar da öyle."
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-sc-text-muted hover:text-sc-gold transition-colors" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-sc-text-muted hover:text-sc-gold transition-colors" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-sc-text-muted hover:text-sc-gold transition-colors" aria-label="YouTube"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-widest text-sc-gold mb-4">StarClaim</h4>
            <ul className="space-y-3 text-sm text-sc-text-muted">
              <li><Link to="/about" className="hover:text-sc-text">{t("nav_about")}</Link></li>
              <li><Link to="/stories" className="hover:text-sc-text">Blog</Link></li>
              <li><Link to="/stars" className="hover:text-sc-text">{t("nav_pick")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-widest text-sc-gold mb-4">Destek</h4>
            <ul className="space-y-3 text-sm text-sc-text-muted">
              <li><a href="#faq" className="hover:text-sc-text">SSS</a></li>
              <li><Link to="/about" className="hover:text-sc-text">İletişim</Link></li>
              <li><a href="#" className="hover:text-sc-text">İade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-widest text-sc-gold mb-4">Yasal</h4>
            <ul className="space-y-3 text-sm text-sc-text-muted">
              <li><a href="#" className="hover:text-sc-text">Gizlilik</a></li>
              <li><a href="#" className="hover:text-sc-text">Kullanım</a></li>
              <li><a href="#" className="hover:text-sc-text">Çerezler</a></li>
            </ul>
          </div>
        </div>
        <div className="divider-gold mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-sc-text-muted gap-3">
          <span>© 2026 StarClaim. Tüm hakları saklıdır.</span>
          <span className="font-accent italic">Sonsuzluk, gökyüzünde başlar. ✦</span>
        </div>
      </div>
    </footer>
  );
}
