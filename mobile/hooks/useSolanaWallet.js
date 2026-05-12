import { useState, useCallback } from 'react';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

const APP_IDENTITY = {
  name: 'StarClaim',
  uri: 'https://starclaim.net',
  icon: 'favicon.png', // Relative to assets
};

export function useSolanaWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const result = await transact(async (wallet) => {
        const authorizeResult = await wallet.authorize({
          cluster: 'mainnet-beta',
          identity: APP_IDENTITY,
        });

        return authorizeResult;
      });

      const publicKey = new PublicKey(result.accounts[0].address);
      setAddress(publicKey.toBase58());
      return publicKey;
    } catch (e) {
      console.error('Wallet connection failed:', e);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return { address, connecting, connect, disconnect };
}
