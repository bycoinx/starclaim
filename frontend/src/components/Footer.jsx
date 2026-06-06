import React from "react";
import { Link } from "react-router-dom";
import { Star, Instagram, Twitter, Youtube } from "lucide-react";
import { useT } from "../lib/i18n";

export default function Footer() {
  const { t, lang } = useT();
  return (
    <footer data-testid="footer" className="relative border-t border-white/5 bg-transparent pt-20 pb-10">
      {/* Background stars from the global canvas will flow behind this transparent footer */}
      <div className="absolute inset-0 nebula-bg opacity-40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-sc-gold fill-sc-gold" strokeWidth={1.5} />
              <span className="font-display text-2xl tracking-widest">
                Star<span className="gold-gradient-text">Claim</span>
              </span>
            </div>
            <p className="font-accent italic text-sc-text-muted text-lg max-w-xs leading-snug">
              {lang === "TR" ? "\"Yıldızlar sonsuz, anılar da öyle.\"" : "\"Stars are eternal, so are memories.\""}
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/starclaim" target="_blank" rel="noreferrer" className="text-sc-text-muted hover:text-sc-gold transition-colors" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
              <a href="https://twitter.com/starclaim" target="_blank" rel="noreferrer" className="text-sc-text-muted hover:text-sc-gold transition-colors" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/starclaim" target="_blank" rel="noreferrer" className="text-sc-text-muted hover:text-sc-gold transition-colors" aria-label="YouTube"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-widest text-sc-gold mb-4">StarClaim</h4>
            <ul className="space-y-3 text-sm text-sc-text-muted">
              <li><Link to="/about" className="hover:text-sc-text">{t("nav_about")}</Link></li>
              <li><Link to="/stories" className="hover:text-sc-text">{t("nav_stories")}</Link></li>
              <li><Link to="/stars" className="hover:text-sc-text">{t("nav_pick")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-widest text-sc-gold mb-4">{lang === "TR" ? "Destek" : "Support"}</h4>
            <ul className="space-y-3 text-sm text-sc-text-muted">
              <li><button type="button" className="hover:text-sc-text bg-transparent p-0 m-0 text-left">{lang === "TR" ? "SSS" : "FAQ"}</button></li>
              <li><Link to="/about" className="hover:text-sc-text">{lang === "TR" ? "İletişim" : "Contact"}</Link></li>
              <li><button type="button" className="hover:text-sc-text bg-transparent p-0 m-0 text-left">{lang === "TR" ? "İade" : "Refunds"}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-widest text-sc-gold mb-4">{lang === "TR" ? "Yasal" : "Legal"}</h4>
            <ul className="space-y-3 text-sm text-sc-text-muted">
              <li><button type="button" className="hover:text-sc-text bg-transparent p-0 m-0 text-left">{lang === "TR" ? "Gizlilik" : "Privacy"}</button></li>
              <li><button type="button" className="hover:text-sc-text bg-transparent p-0 m-0 text-left">{lang === "TR" ? "Kullanım" : "Terms"}</button></li>
              <li><button type="button" className="hover:text-sc-text bg-transparent p-0 m-0 text-left">{lang === "TR" ? "Çerezler" : "Cookies"}</button></li>
            </ul>
          </div>
        </div>
        <div className="divider-gold mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-sc-text-muted gap-3">
          <span>{lang === "TR" ? "© 2026 StarClaim. Tüm hakları saklıdır." : "© 2026 StarClaim. All rights reserved."}</span>
          <span className="font-accent italic">{lang === "TR" ? "Sonsuzluk, gökyüzünde başlar. ✦" : "Eternity begins in the sky. ✦"}</span>
        </div>
      </div>
    </footer>
  );
}
