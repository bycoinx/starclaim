import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const router = useRouter();

  // Task 6.5.1: Fetch real stars from backend
  useEffect(() => {
    fetch(`${CONFIG.API_URL}/api/stars?limit=100&sort=price_desc`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        return res.json();
      })
      .then(data => {
        // Map backend RA/Dec to simple Az/Alt for AR demo
        // In a real app, this requires complex astronomical calculations
        const mapped = data.map((s, idx) => ({
          ...s,
          az: (idx * 35) % 360, // Mock spread for demo
          alt: 10 + (idx * 5) % 60,
        }));
        setStars(mapped);
      })
      .catch(err => {
        console.error("Star fetch failed", err);
        Alert.alert("HATA", "Yıldız verileri yüklenemedi. (Sunucu bağlantısı kurulamadı)");
      })
      .finally(() => setLoading(false));
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

  const renderAROverlay = () => {
    if (!motion || !motion.rotation || loading) return null;

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
              <Text style={styles.lockOnSub}>{star.tier.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
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

          {renderAROverlay()}
          
          {/* TOP CONTROLS */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.telemetryGroup}>
              <Text style={styles.telemetryLabel}>AZ: {Math.round((motion?.rotation?.alpha || 0) * 180 / Math.PI)}°</Text>
              <Text style={styles.telemetryLabel}>ALT: {Math.round((motion?.rotation?.beta || 0) * 180 / Math.PI)}°</Text>
            </View>
            <View style={styles.statusGroup}>
               <View style={styles.statusDot} />
               <Text style={styles.statusText}>AEGIS_SCAN_ACTIVE</Text>
            </View>
          </View>

          {/* STAR INFO MODAL (If selected) */}
          {selectedStar && (
            <View style={styles.detailPanel}>
              <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(0, 20, 40, 0.9)']}
                style={styles.detailContent}
              >
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailTier}>{selectedStar.tier.toUpperCase()}</Text>
                    <Text style={styles.detailName}>{selectedStar.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedStar(null)}>
                    <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailStats}>
                   <View style={styles.statBox}>
                      <Text style={styles.statLabel}>COORDS_RA</Text>
                      <Text style={styles.statValue}>{selectedStar.ra || '00H 00M'}</Text>
                   </View>
                   <View style={styles.statBox}>
                      <Text style={styles.statLabel}>PRICE_USD</Text>
                      <Text style={styles.statValue}>${selectedStar.price}</Text>
                   </View>
                </View>

                <TouchableOpacity style={styles.claimBtn}>
                   <Text style={styles.claimBtnText}>INITIATE_CLAIM_PROTOCOL</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>SYNCING_WITH_CATALOG...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { color: THEME.colors.primary, marginTop: 10, fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  telemetryGroup: { flexDirection: 'row', gap: 15 },
  telemetryLabel: { color: THEME.colors.primary, fontSize: 10, fontWeight: 'bold', fontFamily: 'System' },
  statusGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.accent },
  statusText: { color: '#fff', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  
  hudOverlay: { ...StyleSheet.absoluteFillObject },
  hudCorner: { position: 'absolute', width: 40, height: 40, borderColor: 'rgba(0, 204, 255, 0.4)', borderWidth: 1 },
  hudTopL: { top: 40, left: 40, borderBottomWidth: 0, borderRightWidth: 0 },
  hudTopR: { top: 40, right: 40, borderBottomWidth: 0, borderLeftWidth: 0 },
  hudBottomL: { bottom: 40, left: 40, borderTopWidth: 0, borderRightWidth: 0 },
  hudBottomR: { bottom: 40, right: 40, borderTopWidth: 0, borderLeftWidth: 0 },
  centerCrosshair: { 
    position: 'absolute', 
    top: '50%', left: '50%', 
    width: 20, height: 20, 
    marginLeft: -10, marginTop: -10,
    borderWidth: 1, borderColor: 'rgba(0, 204, 255, 0.2)', borderRadius: 10
  },

  starContainer: { position: 'absolute', alignItems: 'center', width: 60, height: 60, marginLeft: -30, marginTop: -30 },
  starReticle: { width: 30, height: 30, borderWidth: 1, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  starCore: { width: 4, height: 4, borderRadius: 2 },
  lockOnLabel: { marginTop: 5, alignItems: 'center' },
  lockOnText: { color: THEME.colors.secondary, fontSize: 12, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4 },
  lockOnSub: { color: '#fff', fontSize: 8, fontWeight: 'bold', opacity: 0.8 },

  detailPanel: { position: 'absolute', right: 40, top: 80, bottom: 40, width: 300 },
  detailContent: { flex: 1, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailTier: { color: THEME.colors.secondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  detailName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  detailStats: { gap: 15, marginBottom: 30 },
  statBox: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', pb: 5 },
  statLabel: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  statValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  claimBtn: { backgroundColor: THEME.colors.primary, paddingVertical: 15, borderRadius: 5, alignItems: 'center' },
  claimBtnText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: THEME.colors.primary, padding: 15, borderRadius: 10 },
  buttonText: { color: '#000', fontWeight: 'bold' },
});
