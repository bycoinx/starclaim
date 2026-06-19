import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/Theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SpaceBackground from '../components/SpaceBackground';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Marketplace() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = width - insets.left - insets.right - 48;
  const twoColumns = availableWidth >= 720;

  const mockItems = [
    { id: 1, name: 'Sirius A', price: 450, tier: 'Supernova', constellation: 'Canis Major' },
    { id: 2, name: 'Betelgeuse', price: 320, tier: 'Supernova', constellation: 'Orion' },
    { id: 3, name: 'Vega', price: 180, tier: 'Nova', constellation: 'Lyra' },
    { id: 4, name: 'Altair', price: 150, tier: 'Nova', constellation: 'Aquila' },
  ];

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.content} edges={['top', 'right', 'bottom', 'left']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={THEME.colors.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>STELLAR_EXCHANGE</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.subtitle}>SECURE_P2P_MARKETPLACE</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {mockItems.map((item) => (
              <View key={item.id} style={[styles.cardWrapper, { width: twoColumns ? '50%' : '100%' }]}>
                <LinearGradient 
                  colors={['rgba(25, 25, 35, 0.7)', 'rgba(10, 10, 20, 0.8)']} 
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.tierText}>{item.tier.toUpperCase()}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>${item.price}</Text>
                    </View>
                  </View>
                  <Text style={styles.nameText}>{item.name.toUpperCase()}</Text>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="star-four-points-outline" size={12} color={THEME.colors.textMuted} />
                    <Text style={styles.constellationText}>{item.constellation.toUpperCase()}</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.buyBtn}>
                    <LinearGradient
                      colors={[THEME.colors.primary, THEME.colors.primary + '80']}
                      style={styles.buyGradient}
                    >
                      <Text style={styles.buyBtnText}>ACQUIRE</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Card corners */}
                  <View style={[styles.cardCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary + '60' }]} />
                  <View style={[styles.cardCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.secondary + '60' }]} />
                </LinearGradient>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Screen HUD Overlay */}
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 32, 
    marginTop: 10,
    gap: 20
  },
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
  titleContainer: { flex: 1 },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary },
  subtitle: { fontSize: 9, color: THEME.colors.primary, fontWeight: '900', letterSpacing: 1.5 },
  scrollContent: { paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  cardWrapper: { padding: 8 },
  card: {
    borderRadius: 12,
    padding: 20,
    minHeight: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tierText: { color: THEME.colors.secondary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  priceBadge: { backgroundColor: 'rgba(0, 242, 254, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priceText: { color: THEME.colors.primary, fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  nameText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900', 
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 6
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  constellationText: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  buyBtn: { borderRadius: 8, overflow: 'hidden', marginTop: 'auto' },
  buyGradient: { paddingVertical: 12, alignItems: 'center' },
  buyBtnText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  cardCorner: { position: 'absolute', width: 10, height: 10 },
  screenHud: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  hudCorner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(0, 242, 254, 0.2)' }
});
