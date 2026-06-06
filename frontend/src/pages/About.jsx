import React from "react";
import { useT } from "../lib/i18n";
import { Shield, Sparkles, Compass, Heart, Mail } from "lucide-react";

export default function About() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-transparent pt-28 pb-24 relative overflow-hidden">
      {/* Subtle Overlay */}
      <div className="absolute inset-0 bg-[#050510]/60 pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto px-6 md:px-10 z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sc-gold/20 bg-sc-gold/5 text-[10px] uppercase tracking-[0.3em] text-sc-gold mb-5">
            <Compass className="w-3 h-3" /> ABOUT
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3 gold-gradient-text uppercase">{t("about_title")}</h1>
          <p className="font-accent italic text-sc-text-muted/80 text-lg">
            {t("about_sub")}
          </p>
        </div>

        <div className="glass-dark border border-white/5 rounded-2xl p-10 mb-10 backdrop-blur-md">
          <h2 className="font-display text-2xl mb-4 gold-gradient-text uppercase">{t("vision_mission_title")}</h2>
          <p className="text-sc-text/80 leading-relaxed mb-4 font-light">
            {t("vision_mission_p1")}
          </p>
          <p className="text-sc-text/70 leading-relaxed italic">
            {t("vision_mission_p2")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            { ic: Shield, t: t("vision_pillars_1_t"), d: t("vision_pillars_1_d") },
            { ic: Sparkles, t: t("vision_pillars_2_t"), d: t("vision_pillars_2_d") },
            { ic: Heart, t: t("vision_pillars_3_t"), d: t("vision_pillars_3_d") },
          ].map((c, i) => {
            const Ic = c.ic;
            return (
              <div key={i} className="glass-dark border border-white/5 rounded-2xl p-8 backdrop-blur-sm transition-all hover:border-sc-gold/20 group">
                <Ic className="w-5 h-5 text-sc-gold/60 mb-5 group-hover:text-sc-gold transition-colors" strokeWidth={1.4} />
                <h3 className="font-display text-lg mb-3 gold-gradient-text uppercase tracking-wide">{c.t}</h3>
                <p className="text-sm text-sc-text-muted/80 leading-relaxed font-light">{c.d}</p>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="glass-dark border border-sc-gold/20 rounded-2xl p-10 text-center backdrop-blur-md">
          <Mail className="w-6 h-6 text-sc-gold mx-auto mb-4" strokeWidth={1.4} />
          <h2 className="font-display text-2xl mb-2 gold-gradient-text uppercase">{t("about_contact_title")}</h2>
          <p className="text-sc-text-muted/70 mb-8 max-w-md mx-auto">
            {t("about_contact_sub")}
          </p>
          <a href="mailto:hello@starclaim.net" className="btn-gold px-10 py-3 inline-block">hello@starclaim.net</a>
        </div>
      </div>
    </div>
  );
}
