import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert, FlatList, ScrollView, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/Theme';
import { CONFIG } from '../constants/Config';

const { width, height } = Dimensions.get('window');

export default function Stars() {
  const [permission, requestPermission] = useCameraPermissions();
  const [motion, setMotion] = useState(null);
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog'); // 'tarama' (AR) or 'catalog' (list)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const router = useRouter();

  // Task 6.5.1: Fetch real stars with fallback
  useEffect(() => {
    const fetchStars = async () => {
      setLoading(true);
      const apiUrls = [
        CONFIG.PRODUCTION_URL,
        CONFIG.API_URL,
      ];

      for (const url of apiUrls) {
        try {
          const response = await Promise.race([
            fetch(`${url}/api/stars?limit=100&sort=price_desc`),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            ),
          ]);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          
          // Map backend RA/Dec to simple Az/Alt for AR demo
          const mapped = data.map((s, idx) => ({
            ...s,
            az: (idx * 35) % 360,
            alt: 10 + (idx * 5) % 60,
          }));
          setStars(mapped);
          console.log('Stars fetched from:', url);
          setLoading(false);
          return;
        } catch (err) {
          console.warn(`API ${url} failed:`, err.message);
        }
      }
      
      // All APIs failed
      Alert.alert("UYARI", "Yıldız kataloğu yüklenemedı. Aşağıda mevcut olanları görebilirsiniz.");
      setStars([]);
      setLoading(false);
    };

    fetchStars();
  }, []);

  useEffect(() => {
    let subscription;
    const startMotion = async () => {
      await DeviceMotion.setUpdateInterval(16);
      subscription = DeviceMotion.addListener((data) => {
        setMotion(data);
      });
    };

    if (permission?.granted) {
      startMotion();
    }

    return () => {
      subscription && subscription.remove();
    };
  }, [permission]);

  const filteredStars = stars.filter(star => {
    const matchesSearch = star.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || star.tier?.toLowerCase() === selectedTier.toLowerCase();
    return matchesSearch && matchesTier;
  });

  // AR TARAMA MODUNU RENDER ET
  const renderARMode = () => {
    if (loading) {
      return (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>SYNCING_WITH_CATALOG...</Text>
        </View>
      );
    }

    if (!motion || !motion.rotation) {
      return (
        <View style={styles.motionNeededOverlay}>
          <Text style={styles.motionText}>📡 Tarama modunu etkinleştirmek için cihazı hareket ettirin</Text>
        </View>
      );
    }

    const { alpha, beta } = motion.rotation;
    const deviceAz = (alpha * 180) / Math.PI;
    const deviceAlt = (beta * 180) / Math.PI;

    return stars.map((star) => {
      let diffAz = star.az - deviceAz;
      if (diffAz > 180) diffAz -= 360;
      if (diffAz < -180) diffAz += 360;

      const diffAlt = star.alt - deviceAlt;
      const FOV_X = 60;
      const FOV_Y = 100;

      const x = (width / 2) + (diffAz * (width / FOV_X));
      const y = (height / 2) - (diffAlt * (height / FOV_Y));

      if (x < -100 || x > width + 100 || y < -100 || y > height + 100) return null;

      const isCentered = Math.abs(diffAz) < 5 && Math.abs(diffAlt) < 5;

      return (
        <TouchableOpacity
          key={star.star_id}
          style={[styles.starContainer, { left: x, top: y }]}
          onPress={() => setSelectedStar(star)}
        >
          <View style={[
            styles.starReticle,
            { borderColor: isCentered ? THEME.colors.secondary : THEME.colors.primary }
          ]}>
            <View style={[
              styles.starCore,
              { backgroundColor: isCentered ? THEME.colors.secondary : '#fff' }
            ]} />
          </View>
          {isCentered && (
            <View style={styles.lockOnLabel}>
              <Text style={styles.lockOnText}>{star.name.toUpperCase()}</Text>
              <Text style={styles.lockOnSub}>{star.tier?.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  // KATALOG MODUNU RENDER ET
  const renderCatalogMode = () => (
    <View style={styles.catalogContainer}>
      {/* Header */}
      <View style={styles.catalogHeader}>
        <Text style={styles.catalogTitle}>⭐ YILDIZ KATALOĞu</Text>
        <Text style={styles.catalogSub}>{filteredStars.length} yıldız gösteriliyor</Text>
      </View>

      {/* Arama Kutusu */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Yıldız adı ara..."
          placeholderTextColor={THEME.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtreler */}
      <View style={styles.filterTabs}>
        {['all', 'nova', 'supernova'].map(tier => (
          <TouchableOpacity
            key={tier}
            style={[
              styles.filterTab,
              selectedTier === tier && styles.filterTabActive
            ]}
            onPress={() => setSelectedTier(tier)}
          >
            <Text style={[
              styles.filterTabText,
              selectedTier === tier && styles.filterTabTextActive
            ]}>
              {tier === 'all' ? 'TÜM' : tier.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Yıldızlar Listesi */}
      {filteredStars.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>😔 Kriterlere uyan yıldız bulunamadı</Text>
        </View>
      ) : (
        <ScrollView style={styles.starsList}>
          {filteredStars.map(star => (
            <TouchableOpacity
              key={star.star_id}
              style={styles.starCard}
              onPress={() => setSelectedStar(star)}
            >
              <View style={styles.starCardContent}>
                <View>
                  <Text style={styles.starCardTier}>{star.tier?.toUpperCase()}</Text>
                  <Text style={styles.starCardName}>{star.name}</Text>
                </View>
                <View style={styles.starCardPrice}>
                  <Text style={styles.starCardPriceValue}>${star.price}</Text>
                </View>
              </View>
              <View style={styles.starCardMeta}>
                <Text style={styles.starCardMeta}>{star.constellation || 'Unknown'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Permission CHECK
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kameraya erişim izni vermeniz gerekiyor.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // MAIN RENDER
  return (
    <View style={styles.container}>
      {activeTab === 'tarama' ? (
        // AR TARAMA MODU
        <CameraView style={styles.camera} facing="back">
          <View style={styles.overlay}>
            {/* HUD FRAME */}
            <View style={styles.hudOverlay} pointerEvents="none">
              <View style={[styles.hudCorner, styles.hudTopL]} />
              <View style={[styles.hudCorner, styles.hudTopR]} />
              <View style={[styles.hudCorner, styles.hudBottomL]} />
              <View style={[styles.hudCorner, styles.hudBottomR]} />
              <View style={styles.centerCrosshair} />
            </View>

            {renderARMode()}

            {/* TOP CONTROLS */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.tabBtn}
                onPress={() => setActiveTab('catalog')}
              >
                <Text style={styles.tabBtnText}>📋 KATALOG</Text>
              </TouchableOpacity>
              <View style={styles.statusGroup}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>AEGIS_ACTIVE</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* SELECTED STAR INFO */}
            {selectedStar && (
              <View style={styles.detailPanel}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.95)', 'rgba(0, 20, 40, 0.95)']}
                  style={styles.detailContent}
                >
                  <View style={styles.detailHeader}>
                    <View>
                      <Text style={styles.detailTier}>{selectedStar.tier?.toUpperCase()}</Text>
                      <Text style={styles.detailName}>{selectedStar.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedStar(null)}>
                      <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>FİYAT</Text>
                      <Text style={styles.statValue}>${selectedStar.price}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>TAKIMI</Text>
                      <Text style={styles.statValue}>{selectedStar.constellation || 'Bilinmiyor'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.claimBtn}>
                    <Text style={styles.claimBtnText}>🌟 YILDIZ AL</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>
        </CameraView>
      ) : (
        // KATALOG MODU
        <LinearGradient colors={['#000', '#001a33']} style={styles.catalogGradient}>
          {renderCatalogMode()}

          {/* BOTTOM NAVBAR */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setActiveTab('tarama')}
            >
              <Text style={styles.navTabText}>📡 TARAMA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navTab, styles.navTabActive]}>
              <Text style={styles.navTabText}>📋 KATALOG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navTab}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            >
              <Text style={styles.navTabText}>← GERİ</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  catalogGradient: { flex: 1 },
  
  /* CATALOG MODE */
  catalogContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  catalogHeader: {
    marginBottom: 20,
  },
  catalogTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  catalogSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  searchBox: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
  },
  searchInput: {
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 204, 255, 0.15)',
    borderColor: THEME.colors.primary,
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  starsList: {
    flex: 1,
  },
  starCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  starCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  starCardTier: {
    fontSize: 9,
    color: THEME.colors.secondary,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  starCardName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  starCardPrice: {
    backgroundColor: 'rgba(0, 204, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  starCardPriceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.primary,
  },
  starCardMeta: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  navTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  navTabActive: {
    borderTopColor: THEME.colors.primary,
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },

  /* AR TARAMA MODU */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.primary,
    marginTop: 10,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  motionNeededOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motionText: {
    color: THEME.colors.secondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '700',
  },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accent,
  },
  statusText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  hudOverlay: { ...StyleSheet.absoluteFillObject },
  hudCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(0, 204, 255, 0.4)',
    borderWidth: 1,
  },
  hudTopL: { top: 40, left: 40, borderBottomWidth: 0, borderRightWidth: 0 },
  hudTopR: { top: 40, right: 40, borderBottomWidth: 0, borderLeftWidth: 0 },
  hudBottomL: { bottom: 40, left: 40, borderTopWidth: 0, borderRightWidth: 0 },
  hudBottomR: { bottom: 40, right: 40, borderTopWidth: 0, borderLeftWidth: 0 },
  centerCrosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 255, 0.2)',
    borderRadius: 10,
  },

  starContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
  },
  starReticle: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  lockOnLabel: {
    marginTop: 5,
    alignItems: 'center',
  },
  lockOnText: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  lockOnSub: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    opacity: 0.8,
  },

  detailPanel: {
    position: 'absolute',
    right: 20,
    top: 100,
    bottom: 20,
    width: 280,
  },
  detailContent: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailTier: {
    color: THEME.colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  detailName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  closeIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
  },
  detailStats: {
    gap: 12,
    marginBottom: 20,
    flex: 1,
  },
  statBox: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  claimBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  message: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
