import React from "react";

export default function VaultNFTCard({ star, onSelect, selected }) {
  return (
    <div
      onClick={() => onSelect && onSelect(star)}
      className={`cursor-pointer rounded-xl border border-white/6 bg-gradient-to-b from-[#051026] to-[#061226] p-4 shadow-lg transition-transform hover:scale-[1.01] ${
        selected ? "ring-2 ring-sc-gold/50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-tr from-sc-indigo/20 to-sc-pink/10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.79 8.26L20.5 9.27L15.5 13.14L17.09 19.8L12 16.77L6.91 19.8L8.5 13.14L3.5 9.27L10.21 8.26L12 2Z" fill="#FFD166" />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{star.name}</div>
              <div className="mt-1 text-xs text-slate-400">{star.code} • {star.constellation}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-sc-gold">{star.rarity}</div>
              <div className="mt-1 text-xs text-slate-400">{star.ownedSince}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-300">Owner: {star.owner}</div>
            <div className="text-sm font-semibold text-white">{star.price ? `$${star.price}` : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
