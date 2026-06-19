import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

// Compatibility shell for older routes. No wallet package or network is loaded.
export function useSolanaWallet() {
  const [connecting] = useState(false);
  const connect = useCallback(async () => {
    Alert.alert('GEÇİCİ OLARAK KAPALI', 'Cüzdan bağlantısı bu sürümde devre dışı.');
    return null;
  }, []);
  const signMessage = useCallback(async () => null, []);
  const disconnect = useCallback(() => {}, []);
  return { address: null, connecting, connect, signMessage, disconnect };
}
