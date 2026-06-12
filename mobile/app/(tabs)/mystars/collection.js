import React, { useCallback, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import SpaceBackground from '../../../components/SpaceBackground';
import { THEME } from '../../../constants/Theme';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getPurchaseMapParams } from '../../../src/utils/starIdentity';

export default function CollectionScreen() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    loadPurchases();
  }, []));

  const loadPurchases = async () => {
    try {
      const raw = await AsyncStorage.getItem('@purchases');
      const list = raw ? JSON.parse(raw) : [];
      setPurchases(list);
    } catch (error) {
      console.warn('Purchase load error', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <LinearGradient 
      colors={['rgba(25, 35, 60, 0.4)', 'rgba(10, 15, 30, 0.4)']} 
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardId}>
            {item.starClaimCode ? `STARCLAIM: ${item.starClaimCode}` : `REG_ID: ${item.starId}`}
          </Text>
          <Text style={styles.cardName}>{item.name.toUpperCase()}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SAHİPLENİLDİ</Text>
        </View>
      </View>

      <View style={styles.cardMetaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={THEME.colors.textMuted} />
          <Text style={styles.metaText}>{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="card-outline" size={12} color={THEME.colors.textMuted} />
          <Text style={styles.metaText}>{item.method?.toUpperCase()}</Text>
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
          <Ionicons name="locate-outline" size={16} color={THEME.colors.primary} />
          <Text style={styles.actionBtnText}>HARİTADA GÖR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.detailBtn]} 
          onPress={() => router.push({ pathname: '/(tabs)/explore/stardetail', params: { starId: item.starId, name: item.name } })}
        >
          <Text style={styles.detailBtnText}>DETAYLAR</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <View style={styles.header}>
        <Text style={styles.title}>ENVANTER</Text>
        <Text style={styles.subtitle}>KOLEKSİYONUNUZDAKİ YILDIZLAR</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={THEME.colors.primary} size="large" style={{ marginTop: 50 }} />
      ) : purchases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyText}>Henüz bir yıldız sahiplenmediniz.</Text>
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 24, alignItems: 'center', marginTop: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  subtitle: { fontSize: 10, color: THEME.colors.primary, fontWeight: '700', letterSpacing: 2, opacity: 0.8 },
  list: { padding: 20 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardId: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  cardName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  badge: { backgroundColor: 'rgba(201, 168, 76, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.3)' },
  badgeText: { color: '#C9A84C', fontSize: 9, fontWeight: '900' },
  cardMetaRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: THEME.colors.textMuted, fontSize: 12, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnText: { color: THEME.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  detailBtn: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' },
  detailBtnText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginVertical: 20, fontSize: 15, fontWeight: '600' },
  exploreBtn: { backgroundColor: THEME.colors.primary, paddingHorizontal: 30, paddingVertical: 16, borderRadius: 14 },
  exploreBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1 },
});
