import React from "react";

export default function WalletConnectModal({ open, onClose, onConnect }) {
  if (!open) return null;

  const providers = [
    { id: 'phantom', label: 'Phantom (Solana)' },
    { id: 'solflare', label: 'Solflare (Solana)' },
    { id: 'metamask', label: 'MetaMask (EVM)' },
  ];

  const handleConnect = (provider) => {
    // Mock connect: generate random address
    const addr = provider === 'metamask' ? `0x${Math.random().toString(16).slice(2, 18)}` : `WALLET${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
    const wallet = {
      provider,
      address: addr,
      network: provider === 'metamask' ? 'EVM' : 'Solana Devnet',
      balances: { sol: (Math.random() * 2).toFixed(3), xcx: (Math.random() * 50).toFixed(2) },
      connectedAt: new Date().toISOString(),
    };
    onConnect(wallet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#061024]/90 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Connect Wallet</h3>
        <p className="text-sm text-slate-300 mb-4">Select a wallet to connect. (MVP mock connection)</p>
        <div className="grid gap-3">
          {providers.map((p) => (
            <button key={p.id} onClick={() => handleConnect(p.id)} className="py-3 rounded-xl bg-white/5 hover:bg-white/8 text-white">{p.label}</button>
          ))}
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-slate-400">Cancel</button>
        </div>
      </div>
    </div>
  );
}
