import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { SecurityService } from '../lib/security';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const { address, connecting, connect, disconnect, setAddress } = useSolanaWallet();
  const [restoring, setRestoring] = useState(true);
  const [metrics, setMetrics] = useState({ market_cap: 2400000, volume_24h: 12450 });
  const [activities, setActivities] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Session Restoration
    const restoreSession = async () => {
      try {
        const session = await SecurityService.getSession();
        if (session && session.user && session.user.wallet_address) {
          setAddress(session.user.wallet_address);
        }
      } catch (e) {
        console.error("Session restoration failed", e);
      } finally {
        setRestoring(false);
      }
    };
    restoreSession();

    // Fetch Metrics
    fetch('https://starclaim-api.onrender.com/api/marketplace/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Metrics fetch failed", err));

    // Fetch Live Activities
    fetch('https://starclaim-api.onrender.com/api/activities/live?limit=10')
      .then(res => res.json())
      .then(data => setActivities(data))
      .catch(err => console.error("Activities fetch failed", err));
  }, []);

  const handleConnect = async () => {
    try {
      const pubKey = await connect();
      if (pubKey) {
        const walletAddress = pubKey.toBase58();
        await SecurityService.saveSession('dummy_token_for_mobile', { wallet_address: walletAddress });
      }
    } catch (err) {
      Alert.alert("HATA", "Cüzdan bağlantısı başarısız.");
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    await SecurityService.clearSession();
  };

  const LeftWing = (
    <View style={styles.wingContainer}>
      <Text style={styles.logoText}>AEGIS</Text>
      <View style={styles.divider} />
      
      <View style={styles.navLinks}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/stars')}>
          <Ionicons name="telescope-outline" size={20} color={THEME.colors.primary} />
          <Text style={styles.navLabel}>STARS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/vault')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={THEME.colors.primary} />
          <Text style={styles.navLabel}>VAULT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/qr-login')}>
          <Ionicons name="qr-code-outline" size={20} color={THEME.colors.secondary} />
          <Text style={styles.navLabel}>LOGIN</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />
      
      {address ? (
        <TouchableOpacity style={styles.walletStatus} onPress={handleDisconnect}>
          <Text style={styles.walletCode}>{address.slice(0, 4)}...{address.slice(-4)}</Text>
          <Text style={styles.walletSub}>DISCONNECT</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.walletStatus} onPress={handleConnect}>
          <Text style={styles.walletCode}>GUEST_MODE</Text>
          <Text style={styles.walletSub}>CONNECT WALLET</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const RightWing = (
    <View style={styles.wingContainer}>
      <Text style={styles.sectionTitle}>SYSTEM_STATS</Text>
      <View style={styles.divider} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MARKET_CAP</Text>
          <Text style={styles.statValue}>
            {metrics.market_cap >= 1000000 ? `$${(metrics.market_cap / 1000000).toFixed(1)}M` : `$${metrics.market_cap.toLocaleString()}`}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>VOLUME_24H</Text>
          <Text style={styles.statValue}>${metrics.volume_24h.toLocaleString()}</Text>
        </View>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>LIVE_FEED</Text>
        {activities.length > 0 ? activities.map((act, i) => (
          <View key={act.activity_id || i} style={styles.logItem}>
            <Text style={styles.logText}>
              {act.user_name || 'System'}: {act.type === 'claim' ? 'claimed' : 'listed'} {act.star_name}
            </Text>
          </View>
        )) : (
          <View style={styles.logItem}>
            <Text style={styles.logText}>Waiting for telemetry...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <CockpitLayout leftWing={LeftWing} rightWing={RightWing}>
      <View style={styles.viewport}>
        <LinearGradient
          colors={['rgba(0, 204, 255, 0.05)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.mainContent}>
          <Text style={styles.heroTitle}>STARCLAIM</Text>
          <Text style={styles.heroSub}>INTERSTELLAR_REGISTRY_v5.0</Text>
          
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push('/stars')}
          >
            <Text style={styles.actionBtnText}>ENTER_STAR_MAP</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Telemetry (Bottom) */}
        <View style={styles.telemetryOverlay}>
           <Text style={styles.telemetryText}>RA: 06H 45M 08S // DEC: -16° 42' 58" // MAG: -1.46</Text>
        </View>
      </View>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  wingContainer: {
    flex: 1,
  },
  logoText: {
    color: THEME.colors.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: THEME.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: THEME.spacing.md,
  },
  navLinks: {
    gap: THEME.spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  navLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  walletStatus: {
    backgroundColor: 'rgba(0, 204, 255, 0.05)',
    padding: THEME.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 255, 0.2)',
  },
  walletCode: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  walletSub: {
    color: THEME.colors.primary,
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionTitle: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: THEME.spacing.xs,
  },
  statBox: {
    marginBottom: THEME.spacing.sm,
  },
  statLabel: {
    color: THEME.colors.secondary,
    fontSize: 8,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  logItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  logText: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontFamily: 'System',
  },
  viewport: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 12,
  },
  heroSub: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginTop: -5,
    marginBottom: 30,
  },
  actionBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  actionBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  telemetryOverlay: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  telemetryText: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
