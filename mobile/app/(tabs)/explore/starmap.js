import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguagePicker from '../../../components/LanguagePicker';
import StarCanvas from '../../../components/StarCanvas';
import StarPopup from '../../../components/StarPopup';
import MyStarsOverlay from '../../../components/MyStarsOverlay';
import PurchaseModal from '../../../components/PurchaseModal';
import { ensureStarData } from '../../../src/data/starLoader';
import { ensureConstellations } from '../../../src/data/constellationLoader';
import { normalizeAngle } from '../../../src/utils/astronomy';

const screen = Dimensions.get('window');

export default function StarMapScreen() {
  const [stars, setStars] = useState([]);
  const [selectedStar, setSelectedStar] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [mode, setMode] = useState('manual');
  const [cameraPermission, setCameraPermission] = useState(false);
  const [centerRa, setCenterRa] = useState(180);
  const [centerDec, setCenterDec] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [heading, setHeading] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConstellations, setShowConstellations] = useState(false);
  const [constellations, setConstellations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);

  useEffect(() => {
    ensureStarData().then((list) => { setStars(list); setLoading(false); });
    Camera.requestCameraPermissionsAsync().then((status) => setCameraPermission(status.granted));
    ensureConstellations().then((data) => setConstellations(data)).catch(() => setConstellations([]));
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const raw = await AsyncStorage.getItem('@purchases');
      const list = raw ? JSON.parse(raw) : [];
      setPurchases(list);
    } catch (error) {
      console.warn('Purchase load error', error);
    }
  };

  useEffect(() => {
    const magSub = Magnetometer.addListener((data) => {
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      setHeading(normalizeAngle(90 - angle));
    });
    const accSub = Accelerometer.addListener((data) => {
      const pitch = -Math.atan2(data.z, data.y) * (180 / Math.PI);
      setTilt(Math.max(-90, Math.min(90, pitch)));
    });
    Magnetometer.setUpdateInterval(100);
    Accelerometer.setUpdateInterval(100);
    return () => { magSub.remove(); accSub.remove(); };
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      setCenterRa(heading);
      setCenterDec(tilt * 0.6);
    }
  }, [mode, heading, tilt]);

  const selectedStarOwned = selectedStar && purchases.some((item) => item.starId === selectedStar.id || item.starId === selectedStar.hip || item.name === selectedStar.proper);
  const ownedStarIds = purchases.map((item) => item.starId).filter((id) => id != null);

  const handleViewOwnedStar = () => {
    if (selectedStar) {
      setMode('manual');
      setCenterRa(selectedStar.ra);
      setCenterDec(selectedStar.dec);
    }
    setPopupVisible(false);
  };

  const handlePurchaseSuccess = (newPurchase) => {
    setPurchases((current) => [newPurchase, ...current]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {mode === 'camera' && cameraPermission ? (
        <Camera style={styles.camera} type={Camera.Constants.Type.back} ratio="16:9" />
      ) : null}
      {!cameraPermission && mode === 'camera' ? (
        <View style={styles.permissionFallback}><Text style={styles.permissionText}>Kamera izni gerekli</Text></View>
      ) : null}
      <View style={styles.overlay} pointerEvents="box-none">
        <LanguagePicker style={styles.lang} />
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.modeButton, mode==='manual' && styles.modeActive]} onPress={() => setMode('manual')}><Text style={styles.modeText}>Manuel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, mode==='camera' && styles.modeActive]} onPress={() => setMode('camera')}><Text style={styles.modeText}>Kamera</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, showConstellations && styles.modeActive]} onPress={() => setShowConstellations((prev) => !prev)}>
            <Text style={styles.modeText}>{showConstellations ? 'Gösterme' : 'Takımyıldızları'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statusBar}><Text style={styles.statusText}>{mode === 'camera' ? `Heading ${Math.round(heading)}° • Tilt ${Math.round(tilt)}°` : `Ra ${centerRa.toFixed(1)}° • Dec ${centerDec.toFixed(1)}° • Zoom ${zoom.toFixed(1)}`}</Text></View>
        <View style={styles.mapContainer}>
          {loading ? <ActivityIndicator color="#C9A84C" size="large" /> : (
            <StarCanvas
              stars={stars}
              centerRa={centerRa}
              centerDec={centerDec}
              zoom={zoom}
              showConstellations={showConstellations}
              constellations={constellations}
              onCenterChange={({ ra, dec }) => { setMode('manual'); setCenterRa(normalizeAngle(ra)); setCenterDec(Math.max(-90, Math.min(90, dec))); }}
              onZoomChange={setZoom}
              onSelect={(star) => { setSelectedStar(star); setPopupVisible(true); }}
              ownedStarIds={ownedStarIds}
            />
          )}
          <MyStarsOverlay stars={stars} onSelectStar={(item) => { const found = stars.find((star) => star.proper.toLowerCase() === item.name.toLowerCase()); if (found) { setCenterRa(found.ra); setCenterDec(found.dec); setMode('manual'); } }} />
        </View>
        <StarPopup visible={popupVisible} star={selectedStar} owned={selectedStarOwned} onClose={() => setPopupVisible(false)} onPurchase={() => { setPopupVisible(false); setPurchaseModalVisible(true); }} onProfile={handleViewOwnedStar} />
        <PurchaseModal visible={purchaseModalVisible} onClose={() => setPurchaseModalVisible(false)} star={selectedStar} onPurchaseSuccess={handlePurchaseSuccess} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  lang: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'center', padding: 12, zIndex: 10 },
  modeButton: { paddingVertical: 10, paddingHorizontal: 18, marginHorizontal: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  modeActive: { backgroundColor: 'rgba(201,168,76,0.95)' },
  modeText: { color: '#fff', fontWeight: '700' },
  statusBar: { alignItems: 'center', paddingVertical: 6 },
  statusText: { color: '#EDEDED', fontSize: 12 },
  mapContainer: { flex: 1, marginTop: 12 },
  permissionFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  permissionText: { color: '#fff' }
});
