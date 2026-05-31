import { useState, useCallback, useRef } from 'react';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

const APP_IDENTITY = {
  name: 'StarClaim',
  uri: 'https://starclaim.net',
  icon: 'favicon.png', // Relative to assets
};

export function useSolanaWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const addressBase64Ref = useRef(null);

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
      addressBase64Ref.current = result.accounts[0].address;
      setAddress(publicKey.toBase58());
      return publicKey;
    } catch (e) {
      console.error('Wallet connection failed:', e);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const signMessage = useCallback(
    async (message) => {
      if (!addressBase64Ref.current) {
        const connected = await connect();
        if (!connected) return null;
      }

      try {
        const signedPayloads = await transact(async (wallet) => {
          const payload = Buffer.from(message, 'utf8').toString('base64');
          const result = await wallet.signMessages({
            addresses: [addressBase64Ref.current],
            payloads: [payload],
          });
          return result.signed_payloads;
        });

        return signedPayloads?.[0] ?? null;
      } catch (e) {
        console.error('Message signing failed:', e);
        return null;
      }
    },
    [connect]
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    addressBase64Ref.current = null;
  }, []);

  return { address, connecting, connect, signMessage, disconnect };
}
