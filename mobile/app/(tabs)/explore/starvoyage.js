import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import StarSystem3D from '../../../components/StarSystem3D';
import { ensureStarData } from '../../../src/data/starLoader';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';

export default function StarVoyage3D() {
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    ensureStarData().then((list) => {
      setStars(list);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>STAR_VOYAGE_3D</Text>
          <Text style={styles.subtitle}>HYPER_SPACE_EXPLORATION</Text>
        </View>
      </View>

      <View style={styles.viewport}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>CALIBRATING_QUANTUM_VIEW...</Text>
          </View>
        ) : (
          <StarSystem3D stars={stars.slice(0, 1500)} />
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
  footerText: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: 'bold', letterSpacing: 1 }
});
