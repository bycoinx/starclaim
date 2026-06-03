import { useState, useCallback, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Alert } from 'react-native';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Dynamic import for native module to avoid crash in Expo Go
let transact;
if (!IS_EXPO_GO) {
  try {
    const adapter = require('@solana-mobile/mobile-wallet-adapter-protocol');
    transact = adapter.transact;
  } catch (e) {
    console.warn("Solana Wallet Adapter Protocol not available");
  }
}

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
    if (IS_EXPO_GO) {
      setConnecting(true);
      // Mock connection for Expo Go
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockAddress = "ExPoGoMockWaLLetAddress1111111111111111111";
      const publicKey = new PublicKey("G6tt9E7uTzZ1D3D3D3D3D3D3D3D3D3D3D3D3D3D3D3D3");
      addressBase64Ref.current = mockAddress;
      setAddress(publicKey.toBase58());
      setConnecting(false);
      Alert.alert("EXPO_GO_SIMULATION", "Native Wallet Adapter is disabled in Expo Go. Using a mock identity for development.");
      return publicKey;
    }

    if (!transact) {
      Alert.alert("HATA", "Solana Wallet Adapter yüklenemedi.");
      return null;
    }

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
      if (IS_EXPO_GO) {
        // Mock signing for Expo Go
        Alert.alert("EXPO_GO_SIMULATION", "Signing simulated in Expo Go.");
        return Buffer.from("MOCK_SIGNATURE_" + Date.now()).toString('base64');
      }

      if (!addressBase64Ref.current) {
        const connected = await connect();
        if (!connected) return null;
      }

      if (!transact) return null;

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
