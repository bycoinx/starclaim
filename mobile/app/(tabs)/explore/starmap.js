import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Modal, SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import { DeviceMotion, Magnetometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StarCanvas from '../../../components/StarCanvas';
import StarPopup from '../../../components/StarPopup';
import PurchaseModal from '../../../components/PurchaseModal';
import { ensureStarData } from '../../../src/data/starLoader';
import { ensureConstellations } from '../../../src/data/constellationLoader';
import {
  getStarDecDegrees,
  getStarRaHours,
  getStarRaDegrees,
  getLocalSiderealTime,
  normalizeAngle,
  raDecToAltAz,
} from '../../../src/utils/astronomy';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { getPlanetPositions } from '../../../src/utils/solarSystem';
import { DSO_CATALOG } from '../../../src/data/dsoData';
import {
  purchaseMatchesStar,
  resolveStarTarget,
  starMatchesQuery,
} from '../../../src/utils/starIdentity';

export default function StarMapScreen() {
  const params = useLocalSearchParams();
  const [stars, setStars] = useState([]);
  const [selectedStar, setSelectedStar] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [mode, setMode] = useState('manual');
  const [cameraPermission, setCameraPermission] = useState(null);
  const [centerRa, setCenterRa] = useState(180);
  const [centerDec, setCenterDec] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [heading, setHeading] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showConstellationLabels, setShowConstellationLabels] = useState(true);
  const [showConstellationBoundaries, setShowConstellationBoundaries] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showDSOs, setShowDSOs] = useState(true);
  const [constellations, setConstellations] = useState({
    lines: { features: [] },
    labels: { features: [] },
    boundaries: { features: [] },
  });
  const [purchases, setPurchases] = useState([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [showMythology, setShowMythology] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [coordinateMode, setCoordinateMode] = useState('equatorial');
  const [observer, setObserver] = useState(null);
  const [siderealTime, setSiderealTime] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [headingAccuracy, setHeadingAccuracy] = useState(0);
  const [headingSource, setHeadingSource] = useState('waiting');
  const [calibrationVisible, setCalibrationVisible] = useState(false);
  const [layersVisible, setLayersVisible] = useState(false);
  const [nightVision, setNightVision] = useState(false);
  const lastHeading = useRef(0);
  const lastTilt = useRef(0);
  const router = useRouter();
  const ALPHA = 0.15;

  useEffect(() => {
    ensureStarData().then((list) => { 
      setStars(list); 
      setLoading(false); 
      
      if (params.starId || params.hip || params.hd || params.starClaimCode || params.name) {
        const found = resolveStarTarget(list, params);
        if (found) {
          setCenterRa(getStarRaDegrees(found));
          setCenterDec(getStarDecDegrees(found));
          setZoom(4);
          setSelectedStar(found);
        }
      }
    });
    ensureConstellations().then(setConstellations).catch(() => {});
    loadPurchases();
  }, [params.hd, params.hip, params.name, params.starClaimCode, params.starId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!observer || coordinateMode !== 'horizontal') return undefined;
    const updateSiderealTime = () => {
      setSiderealTime(getLocalSiderealTime(observer.longitude, new Date()));
    };
    updateSiderealTime();
    const timer = setInterval(updateSiderealTime, 1000);
    return () => clearInterval(timer);
  }, [coordinateMode, observer]);

  const getHorizontalPosition = (object, activeObserver = observer) => {
    if (!activeObserver) return null;
    const lst = getLocalSiderealTime(activeObserver.longitude, new Date());
    return raDecToAltAz(
      getStarRaHours(object),
      getStarDecDegrees(object),
      activeObserver.latitude,
      lst,
    );
  };

  const activateRealSky = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Konum izni gerekli',
          'Gercek gokyuzunu gostermek icin konum izni vermelisiniz.',
        );
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextObserver = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const nextSiderealTime = getLocalSiderealTime(nextObserver.longitude, new Date());
      setObserver(nextObserver);
      setSiderealTime(nextSiderealTime);
      setCoordinateMode('horizontal');
      setCenterRa(mode === 'camera' ? heading : 180);
      setCenterDec(mode === 'camera' ? tilt : 25);
      setZoom(1.2);
      return nextObserver;
    } catch (error) {
      console.warn('Location error', error);
      Alert.alert('Konum alinamadi', 'Konum servisini kontrol edip tekrar deneyin.');
      return null;
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    const lower = text.toLowerCase();
    const planetResults = getPlanetPositions().filter(p => p.name.toLowerCase().includes(lower));
    const dsoResults = DSO_CATALOG.filter(d => d.name.toLowerCase().includes(lower));
    const starResults = stars
      .filter((star) => starMatchesQuery(star, text))
      .sort((a, b) => {
        const aName = String(a.properName || a.proper || '').toLowerCase();
        const bName = String(b.properName || b.proper || '').toLowerCase();
        const aExact = aName === lower ? 0 : 1;
        const bExact = bName === lower ? 0 : 1;
        return aExact - bExact || a.mag - b.mag;
      })
      .slice(0, 8);
    setSearchResults([...planetResults, ...dsoResults, ...starResults]);
  };

  const navigateToObject = (obj) => {
    setMode('manual');
    const horizontal = coordinateMode === 'horizontal' ? getHorizontalPosition(obj) : null;
    setCenterRa(horizontal ? horizontal.az : getStarRaDegrees(obj));
    setCenterDec(horizontal ? horizontal.alt : getStarDecDegrees(obj));
    setZoom(3.5);
    setSearchQuery('');
    setSearchResults([]);
    if (obj.type === 'star') {
      setSelectedStar(obj);
      setPopupVisible(true);
    } else {
      setSelectedStar(null);
    }
  };

  const loadPurchases = async () => {
    try {
      const raw = await AsyncStorage.getItem('@purchases');
      const list = raw ? JSON.parse(raw) : [];
      setPurchases(list);
    } catch (error) { console.warn('Purchase load error', error); }
  };

  useEffect(() => {
    if (mode !== 'camera' || appState !== 'active') return undefined;

    let headingSubscription;
    let cancelled = false;
    let usingFallback = false;

    const applyHeading = (nextHeading) => {
      let diff = nextHeading - lastHeading.current;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const filteredHeading = normalizeAngle(lastHeading.current + diff * ALPHA);
      lastHeading.current = filteredHeading;
      setHeading(filteredHeading);
    };

    const fallbackMagSub = Magnetometer.addListener((data) => {
      if (!usingFallback) return;
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      applyHeading(normalizeAngle(90 - angle));
    });

    const motionSub = DeviceMotion.addListener((data) => {
      const betaDegrees = (data.rotation?.beta || 0) * (180 / Math.PI);
      const newTilt = Math.max(-90, Math.min(90, betaDegrees - 90));
      const filteredTilt = lastTilt.current + (newTilt - lastTilt.current) * ALPHA;
      lastTilt.current = filteredTilt;
      setTilt(filteredTilt);
    });

    const startHeading = async () => {
      try {
        headingSubscription = await Location.watchHeadingAsync((measurement) => {
          if (cancelled) return;
          const trueHeadingAvailable = measurement.trueHeading >= 0;
          applyHeading(trueHeadingAvailable ? measurement.trueHeading : measurement.magHeading);
          setHeadingSource(trueHeadingAvailable ? 'true' : 'magnetic');
          setHeadingAccuracy(measurement.accuracy);
          if (measurement.accuracy >= 2) setCalibrationVisible(false);
        });
        if (cancelled) headingSubscription.remove();
      } catch (error) {
        console.warn('Heading sensor error', error);
        usingFallback = true;
        setHeadingSource('fallback');
        setHeadingAccuracy(0);
        setCalibrationVisible(true);
      }
    };

    startHeading();
    Magnetometer.setUpdateInterval(66);
    DeviceMotion.setUpdateInterval(66);
    return () => {
      cancelled = true;
      headingSubscription?.remove();
      fallbackMagSub.remove();
      motionSub.remove();
    };
  }, [appState, mode]);

  useEffect(() => {
    if (mode !== 'camera') return undefined;
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch((error) => console.warn('Orientation lock error', error));
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'camera') {
      setCenterRa(heading);
      setCenterDec(tilt * 0.6);
    }
  }, [mode, heading, tilt]);

  const selectedPurchase = selectedStar
    && purchases.find((item) => purchaseMatchesStar(item, selectedStar));
  const selectedStarOwned = Boolean(selectedPurchase);
  const ownedStarIds = useMemo(
    () => purchases
      .flatMap((item) => [item.starId, item.hip])
      .filter((id) => id !== null && id !== undefined && id !== ''),
    [purchases],
  );

  const handleViewOwnedStar = () => {
    if (selectedStar) {
      setMode('manual');
      const horizontal = coordinateMode === 'horizontal'
        ? getHorizontalPosition(selectedStar)
        : null;
      setCenterRa(horizontal ? horizontal.az : getStarRaDegrees(selectedStar));
      setCenterDec(horizontal ? horizontal.alt : getStarDecDegrees(selectedStar));
    }
    setPopupVisible(false);
  };

  const handleCenterOnSelected = () => {
    if (selectedStar) {
      setMode('manual');
      const horizontal = coordinateMode === 'horizontal'
        ? getHorizontalPosition(selectedStar)
        : null;
      setCenterRa(horizontal ? horizontal.az : getStarRaDegrees(selectedStar));
      setCenterDec(horizontal ? horizontal.alt : getStarDecDegrees(selectedStar));
    }
  };

  const enableCameraMode = async () => {
    const activeObserver = observer || await activateRealSky();
    if (!activeObserver) return;

    if (cameraPermission === true) {
      setCoordinateMode('horizontal');
      setCalibrationVisible(headingAccuracy < 2);
      setMode('camera');
      return;
    }

    const status = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status.granted);
    if (status.granted) {
      setCoordinateMode('horizontal');
      setCalibrationVisible(true);
      setMode('camera');
    } else {
      Alert.alert(
        'Kamera izni gerekli',
        'Canli gokyuzu modunu kullanmak icin kamera izni vermelisiniz.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {mode === 'camera' && cameraPermission ? (
        <CameraView style={styles.camera} facing="back" />
      ) : null}
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/explore/home')}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Yıldız ara..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((item) => (
                <TouchableOpacity key={`${item.type || 'object'}-${item.id}`} style={styles.searchResultItem} onPress={() => navigateToObject(item)}>
                  <Ionicons name="star-outline" size={16} color={THEME.colors.primary} />
                  <Text style={styles.searchResultText}>
                    {item.name || item.properName || item.proper || `HIP ${item.hip}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.topBar}>
          <View style={styles.controlGroup}>
            <TouchableOpacity style={[styles.modeButton, mode==='manual' && styles.modeActive]} onPress={() => setMode('manual')}>
              <Ionicons name="hand-right-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeButton, mode==='camera' && styles.modeActive]} onPress={enableCameraMode}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeButton, coordinateMode === 'horizontal' && styles.locationActive]} onPress={activateRealSky}>
              <Ionicons name="location-outline" size={20} color={coordinateMode === 'horizontal' ? THEME.colors.primary : '#fff'} />
            </TouchableOpacity>
          </View>

          <View style={styles.controlGroup}>
            <TouchableOpacity style={[styles.modeButton, layersVisible && styles.modeActive]} onPress={() => setLayersVisible(true)}>
              <Ionicons name="layers-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeButton, nightVision && styles.nightModeActive]} onPress={() => setNightVision(!nightVision)}>
              <Ionicons name="moon-outline" size={20} color={nightVision ? '#FF4A42' : '#fff'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {coordinateMode === 'horizontal' && observer && (
            <View style={styles.observerBadge} pointerEvents="none">
              <Ionicons name="navigate" size={12} color={THEME.colors.primary} />
              <Text style={styles.observerText}>GERCEK GOKYUZU</Text>
              <Text style={styles.observerCoordinates}>
                {observer.latitude.toFixed(2)} / {observer.longitude.toFixed(2)}
              </Text>
            </View>
          )}
          {mode === 'camera' && (
            <TouchableOpacity
              style={[
                styles.calibrationBadge,
                headingAccuracy >= 2 && styles.calibrationBadgeReady,
              ]}
              onPress={() => setCalibrationVisible(true)}
            >
              <Ionicons
                name={headingAccuracy >= 2 ? 'compass' : 'warning-outline'}
                size={13}
                color={headingAccuracy >= 2 ? '#64D99B' : '#F1C75B'}
              />
              <Text style={[
                styles.calibrationBadgeText,
                headingAccuracy >= 2 && styles.calibrationBadgeTextReady,
              ]}>
                {headingAccuracy >= 2 ? 'PUSULA HAZIR' : 'KALIBRE ET'}
              </Text>
            </TouchableOpacity>
          )}
          {loading ? <ActivityIndicator color={THEME.colors.primary} size="large" /> : (
            <StarCanvas
              stars={stars}
              selectedStar={selectedStar}
              centerRa={centerRa}
              centerDec={centerDec}
              zoom={zoom}
              showConstellations={showConstellations}
              showConstellationLabels={showConstellationLabels}
              showConstellationBoundaries={showConstellationBoundaries}
              showLabels={showLabels}
              showPlanets={showPlanets}
              showDSOs={showDSOs}
              constellations={constellations}
              showMythology={showMythology}
              coordinateMode={coordinateMode}
              observerLatitude={observer?.latitude || 0}
              lstDegrees={siderealTime}
              hideBelowHorizon
              transparentBackground={mode === 'camera'}
              nightVision={nightVision}
              onCenterChange={({ ra, dec }) => { setMode('manual'); setCenterRa(normalizeAngle(ra)); setCenterDec(Math.max(-90, Math.min(90, dec))); }}
              onZoomChange={setZoom}
              onSelect={(star) => { setSelectedStar(star); setPopupVisible(false); }}
              ownedStarIds={ownedStarIds}
            />
          )}

          {nightVision && <View style={styles.nightFilter} pointerEvents="none" />}

          {selectedStar && (
            <View style={[styles.selectionPanel, nightVision && styles.selectionPanelNight]}>
              <View style={styles.selectionIdentity}>
                <Text style={[styles.selectionName, nightVision && styles.nightText]}>
                  {selectedStar.properName || selectedStar.proper || `HIP ${selectedStar.hip || selectedStar.id}`}
                </Text>
                <Text style={[styles.selectionMeta, nightVision && styles.nightTextMuted]}>
                  MAG {Number(selectedStar.mag).toFixed(2)}
                  {selectedStar.constellation || selectedStar.con ? `  /  ${selectedStar.constellation || selectedStar.con}` : ''}
                </Text>
                {selectedStarOwned && (
                  <Text style={[styles.selectionOwned, nightVision && styles.nightText]}>
                    STARCLAIM {selectedPurchase?.starClaimCode || selectedPurchase?.code || selectedStar.starClaimCode || 'OWNED'}
                  </Text>
                )}
              </View>
              <View style={styles.selectionActions}>
                <TouchableOpacity style={styles.selectionIconButton} onPress={handleCenterOnSelected}>
                  <Ionicons name="locate" size={20} color={nightVision ? '#FF4A42' : THEME.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectionIconButton} onPress={() => setPopupVisible(true)}>
                  <Ionicons name="information-circle-outline" size={21} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectionIconButton} onPress={() => setSelectedStar(null)}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        <StarPopup visible={popupVisible} star={selectedStar} owned={selectedStarOwned} onClose={() => setPopupVisible(false)} onPurchase={() => { setPopupVisible(false); setPurchaseModalVisible(true); }} onProfile={handleViewOwnedStar} />
        <PurchaseModal visible={purchaseModalVisible} onClose={() => setPurchaseModalVisible(false)} star={selectedStar} onPurchaseSuccess={loadPurchases} />
        <Modal
          visible={layersVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLayersVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.layersBackdrop}
            onPress={() => setLayersVisible(false)}
          >
            <View style={[styles.layersPanel, nightVision && styles.layersPanelNight]}>
              <View style={styles.layersHeader}>
                <Text style={[styles.layersTitle, nightVision && styles.nightText]}>GOKYUZU KATMANLARI</Text>
                <TouchableOpacity onPress={() => setLayersVisible(false)}>
                  <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
              <LayerToggle icon="git-merge-outline" label="Takimyildizi cizgileri" active={showConstellations} onPress={() => setShowConstellations(!showConstellations)} nightVision={nightVision} />
              <LayerToggle icon="pricetag-outline" label="Takimyildizi isimleri" active={showConstellationLabels} onPress={() => setShowConstellationLabels(!showConstellationLabels)} nightVision={nightVision} />
              <LayerToggle icon="scan-outline" label="IAU sinirlari" active={showConstellationBoundaries} onPress={() => setShowConstellationBoundaries(!showConstellationBoundaries)} nightVision={nightVision} />
              <LayerToggle icon="text-outline" label="Yildiz isimleri" active={showLabels} onPress={() => setShowLabels(!showLabels)} nightVision={nightVision} />
              <LayerToggle icon="planet-outline" label="Gezegenler" active={showPlanets} onPress={() => setShowPlanets(!showPlanets)} nightVision={nightVision} />
              <LayerToggle icon="aperture-outline" label="Derin uzay" active={showDSOs} onPress={() => setShowDSOs(!showDSOs)} nightVision={nightVision} />
              <LayerToggle icon="image-outline" label="Mitoloji gorselleri" active={showMythology} onPress={() => setShowMythology(!showMythology)} nightVision={nightVision} />
            </View>
          </TouchableOpacity>
        </Modal>
        <Modal
          visible={calibrationVisible && mode === 'camera'}
          transparent
          animationType="fade"
          onRequestClose={() => setCalibrationVisible(false)}
        >
          <View style={styles.calibrationBackdrop}>
            <View style={styles.calibrationPanel}>
              <View style={styles.calibrationIcon}>
                <Ionicons name="infinite-outline" size={48} color={THEME.colors.primary} />
              </View>
              <Text style={styles.calibrationTitle}>PUSULAYI KALIBRE ET</Text>
              <Text style={styles.calibrationBody}>
                Telefonu metal nesnelerden uzak tutun ve havada yatay bir sekiz cizecek sekilde yavasca hareket ettirin.
              </Text>
              <View style={styles.accuracyRow}>
                {[1, 2, 3].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.accuracySegment,
                      headingAccuracy >= level && styles.accuracySegmentActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.accuracyText}>
                {headingAccuracy >= 2
                  ? 'Kalibrasyon tamamlandi'
                  : headingSource === 'fallback'
                    ? 'Ham pusula kullaniliyor'
                    : 'Daha fazla hareket gerekli'}
              </Text>
              <TouchableOpacity
                style={styles.calibrationClose}
                onPress={() => setCalibrationVisible(false)}
              >
                <Text style={styles.calibrationCloseText}>
                  {headingAccuracy >= 2 ? 'DEVAM ET' : 'SIMDILIK KAPAT'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1 },
  backBtn: { position: 'absolute', top: 40, left: 20, zIndex: 10, width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  topBar: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 40, paddingHorizontal: 20, zIndex: 10 },
  controlGroup: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modeButton: { padding: 10, borderRadius: 16, marginHorizontal: 2 },
  modeActive: { backgroundColor: THEME.colors.primary + '40', borderWidth: 1, borderColor: THEME.colors.primary },
  locationActive: { backgroundColor: 'rgba(201,168,76,0.12)' },
  nightModeActive: { backgroundColor: 'rgba(255,45,35,0.16)', borderWidth: 1, borderColor: 'rgba(255,74,66,0.55)' },
  mapContainer: { flex: 1 },
  nightFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(90,0,0,0.12)', zIndex: 2 },
  observerBadge: { position: 'absolute', top: 62, alignSelf: 'center', zIndex: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 14 },
  observerText: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  observerCoordinates: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '600' },
  calibrationBadge: { position: 'absolute', top: 96, alignSelf: 'center', zIndex: 13, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'rgba(30,20,0,0.78)', borderWidth: 1, borderColor: 'rgba(241,199,91,0.4)', borderRadius: 14 },
  calibrationBadgeReady: { backgroundColor: 'rgba(0,25,16,0.78)', borderColor: 'rgba(100,217,155,0.35)' },
  calibrationBadgeText: { color: '#F1C75B', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  calibrationBadgeTextReady: { color: '#64D99B' },
  calibrationBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  calibrationPanel: { width: '100%', maxWidth: 360, backgroundColor: '#070B13', borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)', borderRadius: 8, padding: 24, alignItems: 'center' },
  calibrationIcon: { width: 82, height: 82, borderRadius: 41, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  calibrationTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  calibrationBody: { color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  accuracyRow: { width: '100%', flexDirection: 'row', gap: 6, marginTop: 22 },
  accuracySegment: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  accuracySegmentActive: { backgroundColor: '#64D99B' },
  accuracyText: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', marginTop: 9 },
  calibrationClose: { marginTop: 22, minWidth: 160, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', backgroundColor: THEME.colors.primary, borderRadius: 6 },
  calibrationCloseText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  selectionPanel: { position: 'absolute', left: 16, right: 68, bottom: 22, zIndex: 3, minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: 'rgba(4,8,16,0.92)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)', borderRadius: 8 },
  selectionPanelNight: { backgroundColor: 'rgba(12,0,0,0.94)', borderColor: 'rgba(255,74,66,0.5)' },
  selectionIdentity: { flex: 1, paddingRight: 10 },
  selectionName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  selectionMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', marginTop: 4 },
  selectionOwned: { color: '#C9A84C', fontSize: 9, fontWeight: '900', marginTop: 5, letterSpacing: 0.5 },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectionIconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  nightText: { color: '#FF4A42' },
  nightTextMuted: { color: 'rgba(255,74,66,0.58)' },
  layersBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end', padding: 16 },
  layersPanel: { backgroundColor: '#080C14', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 16, marginBottom: 18 },
  layersPanelNight: { backgroundColor: '#100000', borderColor: 'rgba(255,74,66,0.4)' },
  layersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 4 },
  layersTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  layerRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  layerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  layerLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },
  layerSwitch: { width: 38, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', padding: 2 },
  layerSwitchKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.38)' },
  searchContainer: { position: 'absolute', top: 100, left: 20, right: 20, zIndex: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  searchResults: { backgroundColor: 'rgba(5,10,26,0.95)', borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchResultText: { color: '#fff', fontSize: 13, fontWeight: '600' }
});

function LayerToggle({ icon, label, active, onPress, nightVision }) {
  const accent = nightVision ? '#FF4A42' : THEME.colors.primary;
  return (
    <TouchableOpacity style={styles.layerRow} onPress={onPress}>
      <View style={styles.layerIdentity}>
        <Ionicons name={icon} size={19} color={active ? accent : 'rgba(255,255,255,0.45)'} />
        <Text style={[styles.layerLabel, nightVision && styles.nightText]}>{label}</Text>
      </View>
      <View style={[styles.layerSwitch, active && { borderColor: accent, backgroundColor: `${accent}25` }]}>
        <View style={[styles.layerSwitchKnob, active && { backgroundColor: accent, transform: [{ translateX: 16 }] }]} />
      </View>
    </TouchableOpacity>
  );
}
