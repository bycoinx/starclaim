import React from "react";
import { Shield, Clock, Zap, Users } from "lucide-react";

export default function VaultActions({ selectedStar, wallet }) {
  const disabled = !wallet;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#060a16]/88 p-6" role="region" aria-label="Legacy vault actions">
      <h4 className="text-sm font-semibold text-white mb-3">Legacy Actions</h4>
      <div className="grid gap-3">
        <button disabled={disabled} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <Shield className="w-5 h-5 text-sc-gold" />
          <div className="text-left">
            <div className="font-semibold text-white">Secure Vault</div>
            <div className="text-xs text-slate-400">Archive encrypted snapshot to Arweave (demo)</div>
          </div>
        </button>

        <button disabled={disabled} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <Clock className="w-5 h-5 text-sc-gold" />
          <div className="text-left">
            <div className="font-semibold text-white">Create Time Capsule</div>
            <div className="text-xs text-slate-400">Save a private time-locked message for this star.</div>
          </div>
        </button>

        <button disabled={!selectedStar} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <Zap className="w-5 h-5 text-sc-gold" />
          <div className="text-left">
            <div className="font-semibold text-white">Authorize Transfer</div>
            <div className="text-xs text-slate-400">Create a marketplace listing for this star.</div>
          </div>
        </button>

        <button className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <Users className="w-5 h-5 text-sc-gold" />
          <div className="text-left">
            <div className="font-semibold text-white">Invite Keeper</div>
            <div className="text-xs text-slate-400">Share access or invite a co-keeper to manage this star.</div>
          </div>
        </button>
      </div>
    </div>
  );
}
