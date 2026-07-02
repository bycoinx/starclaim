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
