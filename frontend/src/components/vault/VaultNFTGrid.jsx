import React from 'react'
import VaultNFTCard from './VaultNFTCard'
import VaultEmptyState from './VaultEmptyState'

export default function VaultNFTGrid({ stars = [], selectedStar, onSelectStar = () => {}, onPreview = () => {} }) {
  if (!stars || stars.length === 0) return <VaultEmptyState />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stars.map((s) => (
        <div key={s.starId || s.id}>
          {typeof VaultNFTCard === 'function' ? (
            <VaultNFTCard
              star={s}
              selected={selectedStar?.starId === (s.starId || s.id)}
              onSelect={() => onSelectStar(s)}
              onPreview={() => onPreview(s)}
            />
          ) : (
            <div className="p-4 border rounded">{s.name || 'Star'}</div>
          )}
        </div>
      ))}
    </div>
  )
}
import React from "react";
import VaultNFTCard from "./VaultNFTCard";

export default function VaultNFTGrid({ stars = [], selectedStar, onSelectStar, onPreview }) {
  if (!stars || stars.length === 0) {
    return (
      <div className="rounded-xl border border-white/6 bg-[#061026]/60 p-8 text-center">
        <div className="text-sm text-slate-300">No stars in your Vault yet.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stars.map((s) => (
        <VaultNFTCard
          key={s.starId}
          star={s}
          selected={selectedStar?.starId === s.starId}
          onSelect={(st) => onSelectStar && onSelectStar(st)}
          onPreview={(st) => onPreview && onPreview(st)}
        />
      ))}
    </div>
  );
}
