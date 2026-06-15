import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StarSystem3D from '../../../components/StarSystem3D';
import { ensureStarData } from '../../../src/data/starLoader';
import { resolveStarTarget } from '../../../src/utils/starIdentity';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function StarVoyage3D() {
  const [stars, setStars] = useState([]);
  const [targetStar, setTargetStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arrivalVisible, setArrivalVisible] = useState(false);
  const [ownershipData, setOwnershipData] = useState(null);
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    ensureStarData().then((list) => {
      setStars(list);
      if (params.starId || params.hip || params.hd || params.starClaimCode || params.name) {
        const found = resolveStarTarget(list, params);
        if (found) {
          setTargetStar(found);
          checkOwnership(found);
        }
      }
      setLoading(false);
    });
  }, [params.starId, params.hip, params.hd, params.starClaimCode, params.name]);

  const checkOwnership = async (star) => {
    try {
      const raw = await AsyncStorage.getItem('@purchases');
      const list = raw ? JSON.parse(raw) : [];
      const found = list.find(p => p.starId === star.id || p.hip === star.hip || p.starClaimCode === star.starClaimCode);
      if (found) setOwnershipData(found);
    } catch (e) { console.warn('Ownership check error', e); }
  };

  const handleArrival = (star) => {
    if (star) setArrivalVisible(true);
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
            <Text style={styles.title}>{targetStar ? (targetStar.properName || targetStar.proper || `HIP ${targetStar.hip}`).toUpperCase() : 'STAR_VOYAGE_3D'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: targetStar ? THEME.colors.primary : THEME.colors.purple }]} />
              <Text style={styles.subtitle}>{targetStar ? 'TARGET_LOCKED' : 'HYPER_SPACE_EXPLORATION'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.viewport}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>CALIBRATING_QUANTUM_VIEW...</Text>
            </View>
          ) : (
            <StarSystem3D stars={stars.slice(0, 2000)} targetStar={targetStar} onArrival={handleArrival} />
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
                    <TelemetryItem label="DISTANCE" value={`${Number(targetStar.dist || targetStar.distanceParsec).toFixed(2)} LY`} color={THEME.colors.primary} />
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
  titleContainer: { flex: 1 },
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
  panelCorner: { position: 'absolute', width: 12, height: 12 }
});
