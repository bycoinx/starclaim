import React from "react";
import { ShieldAlert } from "lucide-react";
import VaultStats from "./VaultStats";

export default function VaultHero({ stats = {}, actions = [] }) {
  return (
    <section className="hero-cosmos-shell relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#030812] px-6 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.22)] md:px-10" role="banner" aria-label="StarVault hero">
      <div className="absolute inset-0 nebula-bg opacity-42 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,56,0.8),transparent_48%)] pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_60%_35%,rgba(88,109,181,0.18),transparent_42%)] pointer-events-none" />
      <div className="absolute left-0 bottom-0 h-2/3 w-1/3 bg-[radial-gradient(circle_at_20%_90%,rgba(41,74,143,0.16),transparent_48%)] pointer-events-none" />

      <div className="absolute inset-0 opacity-18 pointer-events-none overflow-hidden">
        <div className="absolute top-16 left-[14%] h-1.5 w-1.5 rounded-full bg-white/80 animate-ping duration-1000" />
        <div className="absolute top-36 right-[18%] h-1.5 w-1.5 rounded-full bg-sc-gold/80 animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col gap-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sc-gold/20 bg-white/5 px-4 py-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-4 font-bold font-mono shadow-[0_0_24px_rgba(212,175,55,0.08)]">
            <ShieldAlert size={12} className="animate-pulse" />
            STARCLAIMX // PRIVATE STARVAULT
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[0.95] text-white uppercase">
            STARVAULT
          </h1>
          <p className="text-base md:text-lg text-slate-300 mt-4 max-w-2xl leading-8">
            Evrenindeki sahip olduğun yıldızları, sertifikaları ve hikayeleri tek bir lüks koleksiyon deneyiminde sakla.
          </p>
          {actions.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === 0 ? "btn-gold px-7 py-3" : "btn-ghost px-7 py-3"}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <VaultStats stats={stats} />
      </div>
    </section>
  );
}
