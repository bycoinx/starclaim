import React, { useEffect, useState } from 'react'

export default function VaultWalletPanel({ wallet: propWallet, onOpenConnect = () => {}, onDisconnect = () => {} }) {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('mockWalletConnected') === 'true'
    const addr = localStorage.getItem('mockWalletAddress')
    setConnected(saved)
    if (addr) setAddress(addr)
  }, [])

  function handleToggle() {
    if (connected) {
      localStorage.removeItem('mockWalletConnected')
      localStorage.removeItem('mockWalletAddress')
      setConnected(false)
      setAddress(null)
      onDisconnect()
    } else {
      const fake = 'FAKE_' + Math.random().toString(36).slice(2, 10).toUpperCase()
      localStorage.setItem('mockWalletConnected', 'true')
      localStorage.setItem('mockWalletAddress', fake)
      setConnected(true)
      setAddress(fake)
      onOpenConnect()
    }
  }

  const displayAddress = propWallet?.address || address

  return (
    <aside className="p-4 bg-white shadow rounded w-64 sm:w-72" role="region" aria-labelledby="vault-wallet-heading">
      <h3 id="vault-wallet-heading" className="font-semibold">Wallet</h3>
      <div className="mt-3 text-sm">
        {displayAddress ? (
          <div>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded" aria-live="polite">{displayAddress}</div>
            <div className="mt-2 text-xs text-gray-600">Connected (mock)</div>
          </div>
        ) : (
          <div className="text-gray-600">Not connected</div>
        )}
      </div>
      <div className="mt-4">
        <button
          onClick={handleToggle}
          className="px-3 py-1 bg-indigo-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          aria-pressed={!!displayAddress}
          aria-label={displayAddress ? 'Disconnect wallet' : 'Connect wallet (mock)'}
        >
          {displayAddress ? 'Disconnect' : 'Connect (mock)'}
        </button>
      </div>
    </aside>
  )
}
