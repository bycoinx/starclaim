import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import { DeviceMotion, Magnetometer } from 'expo-sensors';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { getPlanetPositions } from '../../../src/utils/solarSystem';
import { DSO_CATALOG } from '../../../src/data/dsoData';
import {
  purchaseMatchesStar,
  resolveStarTarget,
  starMatchesQuery,
} from '../../../src/utils/starIdentity';
import { createStarTargetFromStar } from '../../../src/utils/starIdentity';
import { LinearGradient } from 'expo-linear-gradient';
import { getOwnershipPurchases } from '../../../src/data/ownershipSnapshot';
import SkyLiveChrome from '../../../components/SkyLiveChrome';
import RenderSurfaceBoundary from '../../../components/RenderSurfaceBoundary';
import { recordRenderDiagnostic } from '../../../src/utils/renderDiagnostics';
import { adjustHeadingForScreen, getScreenTilt } from '../../../src/utils/deviceOrientation';

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
  const [mapError, setMapError] = useState(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showConstellationLabels, setShowConstellationLabels] = useState(true);
  const [showConstellationBoundaries, setShowConstellationBoundaries] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showDSOs, setShowDSOs] = useState(true);
  const [showNebula, setShowNebula] = useState(true);
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
  const [now, setNow] = useState(() => new Date());
  const [screenOrientation, setScreenOrientation] = useState(ScreenOrientation.Orientation.UNKNOWN);
  const [capabilityNotice, setCapabilityNotice] = useState(null);
  const lastHeading = useRef(0);
  const lastTilt = useRef(0);
  const openedAtRef = useRef(Date.now());
  const canvasReadyDataRef = useRef(null);
  const diagnosticReportedRef = useRef(false);
  const router = useRouter();
  const ALPHA = 0.15;

  useEffect(() => {
    openedAtRef.current = Date.now();
    canvasReadyDataRef.current = null;
    diagnosticReportedRef.current = false;
    setMapError(null);
    setCanvasReady(false);
    setLoading(true);
    ensureStarData().then((list) => {
      setStars(list); 
      
      if (params.starId || params.hip || params.hd || params.starClaimCode || params.name) {
        const found = resolveStarTarget(list, params);
        if (found) {
          setCenterRa(getStarRaDegrees(found));
          setCenterDec(getStarDecDegrees(found));
          setZoom(4);
          setSelectedStar(found);
        }
      }
    }).catch((error) => {
      console.warn('Sky Live catalog error', error);
      setStars([]);
      setMapError(error?.message || 'Yıldız kataloğu hazırlanamadı.');
    }).finally(() => setLoading(false));
    ensureConstellations().then(setConstellations).catch(() => {});
    loadPurchases();
  }, [loadAttempt, params.hd, params.hip, params.name, params.starClaimCode, params.starId]);

  useEffect(() => {
    if (loading || mapError || canvasReady || stars.length === 0) return undefined;
    const timeout = setTimeout(() => {
      setMapError('2D çizim motoru zamanında hazır olamadı.');
      recordRenderDiagnostic({
        surface: '2d',
        status: 'timeout',
        startupMs: Date.now() - openedAtRef.current,
        catalogStarCount: stars.length,
      });
    }, 8000);
    return () => clearTimeout(timeout);
  }, [canvasReady, loading, mapError, stars.length]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    ScreenOrientation.getOrientationAsync()
      .then((orientation) => { if (mounted) setScreenOrientation(orientation); })
      .catch(() => {});
    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      setScreenOrientation(orientationInfo.orientation);
    });
    return () => {
      mounted = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
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
        setMode('manual');
        setCoordinateMode('equatorial');
        setCapabilityNotice({
          title: 'Konum olmadan harita modu',
          message: 'Gerçek gökyüzü yönü için konum izni gerekir. Yıldız haritasını dokunarak kullanmaya devam edebilirsiniz.',
        });
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
      setCapabilityNotice(null);
      return nextObserver;
    } catch (error) {
      console.warn('Location error', error);
      setMode('manual');
      setCoordinateMode('equatorial');
      setCapabilityNotice({
        title: 'Konum alınamadı',
        message: 'Konum servisini kontrol edene kadar dokunmatik yıldız haritası kullanılabilir.',
      });
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
      setPurchases(await getOwnershipPurchases());
    } catch (error) { console.warn('Purchase load error', error); }
  };

  useEffect(() => {
    if (mode !== 'camera' || appState !== 'active') return undefined;

    let headingSubscription;
    let cancelled = false;
    let usingFallback = false;

    const applyHeading = (nextHeading) => {
      const adjustedHeading = adjustHeadingForScreen(nextHeading, screenOrientation);
      let diff = adjustedHeading - lastHeading.current;
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
      const gammaDegrees = (data.rotation?.gamma || 0) * (180 / Math.PI);
      const newTilt = getScreenTilt(betaDegrees, gammaDegrees, screenOrientation);
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
        const magnetometerAvailable = await Magnetometer.isAvailableAsync().catch(() => false);
        if (magnetometerAvailable) {
          setCalibrationVisible(true);
        } else {
          setMode('manual');
          setCapabilityNotice({
            title: 'Yön sensörü bulunamadı',
            message: 'Bu cihazda pusula kullanılamıyor. Haritayı sürükleyerek ve yakınlaştırarak kullanabilirsiniz.',
          });
        }
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
  }, [appState, mode, screenOrientation]);

  useEffect(() => {
    if (mode === 'camera') {
      setCenterRa(heading);
      setCenterDec(tilt * 0.6);
    }
  }, [mode, heading, tilt]);

  const selectedPurchase = selectedStar
    && purchases.find((item) => purchaseMatchesStar(item, selectedStar));
  const selectedStarOwned = Boolean(selectedPurchase);
  const selectedHorizontal = selectedStar && observer
    ? getHorizontalPosition(selectedStar)
    : null;
  const displayAzimuth = normalizeAngle(selectedHorizontal?.az ?? centerRa);
  const displayAltitude = selectedHorizontal?.alt ?? centerDec;
  const cardinalDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinal = cardinalDirections[Math.round(displayAzimuth / 45) % cardinalDirections.length];
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

    const motionAvailable = await DeviceMotion.isAvailableAsync().catch(() => false);
    const magnetometerAvailable = await Magnetometer.isAvailableAsync().catch(() => false);
    if (!motionAvailable || !magnetometerAvailable) {
      setMode('manual');
      setCoordinateMode('horizontal');
      setCapabilityNotice({
        title: 'Kamera yönlendirmesi desteklenmiyor',
        message: 'Cihazın gerekli yön sensörleri eksik. Gerçek konuma göre 2D haritayı dokunarak kullanabilirsiniz.',
      });
      return;
    }

    if (cameraPermission === true) {
      setCoordinateMode('horizontal');
      setCalibrationVisible(headingAccuracy < 2);
      setMode('camera');
      setCapabilityNotice(null);
      return;
    }

    const status = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status.granted);
    if (status.granted) {
      setCoordinateMode('horizontal');
      setCalibrationVisible(true);
      setMode('camera');
      setCapabilityNotice(null);
    } else {
      setMode('manual');
      setCoordinateMode('horizontal');
      setCapabilityNotice({
        title: 'Kamera izni verilmedi',
        message: 'Kamera görüntüsü kapalı. Gerçek konuma göre sensörlü veya dokunmatik haritayı kullanabilirsiniz.',
      });
    }
  };

  return (
    <View style={styles.container}>
      {mode === 'camera' && cameraPermission ? (
        <CameraView style={styles.camera} facing="back" />
      ) : null}
      
      {/* HUD OVERLAY */}
      <View style={styles.hudOverlay} pointerEvents="none">
        <View style={[styles.hudCorner, { top: 30, left: 30, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary + '40' }]} />
        <View style={[styles.hudCorner, { top: 30, right: 30, borderTopWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.primary + '40' }]} />
        <View style={[styles.hudCorner, { bottom: 30, left: 30, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary + '40' }]} />
        <View style={[styles.hudCorner, { bottom: 30, right: 30, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.primary + '40' }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.overlay} pointerEvents="box-none">
          {/* HEADER ROW */}
          <View style={styles.headerRow} pointerEvents="box-none">
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.replace('/(tabs)/claim')}>
              <Ionicons name="close" size={24} color={THEME.colors.primary} />
            </TouchableOpacity>

            <View style={styles.searchWidget}>
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="radar" size={20} color={THEME.colors.primary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="SCAN_OBJECT..."
                  placeholderTextColor="rgba(0, 242, 254, 0.4)"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((item) => (
                    <TouchableOpacity key={`${item.type || 'object'}-${item.id}`} style={styles.searchResultItem} onPress={() => navigateToObject(item)}>
                      <Ionicons name="sparkles" size={16} color={THEME.colors.secondary} />
                      <Text style={styles.searchResultText}>
                        {(item.name || item.properName || item.proper || `HIP ${item.hip}`).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.rightControls}>
              <View style={styles.modeToggleGroup}>
                <ModeButton icon="gesture-tap" active={mode==='manual'} onPress={() => setMode('manual')} />
                <ModeButton icon="video-outline" active={mode==='camera'} onPress={enableCameraMode} />
                <ModeButton icon="crosshairs-gps" active={coordinateMode === 'horizontal'} onPress={activateRealSky} color={THEME.colors.primary} />
              </View>
            </View>
          </View>

          {/* LEFT TELEMETRY COLUMN */}
          <View style={styles.leftColumn} pointerEvents="box-none">
             {coordinateMode === 'horizontal' && observer && (
                <View style={styles.telemetryBox}>
                  <Text style={styles.telemetryLabel}>OBSERVER_LOC</Text>
                  <Text style={styles.telemetryValue}>{observer.latitude.toFixed(2)}N / {observer.longitude.toFixed(2)}E</Text>
                  <View style={styles.telemetrySeparator} />
                  <Text style={styles.telemetryLabel}>LST_ANGLE</Text>
                  <Text style={styles.telemetryValue}>{siderealTime.toFixed(2)}°</Text>
                </View>
             )}
          </View>

          {/* RIGHT TOOLS COLUMN */}
          <View style={styles.rightColumn} pointerEvents="box-none">
            <TouchableOpacity style={styles.toolBtn} onPress={() => setLayersVisible(true)}>
              <MaterialCommunityIcons name="layers-triple-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolBtn, nightVision && { borderColor: '#FF4A42', backgroundColor: 'rgba(255,0,0,0.1)' }]} onPress={() => setNightVision(!nightVision)}>
              <MaterialCommunityIcons name="eye-outline" size={24} color={nightVision ? '#FF4A42' : '#fff'} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {loading ? (
              <View style={styles.mapStatus}>
                <ActivityIndicator color={THEME.colors.primary} size="large" />
                <Text style={styles.mapStatusText}>GÖKYÜZÜ HAZIRLANIYOR</Text>
              </View>
            ) : mapError || stars.length === 0 ? (
              <View style={styles.mapStatus}>
                <MaterialCommunityIcons name="telescope" size={42} color={THEME.colors.textMuted} />
                <Text style={styles.mapErrorTitle}>SKY LIVE AÇILAMADI</Text>
                <Text style={styles.mapErrorMessage}>{mapError || 'Cihazda kullanılabilir yıldız bulunamadı.'}</Text>
                <TouchableOpacity style={styles.mapRetryButton} onPress={() => setLoadAttempt((attempt) => attempt + 1)}>
                  <Ionicons name="refresh" size={18} color="#000" />
                  <Text style={styles.mapRetryText}>YENİDEN DENE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <RenderSurfaceBoundary
                resetKey={loadAttempt}
                fallback={<View style={styles.mapStatus} />}
                onError={(error) => {
                  setCanvasReady(false);
                  setMapError(error?.message || '2D çizim motoru başlatılamadı.');
                }}
              >
                <StarCanvas
                  key={`sky-live-${loadAttempt}`}
                stars={stars}
                selectedStar={selectedStar}
                centerRa={centerRa}
                centerDec={centerDec}
                zoom={zoom}
                showConstellations={showConstellations}
                showConstellationLabels={showConstellationLabels}
                showConstellationBoundaries={showConstellationBoundaries}
                showGrid={showGrid}
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
                showNebula={showNebula}
                onCenterChange={({ ra, dec }) => { setMode('manual'); setCenterRa(normalizeAngle(ra)); setCenterDec(Math.max(-90, Math.min(90, dec))); }}
                onZoomChange={setZoom}
                onSelect={(star) => { setSelectedStar(star); setPopupVisible(false); }}
                ownedStarIds={ownedStarIds}
                  onReady={(details) => {
                    canvasReadyDataRef.current = details;
                    setCanvasReady(true);
                  }}
                  onTelemetry={({ fps }) => {
                    if (diagnosticReportedRef.current || !canvasReadyDataRef.current || !fps) return;
                    diagnosticReportedRef.current = true;
                    recordRenderDiagnostic({
                      surface: '2d',
                      status: 'ready',
                      startupMs: Date.now() - openedAtRef.current,
                      fps,
                      ...canvasReadyDataRef.current,
                    });
                  }}
                />
              </RenderSurfaceBoundary>
            )}

            {nightVision && <View style={styles.nightFilter} pointerEvents="none" />}

            {selectedStar && (
              <View style={[styles.selectionPanel, nightVision && styles.selectionPanelNight]}>
                <View style={styles.selectionIdentity}>
                  <Text style={[styles.selectionName, nightVision && styles.nightText]}>
                    {(selectedStar.properName || selectedStar.proper || `HIP ${selectedStar.hip || selectedStar.id}`).toUpperCase()}
                  </Text>
                  <Text style={[styles.selectionMeta, nightVision && styles.nightTextMuted]}>
                    MAG: {Number(selectedStar.mag).toFixed(2)}  //  {selectedStar.constellation || selectedStar.con || 'UNKNOWN'}
                  </Text>
                  {selectedStarOwned && (
                    <View style={styles.ownedBadge}>
                      <MaterialCommunityIcons name="shield-check" size={12} color={THEME.colors.secondary} />
                      <Text style={[styles.selectionOwned, nightVision && styles.nightText]}>
                        CERTIFIED_CLAIM: {selectedPurchase?.starClaimCode || selectedPurchase?.code || selectedStar.starClaimCode}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.selectionActions}>
                  <ActionButton icon="target" onPress={handleCenterOnSelected} color={THEME.colors.primary} />
                  <ActionButton icon="rocket-launch-outline" onPress={() => router.push({ pathname: '/(tabs)/explore/starvoyage', params: { target: JSON.stringify(createStarTargetFromStar(selectedStar)) } })} color={THEME.colors.purple} />
                  <ActionButton icon="information-variant" onPress={() => setPopupVisible(true)} color="#fff" />
                  <ActionButton icon="close-circle-outline" onPress={() => setSelectedStar(null)} color="rgba(255,255,255,0.4)" />
                </View>
                {/* Panel Corners */}
                <View style={[styles.panelCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary }]} />
                <View style={[styles.panelCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.secondary }]} />
              </View>
            )}
          </View>

          <SkyLiveChrome
            surfaceAvailable={!loading && !mapError && stars.length > 0}
            cardinal={cardinal}
            previousCardinal={cardinalDirections[(cardinalDirections.indexOf(cardinal) + 7) % 8]}
            nextCardinal={cardinalDirections[(cardinalDirections.indexOf(cardinal) + 1) % 8]}
            azimuth={displayAzimuth}
            altitude={displayAltitude}
            observer={observer}
            now={now}
            selectedStar={selectedStar}
            selectedStarOwned={selectedStarOwned}
            selectedHorizontal={selectedHorizontal}
            showConstellations={showConstellations}
            showDeepSpace={showDSOs || showNebula}
            mode={mode}
            coordinateMode={coordinateMode}
            searchQuery={searchQuery}
            searchResults={searchResults}
            nightVision={nightVision}
            onExit={() => router.replace('/(tabs)/claim')}
            onSearch={handleSearch}
            onSelectSearchResult={navigateToObject}
            onOpenSettings={() => setLayersVisible(true)}
            onToggleConstellations={() => { const next = !showConstellations; setShowConstellations(next); setShowConstellationLabels(next); }}
            onToggleDeepSpace={() => { const next = !(showDSOs || showNebula); setShowDSOs(next); setShowNebula(next); }}
            onCenter={selectedStar ? handleCenterOnSelected : activateRealSky}
            onManualMode={() => { setMode('manual'); setCoordinateMode('equatorial'); }}
            onSensorMode={activateRealSky}
            onCameraMode={enableCameraMode}
            onClearSelection={() => setSelectedStar(null)}
            onOpenDetails={() => setPopupVisible(true)}
            onVoyage={() => router.push({ pathname: '/(tabs)/explore/starvoyage', params: { target: JSON.stringify(createStarTargetFromStar(selectedStar)) } })}
          />

          {capabilityNotice && (
            <View style={styles.capabilityNotice} accessibilityRole="alert">
              <Ionicons name="information-circle-outline" size={19} color={THEME.colors.primary} />
              <View style={styles.capabilityNoticeCopy}>
                <Text style={styles.capabilityNoticeTitle}>{capabilityNotice.title}</Text>
                <Text style={styles.capabilityNoticeMessage}>{capabilityNotice.message}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Bilgilendirmeyi kapat"
                style={styles.capabilityNoticeClose}
                onPress={() => setCapabilityNotice(null)}
              >
                <Ionicons name="close" size={19} color="rgba(244,247,255,0.72)" />
              </TouchableOpacity>
            </View>
          )}
          
          <StarPopup visible={popupVisible} star={selectedStar} owned={selectedStarOwned} onClose={() => setPopupVisible(false)} onPurchase={() => { setPopupVisible(false); setPurchaseModalVisible(true); }} onProfile={handleViewOwnedStar} />
          <PurchaseModal visible={purchaseModalVisible} onClose={() => setPurchaseModalVisible(false)} star={selectedStar} onPurchaseSuccess={loadPurchases} />
          
          {/* LAYERS MODAL */}
          <Modal visible={layersVisible} transparent animationType="fade" onRequestClose={() => setLayersVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.layersBackdrop} onPress={() => setLayersVisible(false)}>
              <View style={[styles.layersPanel, nightVision && styles.layersPanelNight]}>
                <View style={styles.layersHeader}>
                  <Text style={[styles.layersTitle, nightVision && styles.nightText]}>GÖRÜNÜM AYARLARI</Text>
                  <TouchableOpacity onPress={() => setLayersVisible(false)}>
                    <Ionicons name="close" size={24} color={THEME.colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  <LayerToggle icon="weather-night" label="Gece Görüşü" active={nightVision} onPress={() => setNightVision(!nightVision)} nightVision={nightVision} />
                  <LayerToggle icon="image-filter-hdr" label="Nebula Katmanı" active={showNebula} onPress={() => setShowNebula(!showNebula)} nightVision={nightVision} />
                  <LayerToggle icon="format-line-spacing" label="Takımyıldızı Çizgileri" active={showConstellations} onPress={() => setShowConstellations(!showConstellations)} nightVision={nightVision} />
                  <LayerToggle icon="text-recognition" label="Takımyıldızı Adları" active={showConstellationLabels} onPress={() => setShowConstellationLabels(!showConstellationLabels)} nightVision={nightVision} />
                  <LayerToggle icon="border-all-variant" label="IAU Sınırları" active={showConstellationBoundaries} onPress={() => setShowConstellationBoundaries(!showConstellationBoundaries)} nightVision={nightVision} />
                  <LayerToggle icon="grid" label="Koordinat Izgarası" active={showGrid} onPress={() => setShowGrid(!showGrid)} nightVision={nightVision} />
                  <LayerToggle icon="format-text" label="Yıldız Etiketleri" active={showLabels} onPress={() => setShowLabels(!showLabels)} nightVision={nightVision} />
                  <LayerToggle icon="planet-outline" label="Güneş Sistemi" active={showPlanets} onPress={() => setShowPlanets(!showPlanets)} nightVision={nightVision} />
                  <LayerToggle icon="flare" label="Derin Uzay Nesneleri" active={showDSOs} onPress={() => setShowDSOs(!showDSOs)} nightVision={nightVision} />
                  <LayerToggle icon="auto-fix" label="Mitoloji Katmanı" active={showMythology} onPress={() => setShowMythology(!showMythology)} nightVision={nightVision} />
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* CALIBRATION MODAL */}
          <Modal visible={calibrationVisible && mode === 'camera'} transparent animationType="fade" onRequestClose={() => setCalibrationVisible(false)}>
            <View style={styles.calibrationBackdrop}>
              <View style={styles.calibrationPanel}>
                <View style={styles.calibrationIcon}>
                  <MaterialCommunityIcons name="compass-outline" size={48} color={THEME.colors.primary} />
                </View>
                <Text style={styles.calibrationTitle}>SENSÖR KALİBRASYONU</Text>
                <Text style={styles.calibrationBody}>
                  Telefonu metal nesnelerden uzak tutup havada sekiz çizerek pusulayı kalibre edin.
                </Text>
                <View style={styles.accuracyRow}>
                  {[1, 2, 3].map((level) => (
                    <View key={level} style={[styles.accuracySegment, headingAccuracy >= level && { backgroundColor: THEME.colors.primary }]} />
                  ))}
                </View>
                <TouchableOpacity style={styles.calibrationClose} onPress={() => setCalibrationVisible(false)}>
                  <Text style={styles.calibrationCloseText}>
                    {headingAccuracy >= 2 ? 'DEVAM ET' : 'ŞİMDİLİK GEÇ'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ModeButton({ icon, active, onPress, color = '#fff' }) {
  return (
    <TouchableOpacity 
      style={[styles.modeButton, active && { backgroundColor: THEME.colors.primary + '25', borderColor: THEME.colors.primary, borderWidth: 1 }]} 
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={20} color={active ? THEME.colors.primary : color} />
    </TouchableOpacity>
  );
}

function ActionButton({ icon, onPress, color }) {
  return (
    <TouchableOpacity style={styles.selectionIconButton} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </TouchableOpacity>
  );
}

function LayerToggle({ icon, label, active, onPress, nightVision }) {
  const accent = nightVision ? '#FF4A42' : THEME.colors.primary;
  return (
    <TouchableOpacity style={styles.layerRow} onPress={onPress}>
      <View style={styles.layerIdentity}>
        <MaterialCommunityIcons name={icon} size={20} color={active ? accent : 'rgba(255,255,255,0.4)'} />
        <Text style={[styles.layerLabel, nightVision && styles.nightText]}>{label}</Text>
      </View>
      <View style={[styles.layerSwitch, active && { borderColor: accent, backgroundColor: `${accent}20` }]}>
        <View style={[styles.layerSwitchKnob, active && { backgroundColor: accent, transform: [{ translateX: 16 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { ...StyleSheet.absoluteFillObject },
  hudOverlay: { display: 'none' },
  hudCorner: { position: 'absolute', width: 30, height: 30 },
  overlay: { flex: 1 },
  headerRow: {
    display: 'none',
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    gap: 16,
    zIndex: 20 
  },
  glassBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'rgba(25, 25, 35, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)'
  },
  searchWidget: { flex: 1, position: 'relative' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(25, 25, 35, 0.7)', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 242, 254, 0.3)' 
  },
  searchInput: { 
    flex: 1, 
    color: '#fff', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    fontSize: 14, 
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' 
  },
  searchResults: { 
    position: 'absolute', 
    top: 56, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(10, 10, 20, 0.98)', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 242, 254, 0.3)', 
    overflow: 'hidden',
    zIndex: 100 
  },
  searchResultItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.05)' 
  },
  searchResultText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  rightControls: { flexDirection: 'row', gap: 12 },
  modeToggleGroup: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(25, 25, 35, 0.7)', 
    borderRadius: 12, 
    padding: 4, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 242, 254, 0.3)' 
  },
  modeButton: { padding: 10, borderRadius: 8, marginHorizontal: 2 },
  leftColumn: { display: 'none' },
  telemetryBox: { 
    backgroundColor: 'rgba(25, 25, 35, 0.6)', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  telemetryLabel: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  telemetryValue: { color: '#fff', fontSize: 10, fontWeight: '900', fontFamily: 'monospace', marginBottom: 8 },
  telemetrySeparator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
  rightColumn: { display: 'none' },
  toolBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'rgba(25, 25, 35, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  mapContainer: { flex: 1, backgroundColor: '#02040A' },
  mapStatus: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, backgroundColor: '#02040A' },
  mapStatusText: { marginTop: 18, color: THEME.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  mapErrorTitle: { marginTop: 18, color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  mapErrorMessage: { marginTop: 10, maxWidth: 420, color: THEME.colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  mapRetryButton: { marginTop: 22, minHeight: 48, paddingHorizontal: 24, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: THEME.colors.primary },
  mapRetryText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  capabilityNotice: { position: 'absolute', zIndex: 80, top: 68, left: '50%', width: 430, marginLeft: -215, minHeight: 66, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(3,7,14,0.96)', borderWidth: 1, borderColor: 'rgba(119,191,255,0.38)' },
  capabilityNoticeCopy: { flex: 1 },
  capabilityNoticeTitle: { color: '#F4F7FF', fontSize: 12, fontWeight: '800' },
  capabilityNoticeMessage: { color: 'rgba(244,247,255,0.68)', fontSize: 10, lineHeight: 14, marginTop: 3 },
  capabilityNoticeClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  nightFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(90,0,0,0.12)', zIndex: 2 },
  selectionPanel: {
    display: 'none',
    position: 'absolute', 
    left: 24, 
    right: 24, 
    bottom: 24, 
    zIndex: 10, 
    backgroundColor: 'rgba(25, 25, 35, 0.9)', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 242, 254, 0.3)', 
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectionPanelNight: { backgroundColor: 'rgba(15, 0, 0, 0.95)', borderColor: '#FF4A42' },
  selectionIdentity: { flex: 1 },
  selectionName: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  selectionMeta: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
  ownedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  selectionOwned: { color: THEME.colors.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  selectionActions: { flexDirection: 'row', gap: 8 },
  selectionIconButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  panelCorner: { position: 'absolute', width: 12, height: 12 },
  nightText: { color: '#FF4A42' },
  nightTextMuted: { color: 'rgba(255,74,66,0.6)' },
  layersBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  layersPanel: { 
    width: '100%', 
    maxWidth: 400, 
    backgroundColor: 'rgba(25, 25, 35, 0.95)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 242, 254, 0.3)', 
    padding: 24 
  },
  layersPanelNight: { backgroundColor: '#100000', borderColor: '#FF4A42' },
  layersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  layersTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  layerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  layerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  layerLabel: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  layerSwitch: { width: 40, height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 3 },
  layerSwitchKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.4)' },
  calibrationBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  calibrationPanel: { 
    width: '100%', 
    maxWidth: 360, 
    backgroundColor: 'rgba(25, 25, 35, 0.95)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: THEME.colors.primary, 
    padding: 32, 
    alignItems: 'center' 
  },
  calibrationIcon: { marginBottom: 24, shadowColor: THEME.colors.primary, shadowOpacity: 0.8, shadowRadius: 20 },
  calibrationTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  calibrationBody: { color: THEME.colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 32 },
  accuracyRow: { flexDirection: 'row', gap: 8, marginBottom: 32, width: '100%' },
  accuracySegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  calibrationClose: { backgroundColor: THEME.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  calibrationCloseText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 2 }
});
