import React from "react";
import { SurfacePanel, StatusBadge } from "../shell";
import { Globe2, ShieldCheck, BookOpen, Sparkles } from "lucide-react";

export default function VaultStarCard({ star, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group text-left transition-all duration-300 ${
        selected
          ? "shadow-[0_0_80px_rgba(212,175,55,0.2)]"
          : "hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
      }`}
    >
      <SurfacePanel className={`h-full ${selected ? "border-sc-gold/50 bg-[#111625]/95" : "bg-[#050814]/90"}`}>
        <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#061021]/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_70%_20%,rgba(88,189,255,0.12),transparent_32%)]" />
          <div className="relative flex h-48 items-end justify-between p-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-sc-gold/80">{star.rarity}</p>
              <h3 className="mt-2 text-3xl font-semibold text-white">{star.name}</h3>
              <p className="mt-3 text-sm text-slate-400 uppercase tracking-[0.2em]">{star.constellation}</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sc-gold shadow-[0_0_20px_rgba(212,175,55,0.12)]">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <StatusBadge tone={star.certificateStatus === "Verified" ? "blue" : "purple"}>Certificate</StatusBadge>
          <StatusBadge tone={star.storyCount ? "purple" : "red"}>{star.storyCount} Stories</StatusBadge>
          <StatusBadge tone={star.sharedStatus === "Private" ? "emerald" : "amber"}>{star.sharedStatus}</StatusBadge>
        </div>

        <div className="grid gap-3 text-sm text-slate-300">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Owned Since</p>
            <p className="mt-2 text-white">{star.ownedSince}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Ownership</p>
            <p className="mt-2 text-white">{star.ownershipStatus}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Memory Vault</p>
            <p className="mt-2 text-white">{star.memoryCount} entries</p>
          </div>
        </div>
      </SurfacePanel>
    </button>
  );
}
