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
    <aside className="p-4 bg-white shadow rounded">
      <h3 className="font-semibold">Wallet</h3>
      <div className="mt-3 text-sm">
        {displayAddress ? (
          <div>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded">{displayAddress}</div>
            <div className="mt-2 text-xs text-gray-600">Connected (mock)</div>
          </div>
        ) : (
          <div className="text-gray-600">Not connected</div>
        )}
      </div>
      <div className="mt-4">
        <button onClick={handleToggle} className="px-3 py-1 bg-indigo-600 text-white rounded">
          {displayAddress ? 'Disconnect' : 'Connect (mock)'}
        </button>
      </div>
    </aside>
  )
}
import React from "react";
import { Wallet, CreditCard, Zap } from "lucide-react";

export default function VaultWalletPanel({ wallet, onConnect, onDisconnect, onOpenConnect }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#050814]/90 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-sc-gold/70">Vault Wallet</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Connections</h3>
        </div>
        <div className="text-sc-gold">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {!wallet ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">No wallet connected. Connect to enable on-chain actions.</p>
          <div className="flex gap-2">
            <button onClick={onOpenConnect} className="btn-ghost w-full">Connect Wallet</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">{wallet.provider?.toUpperCase() || 'WALLET'}</div>
                <div className="font-mono text-sm text-white">{wallet.address?.slice(0,6)}…{wallet.address?.slice(-6)}</div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>{wallet.network || 'Unknown'}</div>
                <div className="font-semibold text-white">{wallet.balances?.sol ?? 0} SOL</div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <button onClick={onDisconnect} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]">Disconnect</button>
            <button className="rounded-full border border-white/10 bg-sc-gold px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-black">Sync Ownership</button>
          </div>
        </div>
      )}
    </div>
  );
}
