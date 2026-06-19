import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/Theme';

export default function QRLoginUnavailable() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Ionicons name="shield-outline" size={38} color={THEME.colors.primary} />
        <Text style={styles.title}>QR GİRİŞİ GEÇİCİ OLARAK KAPALI</Text>
        <Text style={styles.description}>
          Bu giriş yöntemi geçici olarak kullanılamıyor. Yıldız haritaları ve çevrimdışı gözlem kullanılabilir.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        >
          <Ionicons name="arrow-back" size={18} color="#000" />
          <Text style={styles.buttonText}>UYGULAMAYA DÖN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
  panel: { width: '100%', maxWidth: 520, alignItems: 'center', padding: 28, borderWidth: 1, borderColor: 'rgba(0,242,254,0.28)', backgroundColor: '#050b16' },
  title: { marginTop: 18, color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  description: { marginTop: 12, color: 'rgba(255,255,255,0.58)', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  button: { minHeight: 46, marginTop: 24, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: THEME.colors.primary },
  buttonText: { color: '#000', fontSize: 10, fontWeight: '900' },
});
