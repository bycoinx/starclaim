import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StarSystem3D from '../../../components/StarSystem3D';
import { ensureStarData } from '../../../src/data/starLoader';
import { createStarSectorTileStore } from '../../../src/data/starSectorTileStore';
import { loadRemoteStarSectorWindow } from '../../../src/data/remoteStarTileProvider';
import {
  purchaseMatchesStar,
  resolveStarTarget,
  starMatchesQuery,
} from '../../../src/utils/starIdentity';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const RECENT_TARGETS_KEY = '@starvoyage_recent_targets_v1';
const MAX_RECENT_TARGETS = 6;

export default function StarVoyage3D() {
  const [stars, setStars] = useState([]);
  const [targetStar, setTargetStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arrivalVisible, setArrivalVisible] = useState(false);
  const [ownershipData, setOwnershipData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentTargetIds, setRecentTargetIds] = useState([]);
  const [remoteSectorWindow, setRemoteSectorWindow] = useState({ stars: [], sectorIds: [] });
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('@purchases'),
      AsyncStorage.getItem(RECENT_TARGETS_KEY),
    ])
      .then(([purchaseRaw, recentRaw]) => {
        const storedPurchases = purchaseRaw ? JSON.parse(purchaseRaw) : [];
        const storedRecentIds = recentRaw ? JSON.parse(recentRaw) : [];
        setPurchases(Array.isArray(storedPurchases) ? storedPurchases : []);
        setRecentTargetIds((currentIds) => {
          const hydratedIds = Array.isArray(storedRecentIds) ? storedRecentIds : [];
          return [...new Set([...currentIds, ...hydratedIds].map(String))]
            .slice(0, MAX_RECENT_TARGETS);
        });
      })
      .catch(() => {
        setPurchases([]);
        setRecentTargetIds([]);
      });
  }, []);

  const ownedStars = useMemo(() => {
    const seen = new Set();
    return purchases.reduce((results, purchase) => {
      const star = stars.find((candidate) => purchaseMatchesStar(purchase, candidate));
      const id = star ? String(star.id) : null;
      if (!star || seen.has(id)) return results;
      seen.add(id);
      results.push({ star, purchase });
      return results;
    }, []);
  }, [purchases, stars]);

  const ownedStarCatalog = useMemo(
    () => ownedStars.map(({ star }) => star),
    [ownedStars],
  );

  const sectorTileStore = useMemo(() => createStarSectorTileStore(stars), [stars]);
  const activeSectorWindow = useMemo(
    () => targetStar
      ? sectorTileStore.getWindow(targetStar, { minStars: 500, maxStars: 10000, maxRadius: 3 })
      : sectorTileStore.getBrightest(3500),
    [sectorTileStore, targetStar],
  );
  useEffect(() => {
    let cancelled = false;
    if (!targetStar) {
      setRemoteSectorWindow({ stars: [], sectorIds: [] });
      return undefined;
    }
    setRemoteSectorWindow({ stars: [], sectorIds: [] });
    loadRemoteStarSectorWindow(targetStar, { minStars: 700, maxStars: 10000, maxRadius: 2 })
      .then((window) => {
        if (!cancelled) setRemoteSectorWindow(window);
      })
      .catch((error) => {
        console.warn('Remote sector window load failed', error);
        if (!cancelled) setRemoteSectorWindow({ stars: [], sectorIds: [] });
      });
    return () => { cancelled = true; };
  }, [targetStar]);

  const renderedSectorWindow = useMemo(() => {
    const seen = new Set();
    const combinedStars = [];
    [targetStar, ...activeSectorWindow.stars, ...remoteSectorWindow.stars]
      .filter(Boolean)
      .forEach((star) => {
        const id = String(star.id);
        if (seen.has(id)) return;
        seen.add(id);
        combinedStars.push(star);
      });
    const [target, ...rest] = combinedStars;
    rest.sort((left, right) => Number(left.magnitude ?? left.mag) - Number(right.magnitude ?? right.mag));
    return {
      stars: target ? [target, ...rest].slice(0, 10000) : rest.slice(0, 10000),
      sectorIds: [...new Set([
        ...activeSectorWindow.sectorIds,
        ...remoteSectorWindow.sectorIds,
      ])],
    };
  }, [activeSectorWindow, remoteSectorWindow, targetStar]);
  const activeStarIds = useMemo(
    () => new Set(renderedSectorWindow.stars.map((star) => String(star.id))),
    [renderedSectorWindow.stars],
  );
  const activeOwnedStars = useMemo(
    () => ownedStarCatalog.filter((star) => activeStarIds.has(String(star.id))),
    [activeStarIds, ownedStarCatalog],
  );

  const recentStars = useMemo(() => recentTargetIds
    .map((id) => stars.find((star) => String(star.id) === String(id)))
    .filter(Boolean), [recentTargetIds, stars]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return [];

    const results = [];
    const seen = new Set();
    const addStar = (star) => {
      if (!star || seen.has(String(star.id))) return;
      seen.add(String(star.id));
      results.push(star);
    };

    stars.forEach((star) => {
      if (results.length < 8 && starMatchesQuery(star, query)) addStar(star);
    });

    const normalizedQuery = query.toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '');
    purchases.forEach((purchase) => {
      const purchaseTokens = [purchase.starClaimCode, purchase.code]
        .filter(Boolean)
        .map((value) => String(value).toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, ''));
      if (!purchaseTokens.some((token) => token.includes(normalizedQuery))) return;
      addStar(stars.find((star) => purchaseMatchesStar(purchase, star)));
    });

    return results.slice(0, 8);
  }, [purchases, searchQuery, stars]);

  function rememberTarget(star) {
    if (!star?.id) return;
    setRecentTargetIds((currentIds) => {
      const id = String(star.id);
      const nextIds = [id, ...currentIds.filter((currentId) => String(currentId) !== id)]
        .slice(0, MAX_RECENT_TARGETS);
      AsyncStorage.setItem(RECENT_TARGETS_KEY, JSON.stringify(nextIds))
        .catch((error) => console.warn('Recent target save error', error));
      return nextIds;
    });
  }

  function clearRecentTargets() {
    setRecentTargetIds([]);
    AsyncStorage.removeItem(RECENT_TARGETS_KEY)
      .catch((error) => console.warn('Recent target clear error', error));
  }

  useEffect(() => {
    ensureStarData().then((list) => {
      setStars(list);
      if (params.target) {
        try {
          const parsed = JSON.parse(params.target);
          const resolved = resolveStarTarget(list, parsed) || parsed;
          if (resolved) {
            setTargetStar(resolved);
            rememberTarget(resolved);
            checkOwnership(resolved);
          }
        } catch (e) {
          console.warn('Failed to parse target param', e);
        }
      } else if (params.starId || params.hip || params.hd || params.starClaimCode || params.name) {
        const found = resolveStarTarget(list, params);
        if (found) {
          setTargetStar(found);
          rememberTarget(found);
          checkOwnership(found);
        }
      }
      setLoading(false);
    });
  }, [params.target, params.starId, params.hip, params.hd, params.starClaimCode, params.name]);

  const checkOwnership = async (star) => {
    try {
      const raw = await AsyncStorage.getItem('@purchases');
      const list = raw ? JSON.parse(raw) : [];
      const found = list.find((purchase) => purchaseMatchesStar(purchase, star));
      setOwnershipData(found || null);
    } catch (e) { console.warn('Ownership check error', e); }
  };

  const handleArrival = (star) => {
    if (star) setArrivalVisible(true);
  };

  const handleTargetChange = (star) => {
    if (!star) return;
    setTargetStar(star);
    rememberTarget(star);
    setArrivalVisible(false);
    setOwnershipData(null);
    checkOwnership(star);
  };

  const selectSearchResult = (star) => {
    handleTargetChange(star);
    setSearchVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const openOwnedStarCertificate = (star) => {
    const purchase = purchases.find((item) => purchaseMatchesStar(item, star));
    if (!purchase) return;
    router.push({
      pathname: '/(tabs)/explore/stardetail',
      params: {
        starId: String(purchase.starId ?? star.id),
        name: purchase.name || star.properName || star.proper || `HIP ${star.hip || star.id}`,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* HUD OVERLAY LAYER */}
      <View style={styles.hudLayer} pointerEvents="none">
        <View style={[styles.hudCorner, { top: 40, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.hudCorner, { top: 40, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />
        <View style={[styles.hudCorner, { bottom: 40, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.hudCorner, { bottom: 40, right: 20, borderBottomWidth: 1, borderRightWidth: 1 }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={THEME.colors.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{targetStar ? (targetStar.properName || targetStar.proper || `HIP ${targetStar.hip}`).toUpperCase() : 'STAR_VOYAGE_3D'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: targetStar ? THEME.colors.primary : THEME.colors.purple }]} />
              <Text style={styles.subtitle}>{targetStar ? 'TARGET_LOCKED' : 'HYPER_SPACE_EXPLORATION'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(true)}>
            <Ionicons name="search" size={22} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewport}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>CALIBRATING_QUANTUM_VIEW...</Text>
            </View>
          ) : (
            <StarSystem3D
              stars={renderedSectorWindow.stars}
              targetStar={targetStar}
              ownedStars={activeOwnedStars}
              loadedSectorCount={renderedSectorWindow.sectorIds.length}
              onArrival={handleArrival}
              onTargetChange={handleTargetChange}
              onOwnedStarPress={openOwnedStarCertificate}
            />
          )}

          {arrivalVisible && targetStar && (
            <View style={styles.arrivalOverlay} pointerEvents="box-none">
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(10, 10, 25, 0.98)']}
                style={styles.arrivalPanel}
              >
                <View style={styles.panelGlass}>
                  <View style={styles.panelHeader}>
                    <View style={styles.panelHeaderIcon}>
                      <MaterialCommunityIcons name="target" size={20} color={THEME.colors.primary} />
                    </View>
                    <Text style={styles.panelTitle}>PROXIMITY_ESTABLISHED</Text>
                    <TouchableOpacity onPress={() => setArrivalVisible(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.telemetryGrid}>
                    <TelemetryItem
                      label="DISTANCE"
                      value={Number(targetStar.dist || targetStar.distanceParsec) > 0
                        ? `${(Number(targetStar.dist || targetStar.distanceParsec) * 3.26156).toFixed(2)} LY`
                        : 'UNKNOWN'}
                      color={THEME.colors.primary}
                    />
                    <TelemetryItem label="MAGNITUDE" value={Number(targetStar.mag).toFixed(2)} color={THEME.colors.secondary} />
                    <TelemetryItem label="SPECTRUM" value={targetStar.spect || targetStar.spectralType || 'N/A'} color={THEME.colors.purple} />
                  </View>

                  {ownershipData ? (
                    <View style={styles.messageBox}>
                      <View style={styles.messageHeader}>
                        <MaterialCommunityIcons name="shield-check" size={16} color={THEME.colors.secondary} />
                        <Text style={styles.messageLabel}>CERTIFIED_STARCLAIM // {ownershipData.starClaimCode}</Text>
                      </View>
                      <Text style={styles.messageText}>"{ownershipData.message || 'Bu yıldız insanlık adına mühürlenmiştir.'}"</Text>
                      <View style={styles.signatureRow}>
                        <Text style={styles.signatureValue}>BLOCKCHAIN_VERIFIED_SIGNATURE</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.unownedBox}>
                      <Text style={styles.unownedText}>BU YILDIZ HENÜZ SAHİPLENİLMEMİŞTİR.</Text>
                      <TouchableOpacity 
                        style={styles.claimBtn} 
                        onPress={() => router.push({ pathname: '/(tabs)/explore/stardetail', params: { starId: targetStar.id } })}
                      >
                        <LinearGradient
                          colors={[THEME.colors.primary, THEME.colors.purple]}
                          style={styles.claimGradient}
                        >
                          <Text style={styles.claimBtnText}>MÜHÜRLE</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Panel Decorative Corners */}
                  <View style={[styles.panelCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary }]} />
                  <View style={[styles.panelCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.secondary }]} />
                </View>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>GYROSCOPE_STABILIZED // 3D_RENDER_ENGINE_v2.0 // AEGIS_OS</Text>
        </View>

        <Modal
          visible={searchVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSearchVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.searchBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => { setSearchVisible(false); Keyboard.dismiss(); }}
            />
            <SafeAreaView style={styles.searchSafeArea} pointerEvents="box-none">
              <View style={styles.searchPanel}>
                <View style={styles.searchInputRow}>
                  <Ionicons name="search" size={20} color={THEME.colors.primary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => searchResults[0] && selectSearchResult(searchResults[0])}
                    placeholder="STAR NAME / HIP / HD / STARCLAIM CODE"
                    placeholderTextColor="rgba(255,255,255,0.32)"
                    returnKeyType="search"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.searchInput}
                  />
                  {!!searchQuery && (
                    <TouchableOpacity style={styles.searchIconButton} onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.55)" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.searchIconButton} onPress={() => setSearchVisible(false)}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                {searchQuery.trim().length < 2 ? (
                  <ScrollView style={styles.quickAccess} keyboardShouldPersistTaps="handled">
                    {ownedStars.length > 0 && (
                      <View>
                        <View style={styles.quickSectionHeader}>
                          <MaterialCommunityIcons name="shield-star-outline" size={16} color={THEME.colors.secondary} />
                          <Text style={styles.quickSectionTitle}>YILDIZLARIM</Text>
                          <Text style={styles.quickSectionCount}>{ownedStars.length}</Text>
                        </View>
                        {ownedStars.map(({ star, purchase }) => (
                          <TargetResultRow
                            key={`owned-${star.id}`}
                            star={star}
                            purchase={purchase}
                            onPress={() => selectSearchResult(star)}
                          />
                        ))}
                      </View>
                    )}

                    {recentStars.length > 0 && (
                      <View>
                        <View style={styles.quickSectionHeader}>
                          <Ionicons name="time-outline" size={16} color={THEME.colors.primary} />
                          <Text style={styles.quickSectionTitle}>SON_HEDEFLER</Text>
                          <Text style={styles.quickSectionCount}>{recentStars.length}</Text>
                          <TouchableOpacity
                            accessibilityLabel="Son hedefleri temizle"
                            style={styles.quickSectionAction}
                            onPress={clearRecentTargets}
                          >
                            <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.55)" />
                          </TouchableOpacity>
                        </View>
                        {recentStars.map((star) => (
                          <TargetResultRow
                            key={`recent-${star.id}`}
                            star={star}
                            purchase={purchases.find((item) => purchaseMatchesStar(item, star))}
                            onPress={() => selectSearchResult(star)}
                          />
                        ))}
                      </View>
                    )}

                    {ownedStars.length === 0 && recentStars.length === 0 && (
                      <Text style={styles.searchHint}>SEARCH_NAME_HIP_HD_OR_CODE</Text>
                    )}
                  </ScrollView>
                ) : searchResults.length === 0 ? (
                  <Text style={styles.searchHint}>NO_TARGET_FOUND</Text>
                ) : (
                  <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
                    {searchResults.map((star) => {
                      const purchase = purchases.find((item) => purchaseMatchesStar(item, star));
                      return (
                        <TargetResultRow
                          key={star.id}
                          star={star}
                          purchase={purchase}
                          onPress={() => selectSearchResult(star)}
                        />
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function TelemetryItem({ label, value, color }) {
  return (
    <View style={styles.telemetryItem}>
      <Text style={styles.telLabel}>{label}</Text>
      <Text style={[styles.telValue, { color }]}>{value}</Text>
    </View>
  );
}

function TargetResultRow({ star, purchase, onPress }) {
  const magnitude = Number(star.mag);
  return (
    <TouchableOpacity style={styles.searchResult} onPress={onPress}>
      <View style={styles.searchResultIdentity}>
        <Text style={styles.searchResultName} numberOfLines={1}>
          {(star.properName || star.proper || `HIP ${star.hip || star.id}`).toUpperCase()}
        </Text>
        <Text style={styles.searchResultMeta} numberOfLines={1}>
          HIP {star.hip || 'N/A'}  //  HD {star.hd || 'N/A'}  //  MAG {Number.isFinite(magnitude) ? magnitude.toFixed(2) : 'N/A'}
        </Text>
        {purchase && (
          <Text style={styles.searchResultClaim} numberOfLines={1}>
            {purchase.starClaimCode || purchase.code || 'CERTIFIED_STAR'}
          </Text>
        )}
      </View>
      <Ionicons name="locate" size={20} color={purchase ? THEME.colors.secondary : THEME.colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  hudLayer: { ...StyleSheet.absoluteFillObject, zIndex: 15 },
  hudCorner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: 'rgba(0, 242, 254, 0.4)',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 20,
    gap: 20
  },
  titleContainer: { flex: 1, minWidth: 0 },
  backBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'rgba(25, 25, 35, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)'
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    backgroundColor: 'rgba(25, 25, 35, 0.7)',
  },
  title: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900', 
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: 0.8, shadowRadius: 4 },
  subtitle: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  viewport: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: THEME.colors.primary, fontSize: 11, fontWeight: '900', marginTop: 24, letterSpacing: 3 },
  footer: { 
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center' 
  },
  footerLine: { width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 8 },
  footerText: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  arrivalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 30 },
  arrivalPanel: { padding: 24, paddingBottom: 40 },
  panelGlass: {
    backgroundColor: 'rgba(25, 25, 35, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    padding: 24,
    overflow: 'hidden',
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  panelHeaderIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 8, 
    backgroundColor: 'rgba(0, 242, 254, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)'
  },
  panelTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2, flex: 1 },
  closeBtn: { padding: 4 },
  telemetryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  telemetryItem: { flex: 1 },
  telLabel: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  telValue: { fontSize: 16, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  messageBox: { 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    borderRadius: 12, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: THEME.colors.secondary + '30' 
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  messageLabel: { color: THEME.colors.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  messageText: { color: '#fff', fontSize: 16, lineHeight: 24, fontStyle: 'italic', marginBottom: 20, opacity: 0.9 },
  signatureRow: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 12 },
  signatureValue: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 2, opacity: 0.7 },
  unownedBox: { alignItems: 'center', paddingVertical: 10 },
  unownedText: { color: THEME.colors.textMuted, fontSize: 11, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
  claimBtn: { borderRadius: 10, overflow: 'hidden', width: '100%' },
  claimGradient: { paddingVertical: 14, alignItems: 'center' },
  claimBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  panelCorner: { position: 'absolute', width: 12, height: 12 },
  searchBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)' },
  searchSafeArea: { width: '100%', paddingHorizontal: 16, paddingTop: 12 },
  searchPanel: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.32)',
    backgroundColor: 'rgba(5, 11, 22, 0.98)',
    overflow: 'hidden',
  },
  searchInputRow: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 12,
  },
  searchIconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  searchHint: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', padding: 18 },
  quickAccess: { width: '100%', maxHeight: 420 },
  quickSectionHeader: {
    minHeight: 38,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  quickSectionTitle: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '900' },
  quickSectionCount: { color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: '900' },
  quickSectionAction: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  searchResults: { width: '100%', maxHeight: 360 },
  searchResult: {
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchResultIdentity: { flex: 1, minWidth: 0, paddingRight: 12 },
  searchResultName: { color: '#fff', fontSize: 12, fontWeight: '900' },
  searchResultMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', marginTop: 4 },
  searchResultClaim: { color: THEME.colors.secondary, fontSize: 9, fontWeight: '900', marginTop: 4 },
});
