import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StarCanvas from '../../../components/StarCanvas';
import StarPopup from '../../../components/StarPopup';
import PurchaseModal from '../../../components/PurchaseModal';
import { ensureStarData } from '../../../src/data/starLoader';
import { ensureConstellations } from '../../../src/data/constellationLoader';
import {
  getStarDecDegrees,
  getStarRaDegrees,
  normalizeAngle,
} from '../../../src/utils/astronomy';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { getPlanetPositions } from '../../../src/utils/solarSystem';
import { DSO_CATALOG } from '../../../src/data/dsoData';

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
  const [showLabels, setShowLabels] = useState(false);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showDSOs, setShowDSOs] = useState(true);
  const [constellations, setConstellations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [showMythology, setShowMythology] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    ensureStarData().then((list) => { 
      setStars(list); 
      setLoading(false); 
      
      if (params.starId) {
        const found = list.find(s => s.id === params.starId || s.hip === params.starId);
        if (found) {
          setCenterRa(getStarRaDegrees(found));
          setCenterDec(getStarDecDegrees(found));
          setZoom(4);
          setSelectedStar(found);
        }
      }
    });
    ensureConstellations().then((data) => setConstellations(data)).catch(() => setConstellations([]));
    loadPurchases();
  }, [params.starId]);

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
      .filter((star) => {
        const terms = [
          star.proper,
          star.properName,
          star.hip && `hip ${star.hip}`,
          star.hd && `hd ${star.hd}`,
          star.id,
          star.starClaimCode,
        ].filter(Boolean);
        return terms.some((term) => String(term).toLowerCase().includes(lower));
      })
      .slice(0, 8);
    setSearchResults([...planetResults, ...dsoResults, ...starResults]);
  };

  const navigateToObject = (obj) => {
    setMode('manual');
    setCenterRa(getStarRaDegrees(obj));
    setCenterDec(getStarDecDegrees(obj));
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

  const lastHeading = React.useRef(0);
  const lastTilt = React.useRef(0);
  const ALPHA = 0.15;

  useEffect(() => {
    if (mode !== 'camera') return undefined;

    const magSub = Magnetometer.addListener((data) => {
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      const newHeading = normalizeAngle(90 - angle);
      let diff = newHeading - lastHeading.current;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const filteredHeading = normalizeAngle(lastHeading.current + diff * ALPHA);
      lastHeading.current = filteredHeading;
      setHeading(filteredHeading);
    });
    const accSub = Accelerometer.addListener((data) => {
      const pitch = -Math.atan2(data.z, data.y) * (180 / Math.PI);
      const newTilt = Math.max(-90, Math.min(90, pitch));
      const filteredTilt = lastTilt.current + (newTilt - lastTilt.current) * ALPHA;
      lastTilt.current = filteredTilt;
      setTilt(filteredTilt);
    });
    Magnetometer.setUpdateInterval(40);
    Accelerometer.setUpdateInterval(40);
    return () => { magSub.remove(); accSub.remove(); };
  }, [mode]);

  useEffect(() => {
    if (mode === 'camera') {
      setCenterRa(heading);
      setCenterDec(tilt * 0.6);
    }
  }, [mode, heading, tilt]);

  const selectedStarOwned = selectedStar && purchases.some((item) => item.starId === selectedStar.id || item.starId === selectedStar.hip || item.name === selectedStar.proper);
  const ownedStarIds = useMemo(
    () => purchases.map((item) => item.starId).filter((id) => id != null),
    [purchases],
  );

  const handleViewOwnedStar = () => {
    if (selectedStar) {
      setMode('manual');
      setCenterRa(getStarRaDegrees(selectedStar));
      setCenterDec(getStarDecDegrees(selectedStar));
    }
    setPopupVisible(false);
  };

  const handleCenterOnSelected = () => {
    if (selectedStar) {
      setMode('manual');
      setCenterRa(getStarRaDegrees(selectedStar));
      setCenterDec(getStarDecDegrees(selectedStar));
    }
  };

  const enableCameraMode = async () => {
    if (cameraPermission === true) {
      setMode('camera');
      return;
    }

    const status = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status.granted);
    if (status.granted) {
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
          </View>

          <View style={styles.controlGroup}>
            <TouchableOpacity style={[styles.modeButton, showConstellations && styles.modeActive]} onPress={() => setShowConstellations(!showConstellations)}>
              <Ionicons name="git-merge-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeButton, showLabels && styles.modeActive]} onPress={() => setShowLabels(!showLabels)}>
              <Ionicons name="text-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {loading ? <ActivityIndicator color={THEME.colors.primary} size="large" /> : (
            <StarCanvas
              stars={stars}
              selectedStar={selectedStar}
              centerRa={centerRa}
              centerDec={centerDec}
              zoom={zoom}
              showConstellations={showConstellations}
              showLabels={showLabels}
              showPlanets={showPlanets}
              showDSOs={showDSOs}
              constellations={constellations}
              showMythology={showMythology}
              onCenterChange={({ ra, dec }) => { setMode('manual'); setCenterRa(normalizeAngle(ra)); setCenterDec(Math.max(-90, Math.min(90, dec))); }}
              onZoomChange={setZoom}
              onSelect={(star) => { setSelectedStar(star); setPopupVisible(true); }}
              ownedStarIds={ownedStarIds}
            />
          )}

          {selectedStar && (
            <TouchableOpacity style={styles.focusBtn} onPress={handleCenterOnSelected}>
              <Ionicons name="locate" size={24} color={THEME.colors.primary} />
              <Text style={styles.focusBtnText}>ODAKLAN</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <StarPopup visible={popupVisible} star={selectedStar} owned={selectedStarOwned} onClose={() => setPopupVisible(false)} onPurchase={() => { setPopupVisible(false); setPurchaseModalVisible(true); }} onProfile={handleViewOwnedStar} />
        <PurchaseModal visible={purchaseModalVisible} onClose={() => setPurchaseModalVisible(false)} star={selectedStar} onPurchaseSuccess={loadPurchases} />
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
  mapContainer: { flex: 1 },
  focusBtn: { position: 'absolute', bottom: 100, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: THEME.colors.primary },
  focusBtnText: { color: THEME.colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  searchContainer: { position: 'absolute', top: 100, left: 20, right: 20, zIndex: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  searchResults: { backgroundColor: 'rgba(5,10,26,0.95)', borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchResultText: { color: '#fff', fontSize: 13, fontWeight: '600' }
});
