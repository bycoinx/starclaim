import React, { useCallback, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import SpaceBackground from '../../../components/SpaceBackground';
import { THEME } from '../../../constants/Theme';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getPurchaseMapParams } from '../../../src/utils/starIdentity';
import { getOwnershipPurchases } from '../../../src/data/ownershipSnapshot';

const { width } = Dimensions.get('window');

export default function CollectionScreen() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    loadPurchases();
  }, []));

  const loadPurchases = async () => {
    try {
      const list = await getOwnershipPurchases();
      setPurchases(list);
    } catch (error) {
      console.warn('Purchase load error', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <LinearGradient 
        colors={['rgba(25, 25, 35, 0.7)', 'rgba(10, 10, 20, 0.8)']} 
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardId}>
              {item.starClaimCode ? `CERT_CODE: ${item.starClaimCode}` : `REG_ID: ${item.starId}`}
            </Text>
            <Text style={styles.cardName}>{item.name.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, !item.verified && styles.localBadge]}>
            <MaterialCommunityIcons name={item.verified ? 'shield-check' : 'clock-outline'} size={12} color={THEME.colors.secondary} />
            <Text style={styles.badgeText}>{item.verified ? 'VERIFIED' : 'LOCAL'}</Text>
          </View>
        </View>

        <View style={styles.cardMetaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={THEME.colors.textMuted} />
            <Text style={styles.metaText}>{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="database" size={12} color={THEME.colors.textMuted} />
            <Text style={styles.metaText}>{item.method?.toUpperCase() || 'STELLAR'}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push({
              pathname: '/(tabs)/explore/starmap',
              params: getPurchaseMapParams(item),
            })}
          >
            <MaterialCommunityIcons name="target" size={18} color={THEME.colors.primary} />
            <Text style={styles.actionBtnText}>MAP</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.detailBtn]} 
            onPress={() => router.push({ pathname: '/(tabs)/explore/stardetail', params: { starId: item.starId, name: item.name } })}
          >
            <MaterialCommunityIcons name="information-outline" size={18} color="#fff" />
            <Text style={styles.detailBtnText}>INFO</Text>
          </TouchableOpacity>
        </View>

        {/* Card corners */}
        <View style={[styles.cardCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary + '80' }]} />
        <View style={[styles.cardCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.secondary + '80' }]} />
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>STAR_INVENTORY</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.subtitle}>ACCESSING_SECURE_COLLECTION</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/explore/home')}>
            <Ionicons name="close" size={24} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={THEME.colors.primary} size="large" />
            <Text style={styles.loadingText}>SYNCING_DATABASE...</Text>
          </View>
        ) : purchases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="star-off-outline" size={48} color={THEME.colors.primary + '40'} />
            </View>
            <Text style={styles.emptyText}>BİR YILDIZ SAHİPLENİLMEDİ</Text>
            <Text style={styles.emptySubText}>Evrende izinizi bırakmak için keşfe çıkın.</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/stars')}>
              <Text style={styles.exploreBtnText}>KEŞFETMEYE BAŞLA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={purchases}
            keyExtractor={(item, index) => item.starId?.toString() || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            numColumns={2}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    marginTop: 10 
  },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary },
  subtitle: { fontSize: 9, color: THEME.colors.primary, fontWeight: '900', letterSpacing: 2 },
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
  list: { padding: 16, paddingBottom: 120 },
  cardContainer: {
    flex: 1,
    padding: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    minHeight: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardId: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  cardName: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '900', 
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  badge: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(243, 156, 18, 0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: 'rgba(243, 156, 18, 0.3)' 
  },
  badgeText: { color: THEME.colors.secondary, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  localBadge: { opacity: 0.65 },
  cardMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(0, 242, 254, 0.1)', 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: THEME.colors.primary + '30' 
  },
  actionBtnText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  detailBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  detailBtnText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardCorner: { position: 'absolute', width: 10, height: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', marginTop: 16, letterSpacing: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(25, 25, 35, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 24, letterSpacing: 3 },
  emptySubText: { color: THEME.colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  exploreBtn: { marginTop: 32, backgroundColor: THEME.colors.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 10 },
  exploreBtnText: { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  screenHud: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  hudCorner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(0, 242, 254, 0.2)' }
});
