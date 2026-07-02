import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/Theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SpaceBackground from '../components/SpaceBackground';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const mockItems = [
  { id: 1, name: 'Sirius A', price: 450, tier: 'Supernova', constellation: 'Canis Major' },
  { id: 2, name: 'Betelgeuse', price: 320, tier: 'Supernova', constellation: 'Orion' },
  { id: 3, name: 'Vega', price: 180, tier: 'Nova', constellation: 'Lyra' },
  { id: 4, name: 'Altair', price: 150, tier: 'Nova', constellation: 'Aquila' },
];

const actionItems = [
  { label: 'Trendler', icon: 'trending-up' },
  { label: 'Hızlı Filtre', icon: 'filter-variant' },
  { label: 'Favoriler', icon: 'heart' },
  { label: 'Yeni Ekle', icon: 'plus' },
];

export default function Marketplace() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = width - insets.left - insets.right - 48;
  const twoColumns = availableWidth >= 720;

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'transparent', 'rgba(0,0,0,0.98)']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.content} edges={['top', 'right', 'bottom', 'left']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={THEME.colors.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>STAR MARKET</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.subtitle}>PREMIUM EXCHANGE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/vault/home')}>
            <Ionicons name="lock-closed" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroPanel}>
            <View>
              <Text style={styles.heroBadge}>TOP MARKET</Text>
              <Text style={styles.heroTitle}>Nadir yıldızları keşfet ve koleksiyonunu zenginleştir.</Text>
              <Text style={styles.heroText}>StarClaim mobil pazaryeri, özel NFT tarzı yıldız tekliflerini premium bir vitrinle sunar.</Text>
            </View>
            <TouchableOpacity style={styles.heroAction}>
              <Text style={styles.heroActionText}>PAZARI GEZ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            {actionItems.map((item) => (
              <TouchableOpacity key={item.label} style={styles.tinyAction}>
                <MaterialCommunityIcons name={item.icon} size={18} color={THEME.colors.primary} />
                <Text style={styles.tinyActionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>24s Hacim</Text>
              <Text style={styles.statValue}>$2.4M</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pazar Değeri</Text>
              <Text style={styles.statValue}>$18.9M</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ortalama</Text>
              <Text style={styles.statValue}>$248</Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Premium Liste</Text>
              <Text style={styles.sectionBadge}>4 Ürün</Text>
            </View>
            <Text style={styles.sectionDesc}>En seçkin yıldız teklifler ve özel fırsatlar.</Text>
          </View>

          <View style={styles.grid}>
            {mockItems.map((item) => (
              <View key={item.id} style={[styles.cardWrapper, { width: twoColumns ? '50%' : '100%' }]}>
                <LinearGradient colors={['rgba(25,25,35,0.86)', 'rgba(8,10,18,0.9)']} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.tierText}>{item.tier.toUpperCase()}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>${item.price}</Text>
                    </View>
                  </View>
                  <Text style={styles.nameText}>{item.name.toUpperCase()}</Text>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="star-four-points" size={12} color={THEME.colors.textMuted} />
                    <Text style={styles.constellationText}>{item.constellation.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.cardNote}>Bu yıldız, koleksiyonunuzun parlaklığa en yakın parçasıdır.</Text>
                  <TouchableOpacity style={styles.buyBtn}>
                    <LinearGradient colors={[THEME.colors.primary, '#63b8ff']} style={styles.buyGradient}>
                      <Text style={styles.buyBtnText}>KAÇIRMAYIN</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.screenHud} pointerEvents="none">
        <View style={[styles.hudCorner, { top: 40, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.hudCorner, { top: 40, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />
        <View style={[styles.hudCorner, { bottom: 40, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.hudCorner, { bottom: 40, right: 20, borderBottomWidth: 1, borderRightWidth: 1 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  backBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(25,25,35,0.75)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(119,191,255,0.2)' },
  titleContainer: { flex: 1 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary },
  subtitle: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  actionBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 110 },
  heroPanel: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 24, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroBadge: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.7, marginBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 36, marginBottom: 12 },
  heroText: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 18 },
  heroAction: { backgroundColor: THEME.colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  heroActionText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginBottom: 18 },
  tinyAction: { width: '50%', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 12 },
  tinyActionText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statLabel: { color: THEME.colors.textMuted, fontSize: 9, letterSpacing: 1.6, marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  sectionBlock: { marginBottom: 14 },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  sectionBadge: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  sectionDesc: { color: THEME.colors.textMuted, fontSize: 11, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  cardWrapper: { padding: 8 },
  card: { borderRadius: 18, padding: 20, minHeight: 220, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tierText: { color: THEME.colors.secondary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  priceBadge: { backgroundColor: 'rgba(119,191,255,0.14)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  priceText: { color: THEME.colors.primary, fontSize: 16, fontWeight: '900' },
  nameText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.3, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  constellationText: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  cardNote: { color: THEME.colors.textMuted, fontSize: 11, lineHeight: 18, marginBottom: 16 },
  buyBtn: { borderRadius: 14, overflow: 'hidden' },
  buyGradient: { paddingVertical: 14, alignItems: 'center' },
  buyBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  screenHud: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  hudCorner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(119,191,255,0.15)' },
});
