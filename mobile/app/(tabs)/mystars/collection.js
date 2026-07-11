import React, { useCallback, useState } from 'react';
import { Alert, Modal, TextInput, View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import SpaceBackground from '../../../components/SpaceBackground';
import { THEME } from '../../../constants/Theme';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getPurchaseMapParams } from '../../../src/utils/starIdentity';
import { ROUTES, starDetailRoute, starMapRoute } from '../../../src/platform/navigation/routes';
import { useOwnershipStore } from '../../../src/platform/ownership/ownershipStore';
import {
  listStarOnMarketplace,
  unlistStarFromMarketplace,
} from '../../../src/platform/marketplace/marketplaceRepository';

export default function CollectionScreen() {
  const router = useRouter();
  const purchases = useOwnershipStore((state) => state.records);
  const loading = useOwnershipStore((state) => state.loading);
  const loadOwnership = useOwnershipStore((state) => state.load);
  const refreshOwnership = useOwnershipStore((state) => state.refresh);
  const [listingDraft, setListingDraft] = useState(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [submittingListing, setSubmittingListing] = useState(false);
  const [localListings, setLocalListings] = useState({});

  useFocusEffect(useCallback(() => {
    loadOwnership();
  }, [loadOwnership]));

  const openListModal = (item) => {
    setListingDraft(item);
    setAskingPrice(String(item.askingPrice || item.asking_price || item.price || ''));
  };

  const submitListing = async () => {
    const price = Number(String(askingPrice).replace(',', '.'));
    if (!listingDraft?.starId || !Number.isFinite(price) || price < 1) {
      Alert.alert('Marketplace', 'Gecerli bir fiyat gir.');
      return;
    }
    try {
      setSubmittingListing(true);
      const listing = await listStarOnMarketplace(listingDraft.starId, price);
      setLocalListings((current) => ({ ...current, [listingDraft.starId]: listing }));
      setListingDraft(null);
      await refreshOwnership();
      Alert.alert('Marketplace', 'Yildiz marketplace listesine eklendi.');
    } catch (error) {
      Alert.alert('Marketplace', error.message || String(error));
    } finally {
      setSubmittingListing(false);
    }
  };

  const unlistItem = async (item) => {
    try {
      const listing = localListings[item.starId] || {};
      await unlistStarFromMarketplace({ starId: item.starId, listingId: item.listingId || listing.listingId });
      setLocalListings((current) => {
        const next = { ...current };
        delete next[item.starId];
        return next;
      });
      await refreshOwnership();
      Alert.alert('Marketplace', 'Yildiz marketplace listesinden kaldirildi.');
    } catch (error) {
      Alert.alert('Marketplace', error.message || String(error));
    }
  };

  const renderItem = ({ item }) => {
    const localListing = localListings[item.starId] || null;
    const listed = Boolean(item.forSale || localListing);
    return (
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
            onPress={() => router.push(starMapRoute(getPurchaseMapParams(item)))}
          >
            <MaterialCommunityIcons name="target" size={18} color={THEME.colors.primary} />
            <Text style={styles.actionBtnText}>MAP</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.detailBtn]} 
            onPress={() => router.push(starDetailRoute({ starId: item.starId, name: item.name }))}
          >
            <MaterialCommunityIcons name="information-outline" size={18} color="#fff" />
            <Text style={styles.detailBtnText}>INFO</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.marketBtn, listed && styles.unlistBtn]}
          onPress={() => (listed ? unlistItem(item) : openListModal(item))}
        >
          <MaterialCommunityIcons name={listed ? 'tag-off-outline' : 'tag-plus-outline'} size={16} color={listed ? THEME.colors.secondary : '#000'} />
          <Text style={[styles.marketBtnText, listed && styles.unlistBtnText]}>
            {listed ? 'UNLIST' : 'LIST MARKET'}
          </Text>
        </TouchableOpacity>

        {/* Card corners */}
        <View style={[styles.cardCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: THEME.colors.primary + '80' }]} />
        <View style={[styles.cardCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: THEME.colors.secondary + '80' }]} />
      </LinearGradient>
    </View>
  );
  };

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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace(ROUTES.profile)}>
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
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.replace(ROUTES.claim)}>
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

      <Modal visible={Boolean(listingDraft)} transparent animationType="fade" onRequestClose={() => setListingDraft(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalEyebrow}>MARKETPLACE LISTING</Text>
            <Text style={styles.modalTitle}>{listingDraft?.name || 'StarClaim Star'}</Text>
            <Text style={styles.modalText}>Bu yildizi aktif marketplace listesine eklemek icin USD fiyat gir.</Text>
            <TextInput
              value={askingPrice}
              onChangeText={setAskingPrice}
              keyboardType="decimal-pad"
              placeholder="USD fiyat"
              placeholderTextColor={THEME.colors.textMuted}
              style={styles.priceInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setListingDraft(null)} disabled={submittingListing}>
                <Text style={styles.cancelBtnText}>IPTAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={submitListing} disabled={submittingListing}>
                <Text style={styles.confirmBtnText}>{submittingListing ? 'SYNC' : 'LIST'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  marketBtn: { marginTop: 10, minHeight: 38, borderRadius: 8, backgroundColor: THEME.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  marketBtnText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  unlistBtn: { backgroundColor: 'rgba(243,156,18,0.08)', borderWidth: 1, borderColor: 'rgba(243,156,18,0.24)' },
  unlistBtnText: { color: THEME.colors.secondary },
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
  hudCorner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(0, 242, 254, 0.2)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', padding: 22 },
  modalPanel: { borderRadius: 20, padding: 22, backgroundColor: '#070b16', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalEyebrow: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 10 },
  modalText: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  priceInput: { marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  cancelBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: THEME.colors.primary },
  confirmBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
});
