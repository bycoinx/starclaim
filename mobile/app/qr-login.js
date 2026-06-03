import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { SecurityService } from '../lib/security';
import { Ionicons } from '@expo/vector-icons';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import { CONFIG } from '../constants/Config';

import { THEME } from '../constants/Theme';

export default function QRLogin() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { address, connect, signMessage } = useSolanaWallet();
  const router = useRouter();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kamera iznine ihtiyacımız var.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const biometricsOk = await SecurityService.checkBiometrics();
      if (biometricsOk) {
        const authenticated = await SecurityService.authenticate('Giriş işlemini onaylamak için biyometrik doğrulama gerekli');
        if (!authenticated) {
          throw new Error('Biyometrik doğrulama başarısız.');
        }
      }

      let currentAddress = address;
      if (!currentAddress) {
        const pubKey = await connect();
        if (!pubKey) throw new Error("Cüzdan bağlanamadı.");
        currentAddress = pubKey.toBase58();
      }

      const authSessionId = data;
      const message = `StarClaim Entanglement Login: ${authSessionId}`;
      const signedPayload = await signMessage(message);
      if (!signedPayload) {
        throw new Error('Mesaj imzalanamadı. Lütfen cüzdanı tekrar bağlayın.');
      }

      const payloadBytes = Buffer.from(signedPayload, 'base64');
      const signatureBytes = payloadBytes.slice(payloadBytes.length - 64);
      const signature = bs58.encode(signatureBytes);

      const response = await fetch(`${CONFIG.API_URL}/api/auth/qr-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_session_id: authSessionId,
          public_key: currentAddress,
          signature,
          message: message,
        }),
      });

      if (response.ok) {
        Alert.alert("BAŞARILI", "Kuantum Dolanıklık Tamamlandı. PC'de oturumunuz açıldı.");
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      } else {
        throw new Error("Doğrulama başarısız.");
      }
    } catch (err) {
      Alert.alert("HATA", err.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      <View style={styles.overlay}>
        {/* HUD Frame */}
        <View style={styles.hudOverlay}>
           <View style={[styles.hudCorner, styles.hudTopL]} />
           <View style={[styles.hudCorner, styles.hudTopR]} />
           <View style={[styles.hudCorner, styles.hudBottomL]} />
           <View style={[styles.hudCorner, styles.hudBottomR]} />
        </View>

        <View style={styles.topBar}>
           <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
              <Ionicons name="close" size={24} color="#fff" />
           </TouchableOpacity>
           <Text style={styles.statusText}>AEGIS_SCANNER_v3</Text>
           <View style={styles.statusDot} />
        </View>

        <View style={styles.focusedContainer}>
          <View style={styles.reticle}>
            <View style={[styles.corner, styles.topL]} />
            <View style={[styles.corner, styles.topR]} />
            <View style={[styles.corner, styles.bottomL]} />
            <View style={[styles.corner, styles.bottomR]} />
          </View>
        </View>
        
        <View style={styles.bottomArea}>
          <Text style={styles.hint}>ALIGN_QR_CODE_WITHIN_RETICLE</Text>
          {loading && <ActivityIndicator color={THEME.colors.primary} size="large" style={{ marginTop: 20 }} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  
  hudOverlay: { ...StyleSheet.absoluteFillObject },
  hudCorner: { position: 'absolute', width: 40, height: 40, borderColor: 'rgba(0, 204, 255, 0.4)', borderWidth: 1 },
  hudTopL: { top: 40, left: 40, borderBottomWidth: 0, borderRightWidth: 0 },
  hudTopR: { top: 40, right: 40, borderBottomWidth: 0, borderLeftWidth: 0 },
  hudBottomL: { bottom: 40, left: 40, borderTopWidth: 0, borderRightWidth: 0 },
  hudBottomR: { bottom: 40, right: 40, borderTopWidth: 0, borderLeftWidth: 0 },

  topBar: { position: 'absolute', top: 30, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { color: THEME.colors.primary, fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.accent },

  focusedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reticle: { width: 200, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: THEME.colors.primary },
  topL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  
  bottomArea: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  hint: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 4, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 2 },
  button: { backgroundColor: THEME.colors.primary, padding: 15, borderRadius: 10 },
  buttonText: { color: '#000', fontWeight: 'bold' },
});
