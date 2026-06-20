import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOwnershipPurchases } from '../../src/data/ownershipSnapshot';
import { THEME } from '../../constants/Theme';
import MobileHeader from '../../components/MobileHeader';

const ACTIONS = [
  { key: 'collection', label: 'Yıldızlarım', detail: 'Sahiplik kayıtları ve sertifikalar', icon: 'star-outline', href: '/(tabs)/mystars/collection' },
  { key: 'vault', label: 'StarVault', detail: 'Mesajlar ve anılar', icon: 'lock-closed-outline', href: '/(tabs)/vault/home' },
  { key: 'about', label: 'StarClaim Hakkında', detail: 'Misyon ve iletişim', icon: 'information-circle-outline', href: '/about' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ownedCount, setOwnedCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    getOwnershipPurchases()
      .then((purchases) => {
        if (active) setOwnedCount(Array.isArray(purchases) ? purchases.length : 0);
      })
      .catch(() => {
        if (active) setOwnedCount(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []));

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/profile-cosmos.jpg')} style={styles.backgroundImage} resizeMode="cover" />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <MobileHeader title="Profil" />

        <View style={styles.content}>
          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>KOLEKSİYON</Text>
              {loading ? (
                <ActivityIndicator style={styles.loader} size="small" color={THEME.colors.secondary} />
              ) : (
                <Text style={styles.summaryValue}>{ownedCount}</Text>
              )}
              <Text style={styles.summaryMeta}>sahip olunan yıldız</Text>
            </View>
            <Ionicons name="sparkles-outline" size={42} color="rgba(230,188,74,0.34)" />
          </View>

          <View style={styles.actions}>
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                accessibilityRole="button"
                style={styles.action}
                onPress={() => router.push(action.href)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={21} color={THEME.colors.primary} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDetail}>{action.detail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(244,247,255,0.42)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02040A' },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,4,10,0.48)' },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, flexDirection: 'row', gap: 18 },
  summary: {
    width: '36%',
    minWidth: 220,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(230,188,74,0.24)',
    borderRadius: 10,
    backgroundColor: 'rgba(7,11,20,0.78)',
  },
  summaryLabel: { color: 'rgba(244,247,255,0.5)', fontSize: 9, fontWeight: '700' },
  summaryValue: { color: THEME.colors.secondary, fontSize: 42, fontWeight: '700', marginTop: 6 },
  summaryMeta: { color: 'rgba(244,247,255,0.6)', fontSize: 11, marginTop: 1 },
  loader: { alignSelf: 'flex-start', marginVertical: 16 },
  actions: { flex: 1, justifyContent: 'center' },
  action: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244,247,255,0.1)',
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(119,191,255,0.08)',
  },
  actionCopy: { flex: 1, marginLeft: 12 },
  actionLabel: { color: '#F4F7FF', fontSize: 14, fontWeight: '700' },
  actionDetail: { color: 'rgba(244,247,255,0.46)', fontSize: 10, marginTop: 3 },
});
