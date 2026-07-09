import React from "react";
import { motion } from "framer-motion";
import { useT } from "../lib/i18n";

export default function Cosmos() {
  const { t } = useT();
  const observerCoords = { ra: 279.2347, dec: 38.7837 };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_46%,transparent_0%,transparent_42%,rgba(0,0,0,0.42)_76%,rgba(0,0,0,0.88)_100%)]" />

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

      <section className="pointer-events-auto absolute inset-x-6 top-1/2 z-20 mx-auto w-[min(640px,calc(100vw-3rem))] -translate-y-1/2 rounded-3xl border border-white/10 bg-black/70 p-8 shadow-[0_0_55px_rgba(0,0,0,0.35)] backdrop-blur-md md:left-10 md:right-10">
        <div className="mb-4 text-[9px] font-black uppercase tracking-[0.32em] text-sc-blue">
          {t("cosmos_mobile_required")}
        </div>
        <h2 className="mb-4 text-3xl font-display uppercase tracking-[0.08em] text-white sm:text-4xl">
          3D Harita Hazırlanıyor
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-7 text-white/72">
          Bu sayfa için 3D harita altyapısı hazırlandı. Şu anda canlı harita açılmayacak,
          en son aşamada harita bileşeni buradan etkinleştirilecek.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <div className="mb-2 font-semibold text-white">Hazırlık Tamam</div>
          <ul className="list-disc space-y-2 pl-5">
            <li>3D sahne altyapısı `GalaxyScene` içinde hazır.</li>
            <li>Observer koordinatları için temel veri modeli mevcut.</li>
            <li>Live 3D görünüm son adım olarak devreye alınacak.</li>
          </ul>
        </div>
      </section>

        <div className="pointer-events-none absolute bottom-10 right-8 z-20 hidden text-right md:block">
        <div className="mb-1 text-[8px] font-black uppercase tracking-[0.3em] text-white/25">Observer Coordinates</div>
        <div className="font-mono text-[10px] tracking-[0.18em] text-white/42">
          RA {observerCoords.ra.toFixed(4)}° | DEC {observerCoords.dec.toFixed(4)}°
        </div>
      </div>
    </main>
  );
}
