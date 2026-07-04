import React, { useRef } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpaceBackground from '../../../components/SpaceBackground';
import { Audio } from 'expo-av';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES } from '../../../src/platform/navigation/routes';
import { useOwnershipStore } from '../../../src/platform/ownership/ownershipStore';
import { useVaultStore } from '../../../src/platform/vault/vaultStore';

const quickActions = [
  { label: 'Yildiz Al', icon: 'star', href: ROUTES.claim },
  { label: 'Sertifikalar', icon: 'shield-check', href: ROUTES.vaultPurchases },
  { label: 'Hikaye Ekle', icon: 'book-plus-outline', href: ROUTES.vaultNewMessage },
  { label: 'Pazaryeri', icon: 'globe', href: ROUTES.marketplace },
  { label: 'Guvenlik', icon: 'shield-lock-outline', href: ROUTES.vaultLockSettings },
  { label: 'Profil', icon: 'account-circle-outline', href: ROUTES.profile },
];

export default function VaultHomeScreen() {
  const soundRef = useRef(null);
  const router = useRouter();
  const ownershipSummary = useOwnershipStore((state) => state.summary);
  const loadOwnership = useOwnershipStore((state) => state.load);
  const messages = useVaultStore((state) => state.messages);
  const unlocked = useVaultStore((state) => state.unlockedIds);
  const vaultSummary = useVaultStore((state) => state.summary);
  const loadVault = useVaultStore((state) => state.load);
  const unlockVault = useVaultStore((state) => state.unlock);
  const playingId = useVaultStore((state) => state.playingId);
  const setPlayingId = useVaultStore((state) => state.setPlayingId);

  const stats = [
    { label: 'Sahip Yildiz', value: String(ownershipSummary.ownedStars || 0) },
    { label: 'Sertifika', value: String(ownershipSummary.certificates || 0) },
    { label: 'Vault Kaydi', value: String(vaultSummary.totalItems || 0) },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadOwnership();
      loadVault();
    }, [loadOwnership, loadVault])
  );

  const isUnlocked = (item) => {
    if (unlocked.includes(String(item.id))) return true;
    if (!item.lockType || item.lockType === 'none') return true;
    if (item.lockType === 'date' && item.lockValue) {
      const ts = Number(item.lockValue) || Date.parse(item.lockValue);
      return !Number.isNaN(ts) && Date.now() >= ts;
    }
    return false;
  };

  const tryUnlock = async (item) => {
    if (item.lockType === 'date') {
      const ts = Number(item.lockValue) || Date.parse(item.lockValue);
      if (!Number.isNaN(ts) && Date.now() >= ts) {
        await unlockVault(item.id);
        Alert.alert('Sistem Onayi', 'Kilit acildi. Veri erisilebilir.');
      } else {
        Alert.alert('Erisim Reddi', 'Kilit suresi henuz dolmadi.');
      }
      return;
    }

    if (item.lockType === 'person') {
      try {
        const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Biyometrik dogrulama gerekli' });
        if (res.success) {
          await unlockVault(item.id);
          Alert.alert('Yetki Verildi', 'Kimlik dogrulandi.');
        } else {
          Alert.alert('Hata', 'Dogrulama basarisiz.');
        }
      } catch (e) {
        Alert.alert('Sistem Hatasi', String(e));
      }
      return;
    }

    Alert.alert('Guvenli Erisim', 'Bu veriyi manuel olarak acmak istiyor musunuz?', [
      { text: 'Iptal' },
      {
        text: 'Evet',
        onPress: async () => {
          await unlockVault(item.id);
          Alert.alert('Veri Acildi');
        },
      },
    ]);
  };

  const stopAndUnload = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.warn(e);
    }
    setPlayingId(null);
  };

  const playAudio = async (item) => {
    if (!isUnlocked(item)) return tryUnlock(item);
    try {
      if (soundRef.current) {
        await stopAndUnload();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: item.audioUri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) stopAndUnload();
      });
    } catch (e) {
      console.warn(e);
      Alert.alert('Sistem Hatasi', String(e));
    }
  };

  const viewMessage = (item) => {
    if (item.type === 'text') {
      Alert.alert(item.title || 'Vault Metni', item.text || 'Bu içerik şu anda görüntülenemiyor.');
      return;
    }

    if (item.type === 'audio') {
      playAudio(item);
      return;
    }

    Alert.alert('Bilgi', 'Bu öğe için bir işlem yapılamıyor.');
  };

  const renderMessage = ({ item }) => {
    const unlockedState = isUnlocked(item);
    return (
      <View style={[styles.messageCard, { borderColor: unlockedState ? THEME.colors.primary + '30' : THEME.colors.secondary + '20' }]}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageType}>{item.type === 'audio' ? 'VOICE LOG' : 'DATA ENTRY'}</Text>
          <View style={[styles.messageBadge, { backgroundColor: unlockedState ? THEME.colors.primary + '12' : THEME.colors.secondary + '12' }]}>
            <Text style={[styles.messageBadgeText, { color: unlockedState ? THEME.colors.primary : THEME.colors.secondary }]}>
              {unlockedState ? 'ACIK' : 'KILITLI'}
            </Text>
          </View>
        </View>
        <Text numberOfLines={2} style={[styles.messageTitle, !unlockedState && styles.lockedText]}>
          {unlockedState ? (item.type === 'text' ? item.text : 'ACTIVE_AUDIO_BROADCAST') : 'Sifrelenmis icerik gizlendi'}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageMeta}>PROTOKOL: {String(item.lockType || 'none').toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: unlockedState ? THEME.colors.primary : THEME.colors.secondary }]}
            onPress={() => (unlockedState ? viewMessage(item) : tryUnlock(item))}
          >
            <Text style={styles.actionBtnText}>
              {unlockedState ? (item.type === 'audio' ? (playingId === item.id ? 'DURDUR' : 'ICERIGI OYNAT') : 'GORUNTULE') : 'KILIDI AC'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'transparent', 'rgba(0,0,0,0.98)']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>STARCLAIM X</Text>
                  </View>
                  <TouchableOpacity style={styles.heroAction} onPress={() => router.push(ROUTES.vaultNewMessage)}>
                    <Text style={styles.heroActionText}>YENI</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.heroTitle}>STARVAULT</Text>
                <Text style={styles.heroSubtitle}>Mobil yildiz koleksiyonun, sertifikalarin ve hikayelerin icin premium bir uzay kasasi deneyimi.</Text>
                <View style={styles.metricsRow}>
                  {stats.map((stat) => (
                    <View key={stat.label} style={styles.metricCard}>
                      <Text style={styles.metricValue}>{stat.value}</Text>
                      <Text style={styles.metricLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Kisa Yollar</Text>
                <Text style={styles.sectionDesc}>Yildizlarin, sertifikalarin ve guvenli kayitlarin icin dogrudan erisim.</Text>
                <View style={styles.actionGrid}>
                  {quickActions.map((action) => (
                    <TouchableOpacity key={action.label} style={styles.actionTile} onPress={() => router.push(action.href)}>
                      <MaterialCommunityIcons name={action.icon} size={18} color={THEME.colors.primary} />
                      <Text style={styles.actionTileText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionTitle}>Guvenlik Durumu</Text>
                  <Text style={styles.sectionBadge}>Premium</Text>
                </View>
                <View style={styles.securityGrid}>
                  {[
                    { label: 'Sifreleme', value: 'Aktif' },
                    { label: 'Yedekleme', value: 'Senkr.' },
                    { label: 'Kilit', value: 'Hazir' },
                  ].map((item) => (
                    <View key={item.label} style={[styles.securityCard, { borderColor: THEME.colors.primary + '20' }]}>
                      <Text style={styles.securityValue}>{item.value}</Text>
                      <Text style={styles.securityLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.ctaCard}>
                <Text style={styles.ctaTitle}>Ilk guvenli kaydini olustur</Text>
                <Text style={styles.ctaText}>Mesaj, ses kaydi veya zaman kilitli ani ekleyerek StarVault'unu kullanmaya basla.</Text>
                <TouchableOpacity style={styles.ctaButton} onPress={() => router.push(ROUTES.vaultNewMessage)}>
                  <Text style={styles.ctaButtonText}>Hikaye Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={<View style={styles.listEmptySpacing} />}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 40 },
  heroCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroBadge: { backgroundColor: 'rgba(119,191,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  heroBadgeText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroAction: { backgroundColor: THEME.colors.primary, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  heroActionText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  heroTitle: { color: '#fff', fontSize: 34, fontWeight: '900', lineHeight: 40, letterSpacing: 2 },
  heroSubtitle: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 14, marginBottom: 22 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  metricCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  metricValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: THEME.colors.textMuted, fontSize: 9, marginTop: 8, letterSpacing: 1.5 },
  sectionBlock: { marginBottom: 20 },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  sectionBadge: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  sectionDesc: { color: THEME.colors.textMuted, fontSize: 11, lineHeight: 18, marginBottom: 14 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  actionTile: { width: '50%', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 12 },
  actionTileText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  securityGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  securityCard: { flex: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(255,255,255,0.03)' },
  securityValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  securityLabel: { color: THEME.colors.textMuted, fontSize: 9, marginTop: 8, letterSpacing: 1.5 },
  ctaCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 10, letterSpacing: 1.5 },
  ctaText: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  ctaButton: { backgroundColor: THEME.colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  ctaButtonText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  messageType: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  messageBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  messageBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  messageTitle: { color: '#fff', fontSize: 14, lineHeight: 20 },
  lockedText: { color: THEME.colors.textMuted },
  messageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  messageMeta: { color: THEME.colors.textMuted, fontSize: 9, letterSpacing: 1.6 },
  actionBtn: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  actionBtnText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  listEmptySpacing: { height: 24 },
});
