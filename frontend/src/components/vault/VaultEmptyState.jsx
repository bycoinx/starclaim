import React from 'react'
import { Link } from 'react-router-dom'

export default function VaultEmptyState({ title = 'No stars yet', body = 'You don\'t have any stars in your Vault.' }) {
  return (
    <div className="p-6 text-center text-gray-600" role="region" aria-labelledby="vault-empty-title">
      <h3 id="vault-empty-title" className="text-lg font-semibold">{title}</h3>
      <p className="mt-2">{body}</p>
      <div className="mt-4">
        <Link to="/" className="text-indigo-600 underline focus:outline-none focus:ring-2 focus:ring-indigo-400" aria-label="Explore stars">
          Explore stars
        </Link>
      </div>
    </div>
  )
}
