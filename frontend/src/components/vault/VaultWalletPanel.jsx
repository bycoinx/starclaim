import React from 'react'

export default function VaultWalletPanel({ wallet, onOpenConnect = () => {}, onDisconnect = () => {} }) {
  const displayAddress = wallet?.address || null
  const providerLabel = wallet?.provider ? wallet.provider.charAt(0).toUpperCase() + wallet.provider.slice(1) : 'Wallet'
  const networkLabel = wallet?.network || 'Not connected'
  const balances = wallet?.balances || { sol: '0.000', xcx: '0.00' }

  return (
    <aside className="p-4 bg-white shadow rounded w-64 sm:w-72" role="region" aria-labelledby="vault-wallet-heading">
      <h3 id="vault-wallet-heading" className="font-semibold">Vault Wallet</h3>
      <div className="mt-3 text-sm">
        {displayAddress ? (
          <div className="space-y-3">
            <div className="font-mono text-xs bg-slate-100 p-2 rounded break-all" aria-live="polite">{displayAddress}</div>
            <div className="grid gap-2 text-xs text-slate-600">
              <div>Provider: <span className="font-medium text-slate-800">{providerLabel}</span></div>
              <div>Network: <span className="font-medium text-slate-800">{networkLabel}</span></div>
              <div>Balances: <span className="font-medium text-slate-800">{balances.sol} SOL · {balances.xcx} XCX</span></div>
            </div>
          </div>
        ) : (
          <div className="text-slate-600">No wallet connected. Connect to enable Vault actions.</div>
        )}
      </div>
      <div className="mt-4">
        <button
          onClick={displayAddress ? onDisconnect : onOpenConnect}
          className="w-full rounded-xl px-3 py-2 bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          aria-label={displayAddress ? 'Disconnect wallet' : 'Connect wallet'}
        >
          {displayAddress ? 'Disconnect' : 'Connect Wallet'}
        </button>
      </div>
    </aside>
  )
}
