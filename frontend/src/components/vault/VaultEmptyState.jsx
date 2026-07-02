import React from 'react'
import { Link } from 'react-router-dom'

export default function VaultEmptyState({ title = 'No stars yet', body = 'You don\'t have any stars in your Vault.' }) {
  return (
    <div className="p-6 text-center text-gray-600">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2">{body}</p>
      <div className="mt-4">
        <Link to="/" className="text-indigo-600 underline">Explore stars</Link>
      </div>
    </div>
  )
}
import React from "react";

export default function VaultEmptyState({ onExplore }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-8 text-center">
      <h3 className="text-2xl font-semibold text-white mb-2">Vault is Empty</h3>
      <p className="text-sm text-slate-300 mb-4">You don't have any stars in your Vault yet. Explore the Marketplace to claim your first star.</p>
      <div className="flex justify-center">
        <button onClick={onExplore} className="btn-gold">Explore Marketplace</button>
      </div>
    </div>
  );
}
