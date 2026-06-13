import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StarSystem3D from '../../../components/StarSystem3D';
import { ensureStarData } from '../../../src/data/starLoader';
import { resolveStarTarget } from '../../../src/utils/starIdentity';
import { Ionicons } from '@expo/vector-icons';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{targetStar ? (targetStar.properName || targetStar.proper || `HIP ${targetStar.hip}`).toUpperCase() : 'STAR_VOYAGE_3D'}</Text>
          <Text style={styles.subtitle}>{targetStar ? 'TARGET_LOCKED' : 'HYPER_SPACE_EXPLORATION'}</Text>
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
              colors={['rgba(0,0,0,0)', 'rgba(0,10,25,0.95)', 'rgba(0,5,15,1)']}
              style={styles.arrivalPanel}
            >
              <View style={styles.panelHeader}>
                <Ionicons name="shield-checkmark" size={20} color={THEME.colors.accent} />
                <Text style={styles.panelTitle}>PROXIMITY_ESTABLISHED</Text>
                <TouchableOpacity onPress={() => setArrivalVisible(false)}>
                  <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              <View style={styles.telemetryGrid}>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telLabel}>DISTANCE</Text>
                  <Text style={styles.telValue}>{Number(targetStar.dist || targetStar.distanceParsec).toFixed(2)} LY</Text>
                </View>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telLabel}>MAGNITUDE</Text>
                  <Text style={styles.telValue}>{Number(targetStar.mag).toFixed(2)}</Text>
                </View>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telLabel}>SPECTRUM</Text>
                  <Text style={styles.telValue}>{targetStar.spect || targetStar.spectralType || 'N/A'}</Text>
                </View>
              </View>

              {ownershipData ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageLabel}>EBEDİ MESAJ // {ownershipData.starClaimCode || 'CERTIFIED'}</Text>
                  <Text style={styles.messageText}>"{ownershipData.message || 'Bu yıldız insanlık adına mühürlenmiştir.'}"</Text>
                  <View style={styles.signatureRow}>
                    <Text style={styles.signatureLabel}>OWNER_SIG:</Text>
                    <Text style={styles.signatureValue}>BLOCKCHAIN_VERIFIED</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.unownedBox}>
                  <Text style={styles.unownedText}>BU YILDIZ HENÜZ SAHİPLENİLMEMİŞTİR.</Text>
                  <TouchableOpacity style={styles.claimBtn} onPress={() => router.push({ pathname: '/(tabs)/explore/stardetail', params: { starId: targetStar.id } })}>
                    <Text style={styles.claimBtnText}>MÜHÜRLE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>GYROSCOPE_STABILIZED // 3D_RENDER_ENGINE_v2.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    position: 'absolute', 
    top: 50, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    gap: 15
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  viewport: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: THEME.colors.primary, fontSize: 10, fontWeight: 'bold', marginTop: 20, letterSpacing: 2 },
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 0, 
    right: 0, 
    alignItems: 'center' 
  },
  footerText: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: 'bold', letterSpacing: 1 },
  arrivalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 20 },
  arrivalPanel: { padding: 30, paddingBottom: 60, borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.3)' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  panelTitle: { color: THEME.colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 2, flex: 1, marginLeft: 10 },
  telemetryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  telemetryItem: { flex: 1 },
  telLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  telValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  messageBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  messageLabel: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  messageText: { color: '#fff', fontSize: 16, lineHeight: 24, fontStyle: 'italic', marginBottom: 20 },
  signatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.6 },
  signatureLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: 'bold' },
  signatureValue: { color: THEME.colors.accent, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  unownedBox: { alignItems: 'center', paddingVertical: 10 },
  unownedText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', marginBottom: 15 },
  claimBtn: { paddingVertical: 12, paddingHorizontal: 30, backgroundColor: THEME.colors.primary, borderRadius: 6 },
  claimBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 2 }
});
