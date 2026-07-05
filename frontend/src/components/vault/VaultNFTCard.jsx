import React, { useState } from "react";
import VaultListModal from "./VaultListModal";
import { toast } from "sonner";

export default function VaultNFTCard({ star, wallet, onSelect, onPreview, onList, onRequireWallet, selected }) {
  const [openList, setOpenList] = useState(false);
  const canList = !!wallet;

  const handlePreview = () => {
    if (onPreview) return onPreview(star);
    if (onSelect) return onSelect(star);
  };

  const handleListClick = () => {
    if (!canList) {
      if (onRequireWallet) return onRequireWallet();
      return;
    }
    setOpenList(true);
  };

  const handleConfirmList = (price) => {
    if (onList) {
      onList(star, price);
    } else {
      // mock listing: mutate local object for UI demo
      try {
        star.price = price;
      } catch (e) {
        // ignore
      }
      toast.success(`${star.name} listed for $${price}`);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePreview();
        }
      }}
      role="article"
      aria-label={`${star.name} card`}
      className={`cursor-pointer rounded-xl border border-white/6 bg-gradient-to-b from-[#051026] to-[#061226] p-4 shadow-lg transition-transform hover:scale-[1.01] ${
        selected ? "ring-2 ring-sc-gold/50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-tr from-sc-indigo/20 to-sc-pink/10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>Owner: {star.owner}</span>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">{star.ownershipStatus}</span>
              <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${star.certificateStatus === 'Verified' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
                {star.certificateStatus}
              </span>
            </div>
            <div className="text-sm font-semibold text-white">{star.price ? `$${star.price}` : "—"}</div>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={handlePreview}
              className="rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label={`Preview ${star.name}`}
            >
              Preview
            </button>

            <button
              onClick={handleListClick}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${canList ? 'bg-sc-gold text-black hover:brightness-95' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}
              aria-label={canList ? `List ${star.name} for sale` : 'Connect wallet to list this star'}
              aria-disabled={!canList}
            >
              {canList ? 'List for sale' : 'Connect wallet'}
            </button>
          </div>
        </div>
      </div>

      <VaultListModal open={openList} onClose={() => setOpenList(false)} star={star} onConfirm={handleConfirmList} />
    </div>
  );
}
