import React from "react";
import { motion } from "framer-motion";
import { Cpu, Orbit, Radar, Shield, Smartphone } from "lucide-react";
import GalaxyScene from "../components/GalaxyScene/GalaxyScene";
import { useT } from "../lib/i18n";

export default function Cosmos() {
  const { t } = useT();

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <GalaxyScene />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_46%,transparent_0%,transparent_42%,rgba(0,0,0,0.42)_76%,rgba(0,0,0,0.88)_100%)]" />

      <section className="pointer-events-none absolute left-6 top-24 z-20 max-w-[min(520px,calc(100vw-3rem))] md:left-10 md:top-28">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.38em] text-sc-gold"
        >
          <span className="h-2 w-2 rounded-full bg-sc-gold shadow-[0_0_18px_rgba(214,177,82,0.8)]" />
          Strategic Observer // v2.1
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
          className="font-display text-4xl uppercase leading-none tracking-normal text-white sm:text-5xl md:text-6xl"
        >
          Cosmos <span className="gold-gradient-text">Engine</span>
        </motion.h1>
      </section>

      <section className="pointer-events-auto absolute bottom-24 left-6 z-20 w-[min(440px,calc(100vw-3rem))] border border-white/10 bg-black/42 p-5 shadow-[0_0_55px_rgba(0,0,0,0.35)] backdrop-blur-md md:bottom-10 md:left-10">
        <div className="mb-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.32em] text-sc-blue">
          <Smartphone size={13} />
          {t("cosmos_mobile_required")}
        </div>
        <p className="mb-5 text-sm leading-6 text-white/74">
          {t("cosmos_prompt")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              <Radar size={13} className="text-sc-gold" />
              {t("cosmos_2d_sky")}
            </div>
            <div className="text-[11px] leading-5 text-white/52">{t("cosmos_2d_desc")}</div>
          </div>
          <div className="border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              <Orbit size={13} className="text-sc-blue" />
              {t("cosmos_3d_voyage")}
            </div>
            <div className="text-[11px] leading-5 text-white/52">{t("cosmos_3d_desc")}</div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.18em] text-white/44">
            <span className="flex items-center gap-1 text-sc-green"><Shield size={10} /> Aegis Safe</span>
            <span className="flex items-center gap-1 text-sc-blue"><Cpu size={10} /> Core Stable</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sc-gold/35 bg-sc-gold/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sc-gold">
            <Smartphone size={13} />
            {t("cosmos_btn")}
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-10 right-8 z-20 hidden text-right md:block">
        <div className="mb-1 text-[8px] font-black uppercase tracking-[0.3em] text-white/25">Observer Coordinates</div>
        <div className="font-mono text-[10px] tracking-[0.18em] text-white/42">RA 18h 36m 56s | DEC +38 deg 47' 01"</div>
      </div>
    </main>
  );
}
