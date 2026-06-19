import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CONFIG } from '../../../constants/Config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOwnershipPurchases } from '../../../src/data/ownershipSnapshot';

// Design Palette
const COLORS = {
  space_black: '#000000',
  neon_cyan: '#00f2fe',
  neon_gold: '#f39c12',
  space_purple: '#8e44ad',
  glass_bg: 'rgba(25, 25, 35, 0.6)',
  text_muted: 'rgba(255, 255, 255, 0.6)',
};

export default function HomeScreen() {
  const [ownedStarCount, setOwnedStarCount] = useState(0);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNews();
    getOwnershipPurchases()
      .then((purchases) => setOwnedStarCount(Array.isArray(purchases) ? purchases.length : 0))
      .catch(() => setOwnedStarCount(0));
  }, []);

  const loadNews = async () => {
    try {
      const baseUrl = await CONFIG.getAPIUrl();
      const res = await fetch(`${baseUrl}/api/news`);
      const data = await res.json();
      setNews(data);
    } catch (e) {
      console.error('News load failed:', e);
    } finally {
      setLoadingNews(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* BACKGROUND: Deep Space Gradient */}
      <LinearGradient
        colors={['#000000', '#05071e', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        {/* HUD CORNERS */}
        <View style={styles.hudOverlay} pointerEvents="none">
          <View style={[styles.hudLine, { top: 20, left: 20, width: 60, borderTopWidth: 1, borderColor: COLORS.neon_cyan }]} />
          <View style={[styles.hudLine, { top: 20, left: 20, height: 60, borderLeftWidth: 1, borderColor: COLORS.neon_cyan }]} />
          <View style={[styles.hudLine, { top: 20, right: 20, width: 60, borderTopWidth: 1, borderColor: COLORS.neon_cyan }]} />
          <View style={[styles.hudLine, { top: 20, right: 20, height: 60, borderRightWidth: 1, borderColor: COLORS.neon_cyan }]} />
          
          <View style={[styles.hudLine, { bottom: 80, left: 20, width: 60, borderBottomWidth: 1, borderColor: COLORS.neon_gold }]} />
          <View style={[styles.hudLine, { bottom: 80, left: 20, height: 60, borderLeftWidth: 1, borderColor: COLORS.neon_gold }]} />
          <View style={[styles.hudLine, { bottom: 80, right: 20, width: 60, borderBottomWidth: 1, borderColor: COLORS.neon_gold }]} />
          <View style={[styles.hudLine, { bottom: 80, right: 20, height: 60, borderRightWidth: 1, borderColor: COLORS.neon_gold }]} />
        </View>

        {/* TOP HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandText}>STARCLAIM</Text>
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>LVL 42 | COMMANDER</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={() => router.push('/neural-link')}
          >
            <LinearGradient
              colors={[COLORS.neon_cyan, COLORS.space_purple]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.aiGradient}
            >
              <MaterialCommunityIcons name="star-four-points" size={18} color="#000" />
              <Text style={styles.aiButtonText}>YILDIZ AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* MAIN COCKPIT CONTENT (Landscape Optimized) */}
        <View style={styles.content}>
          <View style={styles.mainGrid}>
            
            {/* LEFT SECTION: OBSERVATION CARD */}
            <View style={styles.leftCol}>
              <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>GÖZLEM MERKEZİ</Text>
                  <View style={styles.pulseDot} />
                </View>
                
                <View style={styles.observationContainer}>
                  <MaterialCommunityIcons name="telescope" size={42} color={COLORS.neon_cyan} />
                  <View style={styles.observationCopy}>
                    <Text style={styles.observationTitle}>SKY LIVE</Text>
                    <Text style={styles.observationDescription}>Bulunduğun konumdan gerçek gökyüzünü keşfet.</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.readyText}>KATALOG HAZIR</Text>
                  <TouchableOpacity style={styles.vaultBtn} onPress={() => router.push('/(tabs)/explore/starmap')}>
                    <Text style={styles.vaultBtnText}>HARİTAYI AÇ</Text>
                  </TouchableOpacity>
                </View>

                {/* Neon Border Accents */}
                <View style={[styles.cornerAccent, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: COLORS.neon_cyan }]} />
                <View style={[styles.cornerAccent, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: COLORS.neon_gold }]} />
              </View>
            </View>

            {/* RIGHT SECTION: TELEMETRY & NAV */}
            <View style={styles.rightCol}>
              <View style={styles.telemetryGrid}>
                <View style={styles.telemetryBox}>
                  <Text style={styles.telLabel}>SYNC_STATUS</Text>
                  <Text style={[styles.telValue, { color: COLORS.neon_cyan }]}>HAZIR</Text>
                </View>
                <View style={styles.telemetryBox}>
                  <Text style={styles.telLabel}>OWNED_STARS</Text>
                  <Text style={[styles.telValue, { color: COLORS.neon_gold }]}>{ownedStarCount}</Text>
                </View>
              </View>

              {/* GALACTIC FEED (NEWS) */}
              <View style={styles.feedBox}>
                <View style={styles.feedHeader}>
                  <Text style={styles.feedTitle}>GALACTIC_FEED</Text>
                  <MaterialCommunityIcons name="broadcast" size={12} color={COLORS.neon_cyan} />
                </View>
                
                <ScrollView 
                  style={styles.feedScroll} 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {loadingNews ? (
                    <ActivityIndicator size="small" color={COLORS.neon_cyan} />
                  ) : news.length > 0 ? (
                    news.map((item, index) => (
                      <View key={item.news_id || index} style={styles.newsItem}>
                        <Text style={styles.newsCategory}>[{item.category.toUpperCase()}]</Text>
                        <Text style={styles.newsText}>{item.title}</Text>
                        <Text style={styles.newsDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyFeedText}>NO_ACTIVE_TRANSMISSIONS</Text>
                  )}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={styles.navPanel}
                onPress={() => router.push('/(tabs)/explore/starmap')}
              >
                <LinearGradient
                  colors={['rgba(0, 242, 254, 0.1)', 'transparent']}
                  style={styles.navGradient}
                >
                  <MaterialCommunityIcons name="navigation" size={32} color={COLORS.neon_cyan} />
                  <View>
                    <Text style={styles.navTitle}>NAVİGASYON_SİSTEMİ</Text>
                    <Text style={styles.navDesc}>2D GÖKYÜZÜ HARİTASINI BAŞLAT</Text>
                  </View>
                </LinearGradient>
                <View style={[styles.cornerAccent, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderColor: COLORS.neon_cyan }]} />
              </TouchableOpacity>
            </View>

          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.space_black },
  safeArea: { flex: 1 },
  hudOverlay: { ...StyleSheet.absoluteFillObject },
  hudLine: { position: 'absolute' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  headerLeft: { gap: 4 },
  brandText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  levelContainer: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.neon_cyan,
  },
  levelText: {
    color: COLORS.neon_cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiButton: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.5)',
  },
  aiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  aiButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  leftCol: { flex: 1.2 },
  rightCol: { flex: 1, gap: 16 },

  glassCard: {
    backgroundColor: COLORS.glass_bg,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    minHeight: 180,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    color: COLORS.text_muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  observationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 20,
  },
  observationCopy: { flex: 1 },
  observationTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: COLORS.neon_cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  observationDescription: { color: COLORS.text_muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readyText: { color: COLORS.neon_cyan, fontSize: 10, fontWeight: '800' },
  vaultBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  vaultBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  cornerAccent: {
    position: 'absolute',
    width: 12,
    height: 12,
  },

  telemetryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  telemetryBox: {
    flex: 1,
    backgroundColor: COLORS.glass_bg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telLabel: {
    color: COLORS.text_muted,
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 4,
  },
  telValue: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
  },

  feedBox: {
    backgroundColor: COLORS.glass_bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    flex: 1,
    maxHeight: 140,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 4,
  },
  feedTitle: {
    color: COLORS.neon_cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  feedScroll: {
    flex: 1,
  },
  newsItem: {
    marginBottom: 10,
    borderLeftWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    paddingLeft: 8,
  },
  newsCategory: {
    color: COLORS.neon_cyan,
    fontSize: 7,
    fontWeight: '900',
    marginBottom: 2,
  },
  newsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  newsDate: {
    color: COLORS.text_muted,
    fontSize: 7,
    marginTop: 2,
  },
  emptyFeedText: {
    color: COLORS.text_muted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'monospace',
  },

  navPanel: {
    backgroundColor: COLORS.glass_bg,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  navGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navTitle: {
    color: COLORS.neon_cyan,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  navDesc: {
    color: '#fff',
    fontSize: 9,
    opacity: 0.5,
  },

});

