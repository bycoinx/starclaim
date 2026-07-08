import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, FlatList, TextInput, Platform, InteractionManager } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/Theme';
import { CONFIG } from '../constants/Config';
import { raDecToAzAlt, getApproximateLST } from '../src/utils/astronomy';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpaceBackground from '../components/SpaceBackground';
import { useCatalogStore } from '../src/platform/stars/catalogStore';
import { getFeaturedStars, getNearbyStars, getTierMeta } from '../src/platform/stars/catalogSelection';

const { width, height } = Dimensions.get('window');
const CATALOG_RENDER_LIMIT = 360;
const CATALOG_FILTERS = [
  { key: 'all', label: 'TÜMÜ' },
  { key: 'named', label: 'İSİMLİ' },
  { key: 'nearby', label: '20 PC İÇİ' },
];

export default function Stars() {
  const [permission, requestPermission] = useCameraPermissions();
  const [motion, setMotion] = useState(null);

  const {
    stars,
    loading,
    loadCatalog,
    searchQuery,
    setSearchQuery,
    selectedTier,
    setSelectedTier,
    getFilteredStars,
    getVisibleTotalLabel
  } = useCatalogStore();

  const [selectedStar, setSelectedStar] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog'); // 'tarama' (AR) or 'catalog' (list)
  const router = useRouter();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadCatalog();
    });
    return () => task.cancel?.();
  }, [loadCatalog]);

  useEffect(() => {
    let subscription;
    const startMotion = async () => {
      await DeviceMotion.setUpdateInterval(66);
      subscription = DeviceMotion.addListener((data) => { setMotion(data); });
    };
    if (permission?.granted) startMotion();
    return () => { subscription && subscription.remove(); };
  }, [permission]);

  const lst = getApproximateLST();

  const starsWithCoordinates = useMemo(() => {
    if (activeTab !== 'tarama') return [];
    return stars.map((star) => {
      const ra = star.raHours ?? star.ra;
      const dec = star.decDegrees ?? star.dec;
      const { az, alt } = raDecToAzAlt(ra, dec, lst);
      return {
        ...star,
        az,
        alt,
        star_id: star.id,
      };
    });
  }, [activeTab, lst, stars]);

  const filteredStars = useMemo(() => {
    const base = getFilteredStars();
    const shouldCap = !searchQuery.trim() && selectedTier === 'all';
    const visible = shouldCap ? base.slice(0, CATALOG_RENDER_LIMIT) : base;
    return visible.map((star) => ({
      ...star,
      star_id: star.id,
    }));
  }, [getFilteredStars, searchQuery, selectedTier, stars]);

  const featuredStars = useMemo(() => getFeaturedStars(filteredStars, 6), [filteredStars]);
  const nearbyStars = useMemo(() => getNearbyStars(filteredStars, 3), [filteredStars]);
  const catalogTotalLabel = getVisibleTotalLabel();

  const renderARMode = () => {
    if (loading) return null;
    if (!motion || !motion.rotation) return null;

    const { alpha, beta } = motion.rotation;
    const deviceAz = (alpha * 180) / Math.PI;
    const deviceAlt = (beta * 180) / Math.PI;

    return starsWithCoordinates.map((star) => {
      let diffAz = star.az - deviceAz;
      if (diffAz > 180) diffAz -= 360;
      if (diffAz < -180) diffAz += 360;

      const diffAlt = star.alt - deviceAlt;
      const FOV_X = 90; // Widescreen FOV
      const FOV_Y = 60;

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
          <View style={[styles.starReticle, { borderColor: isCentered ? THEME.colors.secondary : THEME.colors.primary }]}>
            <View style={[styles.starCore, { backgroundColor: isCentered ? THEME.colors.secondary : '#fff' }]} />
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

  const renderCatalogItem = ({ item: star }) => {
    const tierMeta = getTierMeta(star.tier, true);
    return (
      <TouchableOpacity style={styles.starCardContainer} onPress={() => setSelectedStar(star)}>
        <View style={styles.starCard}>
          <LinearGradient colors={['rgba(25, 25, 35, 0.7)', 'rgba(10, 10, 20, 0.8)']} style={styles.starCardGradient}>
            <View style={styles.starCardHeader}>
              <Text style={styles.starCardTier}>{star.localCatalog ? 'GÖZLEM KATALOĞU' : tierMeta.label.toUpperCase()}</Text>
              <View style={[styles.tierPill, { borderColor: tierMeta.accent[0] + '55', backgroundColor: tierMeta.accent[0] + '18' }]}>
                <Text style={[styles.tierPillText, { color: tierMeta.accent[0] }]}>{tierMeta.label}</Text>
              </View>
            </View>
            <Text style={styles.starCardName}>{star.name}</Text>
            <Text style={styles.starCardMeta}>{star.constellation || star.spectralType || 'HYG'}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.starCardPriceValue}>
                {star.price == null
                  ? (String(star.id) === '0'
                    ? `${star.spectralType || 'G2V'} · YEREL SİSTEM`
                    : `${Number(star.distanceParsec || 0).toFixed(1)} pc`)
                  : `$${star.price}`}
              </Text>
            </View>
            <View style={[styles.cardCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary + '60' }]} />
            <View style={[styles.cardCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.secondary + '60' }]} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  if (activeTab === 'tarama' && !permission) return <View style={styles.container} />;
  if (activeTab === 'tarama' && !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <SpaceBackground />
        <MaterialCommunityIcons name="camera-off" size={64} color={THEME.colors.primary} />
        <Text style={styles.permissionText}>KAMERA ERİŞİMİ GEREKLİ</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>YETKİ VER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      {activeTab === 'tarama' ? (
        <CameraView style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <View style={styles.hudOverlay} pointerEvents="none">
              <View style={[styles.hudCorner, { top: 30, left: 30, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary }]} />
              <View style={[styles.hudCorner, { top: 30, right: 30, borderTopWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.primary }]} />
              <View style={[styles.hudCorner, { bottom: 30, left: 30, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary }]} />
              <View style={[styles.hudCorner, { bottom: 30, right: 30, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.primary }]} />
              <View style={styles.centerCrosshair} />
            </View>

            {renderARMode()}

            <View style={styles.topBar}>
              <TouchableOpacity style={styles.glassBtn} onPress={() => setActiveTab('catalog')}>
                <MaterialCommunityIcons name="view-list" size={24} color="#fff" />
                <Text style={styles.glassBtnText}>KATALOG</Text>
              </TouchableOpacity>
              <View style={styles.statusGroup}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>COSMOS_VISION_ACTIVE</Text>
              </View>
              <TouchableOpacity style={styles.glassBtn} onPress={() => setActiveTab('catalog')}>
                <Ionicons name="close" size={24} color={THEME.colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedStar && (
              <View style={styles.arDetailPanel}>
                <LinearGradient colors={['rgba(25, 25, 35, 0.95)', 'rgba(10, 10, 20, 0.98)']} style={styles.arDetailContent}>
                  <Text style={styles.detailTier}>{selectedStar.tier?.toUpperCase()}</Text>
                  <Text style={styles.detailName}>{selectedStar.name.toUpperCase()}</Text>
                  <View style={styles.detailSeparator} />
                  <View style={styles.detailStats}>
                    <View style={styles.detailStatItem}>
                      <Text style={styles.detailStatLabel}>PRICE</Text>
                      <Text style={styles.detailStatValue}>${selectedStar.price}</Text>
                    </View>
                    <View style={styles.detailStatItem}>
                      <Text style={styles.detailStatLabel}>CON</Text>
                      <Text style={styles.detailStatValue}>{selectedStar.constellation || 'N/A'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.claimBtn}>
                    <LinearGradient colors={[THEME.colors.primary, THEME.colors.purple]} style={styles.claimGradient}>
                      <Text style={styles.claimBtnText}>ACQUIRE_SYSTEM</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeArDetail} onPress={() => setSelectedStar(null)}>
                    <Text style={styles.closeArDetailText}>✕ DISMISS</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>
        </CameraView>
      ) : (
        <View style={styles.catalogContainer}>
          <SpaceBackground />
          <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} />
          
          <View style={styles.catalogHeader}>
            <View style={styles.catalogIdentity}>
              <Text style={styles.catalogTitle}>STELLAR_CATALOG</Text>
              <View style={styles.catalogStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.catalogSub}>{catalogTotalLabel} OBJECTS_SYNCED · {filteredStars.length} VISIBLE</Text>
              </View>
            </View>
            <View style={styles.catalogSearchGroup}>
              <View style={styles.catalogSearchBar}>
                <MaterialCommunityIcons name="magnify" size={18} color={THEME.colors.primary} />
                <TextInput style={styles.catalogSearchInput} placeholder="SEARCH_SYSTEM..." placeholderTextColor="rgba(0,242,254,0.3)" value={searchQuery} onChangeText={setSearchQuery} />
              </View>
              <View style={styles.tierFilters}>
                {CATALOG_FILTERS.map((filter) => (
                  <TouchableOpacity key={filter.key} style={[styles.tierFilter, selectedTier === filter.key && styles.tierFilterActive]} onPress={() => setSelectedTier(filter.key)}>
                    <Text style={[styles.tierFilterText, selectedTier === filter.key && styles.tierFilterTextActive]}>{filter.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <FlatList
            ListHeaderComponent={(
              <View style={styles.catalogSections}>
                <View style={styles.heroPanel}>
                  <Text style={styles.heroTitle}>10.000 YILDIZLIK ATLAS</Text>
                  <Text style={styles.heroSubtitle}>
                    Web katalogla aynı registry akışından senkronize edilen {catalogTotalLabel} yıldız. Liste performansı için ilk {Math.min(CATALOG_RENDER_LIMIT, filteredStars.length)} kayıt gösteriliyor.
                  </Text>
                  <View style={styles.heroCards}>
                    {featuredStars.map((star) => {
                      const tierMeta = getTierMeta(star.tier, true);
                      return (
                        <TouchableOpacity key={star.star_id || star.id} style={styles.heroCard} onPress={() => setSelectedStar(star)}>
                          <Text style={styles.heroCardName}>{star.name}</Text>
                          <Text style={styles.heroCardMeta}>{star.constellation || 'Bilinmeyen'}</Text>
                          <View style={[styles.tierPill, { borderColor: tierMeta.accent[0] + '55', backgroundColor: tierMeta.accent[0] + '18' }]}> 
                            <Text style={[styles.tierPillText, { color: tierMeta.accent[0] }]}>{tierMeta.label}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.sectionPanel}>
                  <Text style={styles.sectionTitle}>YAKIN YILDIZLAR</Text>
                  <View style={styles.nearbyCards}>
                    {nearbyStars.map((star) => {
                      const tierMeta = getTierMeta(star.tier, true);
                      return (
                        <TouchableOpacity key={star.star_id || star.id} style={styles.nearbyCard} onPress={() => setSelectedStar(star)}>
                          <Text style={styles.nearbyCardName}>{star.name}</Text>
                          <Text style={styles.nearbyCardMeta}>{Number(star.distanceParsec || star.distance || 0).toFixed(1)} pc</Text>
                          <View style={[styles.tierPill, { borderColor: tierMeta.accent[0] + '55', backgroundColor: tierMeta.accent[0] + '18' }]}> 
                            <Text style={[styles.tierPillText, { color: tierMeta.accent[0] }]}>{tierMeta.label}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
            data={filteredStars}
            keyExtractor={(item, index) => item.star_id?.toString() || item.id?.toString() || `${item.name || 'star'}-${index}`}
            renderItem={renderCatalogItem}
            numColumns={3}
            contentContainerStyle={styles.catalogList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={18}
            maxToRenderPerBatch={18}
            windowSize={7}
            updateCellsBatchingPeriod={40}
            removeClippedSubviews
          />

        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', gap: 24 },
  permissionText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  permissionBtn: { backgroundColor: THEME.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  permissionBtnText: { color: '#000', fontWeight: '900' },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  hudOverlay: { ...StyleSheet.absoluteFillObject },
  hudCorner: { position: 'absolute', width: 40, height: 40 },
  centerCrosshair: { position: 'absolute', top: '50%', left: '50%', width: 30, height: 30, marginLeft: -15, marginTop: -15, borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.2)', borderRadius: 15 },
  topBar: { position: 'absolute', top: 30, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glassBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(25, 25, 35, 0.8)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.3)' },
  glassBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  statusGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary, shadowColor: THEME.colors.primary, shadowOpacity: 1, shadowRadius: 4 },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  starContainer: { position: 'absolute', alignItems: 'center', width: 80, height: 80, marginLeft: -40, marginTop: -40 },
  starReticle: { width: 40, height: 40, borderWidth: 1.5, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  starCore: { width: 6, height: 6, borderRadius: 3 },
  lockOnLabel: { marginTop: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  lockOnText: { color: THEME.colors.secondary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  lockOnSub: { color: '#fff', fontSize: 8, fontWeight: '700', opacity: 0.8 },
  arDetailPanel: { position: 'absolute', right: 30, top: 100, bottom: 100, width: 320 },
  arDetailContent: { flex: 1, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.3)' },
  detailTier: { color: THEME.colors.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  detailName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  detailSeparator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  detailStats: { gap: 16, flex: 1 },
  detailStatItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12 },
  detailStatLabel: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  detailStatValue: { color: '#fff', fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  claimBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 20 },
  claimGradient: { paddingVertical: 16, alignItems: 'center' },
  claimBtnText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  closeArDetail: { marginTop: 16, alignItems: 'center' },
  closeArDetailText: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900' },
  catalogContainer: { flex: 1, backgroundColor: '#000', padding: 24 },
  catalogHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24, marginTop: 10 },
  catalogSections: { gap: 16, marginBottom: 16 },
  heroPanel: { borderRadius: 20, padding: 16, backgroundColor: 'rgba(10, 16, 32, 0.85)', borderWidth: 1, borderColor: 'rgba(230, 188, 74, 0.25)' },
  heroTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  heroSubtitle: { color: 'rgba(244,247,255,0.7)', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  heroCards: { gap: 10 },
  heroCard: { borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroCardName: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  heroCardMeta: { color: 'rgba(244,247,255,0.6)', fontSize: 11, marginBottom: 8 },
  sectionPanel: { borderRadius: 20, padding: 16, backgroundColor: 'rgba(10, 16, 32, 0.85)', borderWidth: 1, borderColor: 'rgba(119, 191, 255, 0.2)' },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  nearbyCards: { gap: 10 },
  nearbyCard: { borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  nearbyCardName: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  nearbyCardMeta: { color: 'rgba(244,247,255,0.6)', fontSize: 11, marginBottom: 8 },
  tierPill: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tierPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  catalogIdentity: { flexGrow: 1, flexShrink: 1, minWidth: 170 },
  catalogTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  catalogStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  catalogSub: { fontSize: 10, color: THEME.colors.primary, fontWeight: '900', letterSpacing: 2 },
  catalogSearchGroup: { flexGrow: 1, flexShrink: 1, flexBasis: 300, maxWidth: 400, minWidth: 210, gap: 12 },
  arButton: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,242,254,0.28)', backgroundColor: 'rgba(7,11,20,0.76)' },
  arButtonText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  catalogSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25, 25, 35, 0.7)', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.3)' },
  catalogSearchInput: { flex: 1, color: '#fff', paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, fontWeight: '700' },
  tierFilters: { flexDirection: 'row', gap: 8 },
  tierFilter: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tierFilterActive: { backgroundColor: THEME.colors.primary + '20', borderColor: THEME.colors.primary },
  tierFilterText: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tierFilterTextActive: { color: '#fff' },
  catalogList: { paddingBottom: 24 },
  starCardContainer: { flex: 1/3, padding: 6 },
  starCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  starCardGradient: { padding: 16, minHeight: 120 },
  starCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  starCardTier: { fontSize: 8, color: THEME.colors.secondary, fontWeight: '900', letterSpacing: 1, flexShrink: 1 },
  starCardName: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1, flex: 1 },
  starCardMeta: { color: 'rgba(244,247,255,0.6)', fontSize: 11, marginTop: 4, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  starCardPriceValue: { fontSize: 15, fontWeight: '900', color: THEME.colors.primary, fontFamily: 'monospace' },
  cardCorner: { position: 'absolute', width: 10, height: 10 },
});
