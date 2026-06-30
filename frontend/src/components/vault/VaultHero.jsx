import React from "react";
import { ShieldAlert } from "lucide-react";
import VaultStats from "./VaultStats";

export default function VaultHero({ stats = {} }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#03040a] px-6 py-10 shadow-2xl md:px-10">
      <div className="absolute inset-0 nebula-bg opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_60%_35%,rgba(122,92,255,0.24),transparent_42%)] pointer-events-none" />
      <div className="absolute left-0 bottom-0 h-2/3 w-1/3 bg-[radial-gradient(circle_at_20%_90%,rgba(77,124,255,0.18),transparent_48%)] pointer-events-none" />

      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-12 left-[15%] w-1.5 h-1.5 bg-white rounded-full animate-ping duration-1000" />
        <div className="absolute top-36 right-[20%] w-1 h-1 bg-sc-gold rounded-full animate-pulse" />
        <div className="absolute bottom-12 left-[40%] w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-3 font-bold font-mono">
            <ShieldAlert size={12} className="animate-pulse" />
            STARCLAIMX // VAULT_PROTOCOL_ACTIVE
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight text-white uppercase">
            STAR<span className="gold-gradient-text">VAULT</span>
          </h1>
          <p className="text-sm font-sans text-[#a9b6d6] mt-3 leading-relaxed max-w-xl">
            Evrende sahip olduğun yıldızların özel koleksiyonu. Bu senin evrenin: keşfet, koru, yaşat.
          </p>
        </div>

        <VaultStats stats={stats} />
      </div>
    </section>
  );
}
