import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { SecurityService } from '../lib/security';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';
import { CONFIG } from '../constants/Config';

export default function Home() {
  const { address, connect, disconnect, setAddress } = useSolanaWallet();
  const [metrics, setMetrics] = useState({ sol: 182.40, star: 0.12 });
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      // Restore session
      try {
        const session = await SecurityService.getSession();
        if (session && session.user && session.user.wallet_address) {
          setAddress(session.user.wallet_address);
        }
      } catch (e) {
        console.error('Session restoration failed', e);
      }

      // Fetch metrics
      const apiUrls = [CONFIG.PRODUCTION_URL, CONFIG.API_URL];
      for (const url of apiUrls) {
        try {
          const response = await fetch(`${url}/api/marketplace/metrics`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (data?.sol_price && data?.star_price) {
            setMetrics({ sol: data.sol_price, star: data.star_price });
          }
          break;
        } catch (err) {
          console.warn(`API ${url} failed`);
        }
      }
    };
    initializeApp();
  }, []);

  const handleConnect = async () => {
    try {
      const pubKey = await connect();
      if (pubKey) {
        const walletAddress = pubKey.toBase58();
        await SecurityService.saveSession('mobile_token', { wallet_address: walletAddress });
      }
    } catch (err) {
      Alert.alert('HATA', 'Cüzdan bağlantısı başarısız.');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    await SecurityService.clearSession();
  };

  return (
    <CockpitLayout showHUD={false}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>★ STARCLAIM</Text>
          <Text style={styles.subtitle}>AEGIS MOBILE COMMAND</Text>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabs}>
          <TouchableOpacity style={styles.navTabActive}>
            <Text style={styles.navTabTextActive}>Ana Sayfa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/stars')}>
            <Text style={styles.navTabText}>Yıldız Al</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/(tabs)/vault/home')}>
            <Text style={styles.navTabText}>Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/(tabs)/explore/starvoyage')}>
            <Text style={styles.navTabText}>Cosmos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/marketplace')}>
            <Text style={styles.navTabText}>Market</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics & Marketcap */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>SOLANA</Text>
              <Text style={styles.metricValue}>${metrics.sol.toFixed(2)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>STAR_PRICE</Text>
              <Text style={styles.metricValue}>${metrics.star.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.marketcapCard}>
             <View style={styles.marketcapInfo}>
                <Text style={styles.marketcapLabel}>ESTIMATED_MARKET_CAP</Text>
                <Text style={styles.marketcapValue}>$4,208,150.00</Text>
             </View>
             <View style={styles.marketcapGraph}>
                <View style={[styles.graphBar, { height: '30%' }]} />
                <View style={[styles.graphBar, { height: '50%' }]} />
                <View style={[styles.graphBar, { height: '80%' }]} />
                <View style={[styles.graphBar, { height: '65%', backgroundColor: THEME.colors.primary }]} />
                <View style={[styles.graphBar, { height: '90%', backgroundColor: THEME.colors.primary }]} />
             </View>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>GÖKYÜZÜNDE</Text>
          <Text style={styles.heroTitle}>BİR İZ BIRAK</Text>
          <Text style={styles.heroDescription}>
            Kendi yıldızını sahiplen. Hikayeni ebediyete yaz. Sevdiklerine miras bırak.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/stars')}>
              <Text style={styles.primaryBtnText}>ŞİMDİ KEŞFET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/explore/starmap')}>
              <Text style={styles.secondaryBtnText}>HARİTAYI AÇ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>SİSTEM_MODÜLLERİ</Text>
        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/(tabs)/explore/home')}>
            <Text style={styles.featureEmoji}>🔍</Text>
            <Text style={styles.featureCardTitle}>Gözlem</Text>
            <Text style={styles.featureCardDesc}>Yıldız kataloğu ve AR modülü.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/(tabs)/mystars/collection')}>
            <Text style={styles.featureEmoji}>⭐</Text>
            <Text style={styles.featureCardTitle}>Varlıklarım</Text>
            <Text style={styles.featureCardDesc}>Sahip olduğun yıldızlar.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/(tabs)/vault/home')}>
            <Text style={styles.featureEmoji}>🔐</Text>
            <Text style={styles.featureCardTitle}>StarVault</Text>
            <Text style={styles.featureCardDesc}>Zaman kapsülü ve mesajlar.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/about')}>
            <Text style={styles.featureEmoji}>ℹ️</Text>
            <Text style={styles.featureCardTitle}>Aegis OS</Text>
            <Text style={styles.featureCardDesc}>Sistem bilgileri ve vizyon.</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Section */}
        <View style={styles.walletSection}>
          <Text style={styles.walletLabel}>NODE_CONNECTION</Text>
          <Text style={styles.walletAddress}>
            {address ? `${address.slice(0, 12)}...${address.slice(-12)}` : 'DISCONNECTED'}
          </Text>
          <TouchableOpacity
            style={[styles.walletButton, address && styles.walletButtonDisconnect]}
            onPress={address ? handleDisconnect : handleConnect}
          >
            <Text style={styles.walletButtonText}>
              {address ? 'TERMINATE_SESSION' : 'ESTABLISH_CONNECTION'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60 },
  header: { marginBottom: 24, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  subtitle: { fontSize: 10, color: THEME.colors.primary, fontWeight: '700', letterSpacing: 2 },
  navTabs: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  navTab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  navTabActive: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: THEME.colors.primary + '20', alignItems: 'center', borderWidth: 1, borderColor: THEME.colors.primary },
  navTabText: { fontSize: 10, fontWeight: '700', color: THEME.colors.textMuted, textTransform: 'uppercase' },
  navTabTextActive: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  metricsContainer: { marginBottom: 24, gap: 12 },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  metricLabel: { fontSize: 8, color: THEME.colors.textMuted, fontWeight: '700', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: '900', color: THEME.colors.primary },
  marketcapCard: { backgroundColor: 'rgba(0, 204, 255, 0.05)', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: THEME.colors.primary + '40' },
  marketcapLabel: { fontSize: 8, color: THEME.colors.primary, fontWeight: '900', marginBottom: 4 },
  marketcapValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
  marketcapGraph: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  graphBar: { width: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  heroSection: { marginBottom: 32 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40 },
  heroDescription: { fontSize: 14, color: THEME.colors.textMuted, marginTop: 12, lineHeight: 22, marginBottom: 20 },
  heroButtons: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: THEME.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontSize: 12, fontWeight: '900' },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: THEME.colors.secondary, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  featureCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  featureEmoji: { fontSize: 24, marginBottom: 8 },
  featureCardTitle: { fontSize: 14, fontWeight: '900', color: '#fff', marginBottom: 4 },
  featureCardDesc: { fontSize: 10, color: THEME.colors.textMuted, lineHeight: 14 },
  walletSection: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  walletLabel: { fontSize: 8, color: THEME.colors.textMuted, fontWeight: '900', marginBottom: 8 },
  walletAddress: { fontSize: 11, color: '#fff', fontWeight: '700', marginBottom: 16, fontFamily: 'monospace' },
  walletButton: { backgroundColor: THEME.colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  walletButtonDisconnect: { backgroundColor: THEME.colors.danger },
  walletButtonText: { color: '#fff', fontSize: 10, fontWeight: '900' },
});
