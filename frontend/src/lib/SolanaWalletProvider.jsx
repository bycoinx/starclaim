import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

import ErrorBoundary from "../components/ui/ErrorBoundary";

function WalletRuntime({ children }) {
  const endpoint = process.env.REACT_APP_SOLANA_RPC || clusterApiUrl("devnet");
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default function SolanaWalletProvider({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-sc-deep flex items-center justify-center px-6 text-center">
          <div className="glass rounded-2xl p-8 max-w-lg">
            <h2 className="font-display text-2xl text-sc-gold mb-3">Wallet Layer Offline</h2>
            <p className="text-sc-text-muted text-sm">
              The Solana wallet module could not initialize, but the rest of StarClaim is still available.
            </p>
          </div>
        </div>
      }
    >
      <WalletRuntime>{children}</WalletRuntime>
    </ErrorBoundary>
  );
}
