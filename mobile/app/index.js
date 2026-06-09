import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
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

      // Fetch metrics - try production API
      const apiUrls = [
        CONFIG.PRODUCTION_URL,
        CONFIG.API_URL, // fallback to local
      ];

      for (const url of apiUrls) {
        try {
          const response = await Promise.race([
            fetch(`${url}/api/marketplace/metrics`),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            ),
          ]);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (data?.sol_price && data?.star_price) {
            setMetrics({ sol: data.sol_price, star: data.star_price });
            console.log('Metrics fetched from:', url);
          } else if (data?.market_cap && data?.total_stars) {
            const avgPrice = Number((data.market_cap / Math.max(data.total_stars, 1)).toFixed(2));
            setMetrics({ sol: Number((avgPrice * 0.12).toFixed(2)), star: avgPrice });
            console.log('Metrics fetched with fallback from:', url);
          }
          break;
        } catch (err) {
          console.warn(`API ${url} failed:`, err.message);
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>★ STARCLAIM</Text>
          <Text style={styles.subtitle}>AEGIS MOBILE</Text>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabs}>
          <TouchableOpacity style={styles.navTabActive}>
            <Text style={styles.navTabTextActive}>Ana Sayfa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/stars')}>
            <Text style={styles.navTabText}>Yıldızını Seç</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/(tabs)/vault/home')}>
            <Text style={styles.navTabText}>StarVault</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => router.push('/marketplace')}>
            <Text style={styles.navTabText}>Marketplace</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>GÖKYÜZÜNDE</Text>
          <Text style={styles.heroTitle}>SONSUZ BİR ÖZ BIRAK</Text>
          <Text style={styles.heroDescription}>
            Kendi yıldızını sahiplen. İşim ver. Hikayeni yaz. Sevdiklerinle konuş.
          </Text>

          {/* Action Buttons */}
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/stars')}>
              <Text style={styles.primaryBtnText}>YILDIZ AL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/explore/starmap')}>
              <Text style={styles.secondaryBtnText}>GÖKYÜZÜNE BAK</Text>
            </TouchableOpacity>
          </View>

          {/* Price Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>SOL</Text>
              <Text style={styles.metricValue}>${metrics.sol.toFixed(2)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>STAR</Text>
              <Text style={styles.metricValue}>${metrics.star.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <Text style={styles.sectionTitle}>BAŞLAYALIM</Text>
        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/(tabs)/explore/home')}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🔍</Text>
            </View>
            <Text style={styles.featureCardTitle}>Keşfet</Text>
            <Text style={styles.featureCardSub}>Katalog / AR</Text>
            <Text style={styles.featureCardDesc}>Yıldız kataloğu, AR düğmesi, arama + filtre.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/(tabs)/mystars/collection')}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>⭐</Text>
            </View>
            <Text style={styles.featureCardTitle}>Yıldızlarım</Text>
            <Text style={styles.featureCardSub}>Sahip olduğun yıldızlar</Text>
            <Text style={styles.featureCardDesc}>Mesaj bırak, satışa çıkar veya miras planla.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/(tabs)/vault/home')}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🔐</Text>
            </View>
            <Text style={styles.featureCardTitle}>Vault</Text>
            <Text style={styles.featureCardSub}>Zaman kapsülü</Text>
            <Text style={styles.featureCardDesc}>Mesajları kilitle, vasiyet oluştur ve sakla.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/about')}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>ℹ️</Text>
            </View>
            <Text style={styles.featureCardTitle}>Hakkımızda</Text>
            <Text style={styles.featureCardSub}>Misyon & Vizyon</Text>
            <Text style={styles.featureCardDesc}>StarClaim dünyasını ve geleceğimizi tanı.</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Mobil Deneyim</Text>
          <Text style={styles.infoText}>
            StarClaim mobil uygulaması sana özel tasarlandı. Yıldız al, sakla, paylaş ve yönet.
          </Text>
          <Text style={styles.infoText}>
            Her yıldız bir hikaye. Her hikaye bir miras.
          </Text>
        </View>

        {/* Wallet Section */}
        <View style={styles.walletSection}>
          <Text style={styles.walletLabel}>CÜZDAN BAĞLAN</Text>
          <Text style={styles.walletAddress}>
            {address ? `${address.slice(0, 10)}...${address.slice(-10)}` : 'Bağlı değil'}
          </Text>
          <TouchableOpacity
            style={[styles.walletButton, address && styles.walletButtonDisconnect]}
            onPress={address ? handleDisconnect : handleConnect}
          >
            <Text style={styles.walletButtonText}>
              {address ? '❌ ÇIKIS YAP' : '✓ CÜZDAN BAĞLA'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  navTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  navTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  navTabActive: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 204, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
  },
  navTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  navTabTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 44,
    letterSpacing: 0.5,
  },
  heroDescription: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    marginTop: 12,
    lineHeight: 21,
    marginBottom: 20,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 32,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 2,
  },
  featureCardSub: {
    fontSize: 10,
    color: THEME.colors.secondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureCardDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  walletSection: {
    backgroundColor: 'rgba(0, 204, 255, 0.08)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  walletLabel: {
    fontSize: 9,
    color: THEME.colors.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 14,
    fontFamily: 'monospace',
  },
  walletButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  walletButtonDisconnect: {
    backgroundColor: THEME.colors.danger,
  },
  walletButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
