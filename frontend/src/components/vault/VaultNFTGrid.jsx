import React from 'react'
import VaultNFTCard from './VaultNFTCard'
import VaultEmptyState from './VaultEmptyState'

export default function VaultNFTGrid({ stars = [], selectedStar, onSelectStar = () => {}, onPreview = () => {} }) {
  if (!stars || stars.length === 0) return <VaultEmptyState />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Vault star list">
      {stars.map((s) => (
        <div key={s.starId || s.id} role="listitem">
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
