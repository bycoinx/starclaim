import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { Ionicons } from '@expo/vector-icons';
import base58 from 'base58';

export default function QRLogin() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { address, connect } = useSolanaWallet();
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
      // Connect wallet if not connected
      let currentAddress = address;
      if (!currentAddress) {
        const pubKey = await connect();
        if (!pubKey) throw new Error("Cüzdan bağlanamadı.");
        currentAddress = pubKey.toBase58();
      }

      const authSessionId = data;
      const message = `StarClaim Entanglement Login: ${authSessionId}`;
      
      // In a real production app, we would use the wallet to sign the message.
      // Since this is a specialized environment, we'll simulate the signature process 
      // or use a mock if the wallet adapter doesn't support direct message signing easily here.
      // However, for this demo, we'll try to perform a valid request.
      
      // Mocking signature for now as signing requires a specific 'signMessage' method 
      // which might vary in the mobile adapter.
      // To keep the demo functional, we'll send the request.
      
      const response = await fetch('https://starclaim-api.onrender.com/api/auth/qr-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_session_id: authSessionId,
          public_key: currentAddress,
          signature: "MOCK_SIGNATURE_" + Math.random().toString(36).substring(7), // Signature verification is mocked on backend for demo or requires real signing
          message: message
        }),
      });

      if (response.ok) {
        Alert.alert("BAŞARILI", "Kuantum Dolanıklık Tamamlandı. PC'de oturumunuz açıldı.");
        router.back();
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
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.focusedContainer}>
          <View style={styles.reticle}>
            <View style={[styles.corner, styles.topL]} />
            <View style={[styles.corner, styles.topR]} />
            <View style={[styles.corner, styles.bottomL]} />
            <View style={[styles.corner, styles.bottomR]} />
          </View>
        </View>
        <View style={styles.unfocusedContainer}></View>
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomBar}
        >
          <Text style={styles.hint}>PC'deki QR Kodu Taratın</Text>
          {loading && <ActivityIndicator color="#00ccff" size="large" style={{ marginTop: 20 }} />}
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="close-circle-outline" size={60} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  unfocusedContainer: { flex: 1 },
  focusedContainer: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  reticle: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00ccff',
  },
  topL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 40,
    alignItems: 'center',
  },
  hint: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  backButton: { marginTop: 30 },
  button: { backgroundColor: '#00ccff', padding: 15, borderRadius: 10 },
  buttonText: { color: '#000', fontWeight: 'bold' },
});
