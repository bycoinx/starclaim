import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import SpaceBackground from '../../../components/SpaceBackground';
import { THEME } from '../../../constants/Theme';
import { CONFIG } from '../../../constants/Config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DiscoveryScreen() {
  const [featuredStars, setFeaturedStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.API_URL}/api/stars?limit=5&tier=supernova`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setFeaturedStars(data);
    } catch (e) {
      console.warn('Featured stars fetch failed, using mock data');
      setFeaturedStars([
        { id: 'HIP123', name: 'Sirius', tier: 'Supernova', price: 500, spect: 'A1V' },
        { id: 'HIP456', name: 'Canopus', tier: 'Supernova', price: 450, spect: 'F0II' },
        { id: 'HIP789', name: 'Rigel', tier: 'Supernova', price: 600, spect: 'B8Ia' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>KEŞFET</Text>
          <Text style={styles.subtitle}>EVRENİN DERİNLİKLERİ</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ÖNE ÇIKAN YILDIZLAR</Text>
            <TouchableOpacity onPress={() => router.push('/stars')}>
              <Text style={styles.viewAll}>TÜMÜNÜ GÖR</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
            {loading ? (
              <ActivityIndicator color={THEME.colors.primary} style={{ marginLeft: 20 }} />
            ) : featuredStars.map(star => (
              <TouchableOpacity 
                key={star.id} 
                style={styles.starCard}
                onPress={() => router.push({ pathname: '/(tabs)/explore/stardetail', params: { starId: star.id, name: star.name } })}
              >
                <LinearGradient 
                  colors={['rgba(0, 204, 255, 0.15)', 'transparent']}
                  style={styles.starGradient}
                >
                  <Ionicons name="star" size={32} color={THEME.colors.secondary} style={styles.starIcon} />
                  <Text style={styles.starName}>{star.name}</Text>
                  <Text style={styles.starTier}>{star.tier.toUpperCase()}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.starPrice}>${star.price}</Text>
                    <Ionicons name="chevron-forward" size={14} color={THEME.colors.primary} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KATEGORİLER</Text>
          <View style={styles.categoryGrid}>
            <CategoryCard 
              title="Katalog" 
              icon="telescope-outline" 
              onPress={() => router.push('/stars')} 
              color="#4A90E2"
            />
            <CategoryCard 
              title="Harita" 
              icon="map-outline" 
              onPress={() => router.push('/(tabs)/explore/starmap')} 
              color="#50E3C2"
            />
            <CategoryCard 
              title="Pazar" 
              icon="stats-chart-outline" 
              onPress={() => router.push('/marketplace')} 
              color="#F5A623"
            />
            <CategoryCard 
              title="Vault" 
              icon="lock-closed-outline" 
              onPress={() => router.push('/(tabs)/vault/home')} 
              color="#B8E986"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.arBanner} onPress={() => router.push('/stars')}>
          <LinearGradient 
            colors={['rgba(0, 204, 255, 0.2)', 'rgba(0, 0, 0, 0.4)']}
            style={styles.arGradient}
          >
            <View style={styles.arContent}>
              <View style={styles.arTextSide}>
                <Text style={styles.arTitle}>GÖKYÜZÜNE DOKUN</Text>
                <Text style={styles.arDesc}>AR modu ile kameranı gökyüzüne tut ve yıldızları anında tanı.</Text>
              </View>
              <View style={styles.arIconCircle}>
                <Ionicons name="camera" size={32} color="#000" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryCard({ title, icon, onPress, color }) {
  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
      <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.categoryName}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingBottom: 40 },
  header: { padding: 24, alignItems: 'center', marginTop: 10 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  subtitle: { fontSize: 10, color: THEME.colors.primary, fontWeight: '700', letterSpacing: 2, opacity: 0.8 },
  section: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 10, color: THEME.colors.textMuted, fontWeight: '900', letterSpacing: 2 },
  viewAll: { fontSize: 10, color: THEME.colors.primary, fontWeight: 'bold' },
  featuredList: { flexDirection: 'row', paddingLeft: 0 },
  starCard: {
    borderRadius: 24,
    marginRight: 16,
    width: 180,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  starGradient: { padding: 20 },
  starIcon: { marginBottom: 15, opacity: 0.8 },
  starName: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  starTier: { color: THEME.colors.secondary, fontSize: 9, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starPrice: { color: THEME.colors.primary, fontSize: 18, fontWeight: '900' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  categoryName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  arBanner: { margin: 20, marginTop: 40, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: THEME.colors.primary + '40' },
  arGradient: { padding: 24 },
  arContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  arTextSide: { flex: 1 },
  arTitle: { color: THEME.colors.primary, fontSize: 20, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  arDesc: { color: '#fff', fontSize: 12, lineHeight: 18, opacity: 0.7 },
  arIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center' }
});

