import React, { useCallback } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../constants/Theme';
import { ROUTES, starDetailRoute } from '../../src/platform/navigation/routes';
import { useOwnershipStore } from '../../src/platform/ownership/ownershipStore';

export default function ClaimHomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 760 || height < 390;
  const loading = useOwnershipStore((state) => state.loading);
  const ownedStars = useOwnershipStore((state) => state.records);
  const loadOwnership = useOwnershipStore((state) => state.load);

  useFocusEffect(useCallback(() => {
    loadOwnership();
  }, [loadOwnership]));

  const featuredStar = ownedStars[0] || null;
  const featuredName = featuredStar?.name || 'Yildizin';

  const openPrimary = () => {
    if (!featuredStar) {
      router.push(ROUTES.catalog);
      return;
    }
    router.push(starDetailRoute({ starId: featuredStar.starId || featuredStar.id, name: featuredName }));
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/home-cosmos.jpg')} style={styles.backgroundImage} resizeMode="cover" />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(2,4,10,0.24)', 'rgba(2,4,10,0.46)', 'rgba(2,4,10,0.62)']}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={styles.brand}>
            <Ionicons name="star" size={compact ? 18 : 22} color={THEME.colors.secondary} />
            <Text style={[styles.brandText, compact && styles.brandTextCompact]}>STARCLAIM</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Bildirimler"
            style={styles.iconButton}
            onPress={() => router.push(ROUTES.vaultHome)}
          >
            <Ionicons name="notifications-outline" size={21} color={THEME.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={styles.eyebrow}>
            <Ionicons name={featuredStar ? 'sparkles' : 'shield-checkmark-outline'} size={13} color={THEME.colors.secondary} />
            <Text style={styles.eyebrowText}>
              {featuredStar ? `${ownedStars.length} YILDIZLIK KOLEKSIYON` : 'DOGRULANMIS YILDIZ KATALOGU'}
            </Text>
          </View>

          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2} adjustsFontSizeToFit>
            {featuredStar ? `${featuredName} gökyüzünde seni bekliyor` : 'Gökyüzünde sonsuz bir iz bırak'}
          </Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={2}>
            {featuredStar
              ? 'Yıldızının hikayesine dön, gökyüzündeki yerini bul ve anını yaşat.'
              : 'Kendi yıldızını seç. İsmini ve hikayeni gökyüzünde kalıcı bir anıya dönüştür.'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={openPrimary}>
              <LinearGradient
                colors={['#F1D06B', '#C9972F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Ionicons name="star" size={18} color="#130F06" />
                <Text style={styles.primaryText}>{featuredStar ? 'YILDIZIMA GIT' : 'YILDIZINI SEC'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => router.push(ROUTES.sky)}>
              <Ionicons name="telescope-outline" size={19} color={THEME.colors.primary} />
              <Text style={styles.secondaryText}>SKY LIVE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contextRow}>
            {loading ? (
              <ActivityIndicator color={THEME.colors.secondary} size="small" />
            ) : (
              <>
                <View style={styles.contextItem}>
                  <Ionicons name="location-outline" size={14} color="rgba(244,247,255,0.55)" />
                  <Text style={styles.contextText}>GERCEK GOKYUZU</Text>
                </View>
                <View style={styles.contextDivider} />
                <View style={styles.contextItem}>
                  <Ionicons name="ribbon-outline" size={14} color="rgba(244,247,255,0.55)" />
                  <Text style={styles.contextText}>DIJITAL SERTIFIKA</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02040A' },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safeArea: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCompact: { height: 56, paddingHorizontal: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandText: { color: THEME.colors.text, fontFamily: 'Cinzel_700Bold', fontSize: 22 },
  brandTextCompact: { fontSize: 18 },
  iconButton: {
    width: THEME.components.iconButton,
    height: THEME.components.iconButton,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244,247,255,0.18)',
    backgroundColor: 'rgba(2,4,10,0.42)',
  },
  hero: { flex: 1, maxWidth: 780, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 18 },
  heroCompact: { paddingBottom: 8 },
  eyebrow: {
    minHeight: 30,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(230,188,74,0.28)',
    backgroundColor: 'rgba(2,4,10,0.44)',
  },
  eyebrowText: { color: '#E6BC4A', fontSize: 9, fontWeight: '700' },
  title: {
    color: '#F4F7FF',
    fontFamily: 'Cinzel_400Regular',
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
    marginTop: 17,
    textShadowColor: 'rgba(80,140,210,0.4)',
    textShadowRadius: 12,
  },
  titleCompact: { fontSize: 29, lineHeight: 35, marginTop: 10 },
  subtitle: { maxWidth: 610, color: 'rgba(244,247,255,0.72)', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  subtitleCompact: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  primaryButton: { minWidth: 190, height: 48, borderRadius: 24, overflow: 'hidden', shadowColor: '#E6BC4A', shadowOpacity: 0.24, shadowRadius: 12 },
  primaryGradient: { flex: 1, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { color: '#130F06', fontSize: 11, fontWeight: '800' },
  secondaryButton: {
    minWidth: 160,
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(119,191,255,0.45)',
    backgroundColor: 'rgba(2,4,10,0.42)',
  },
  secondaryText: { color: '#DCEEFF', fontSize: 11, fontWeight: '700' },
  contextRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  contextItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contextText: { color: 'rgba(244,247,255,0.48)', fontSize: 8, fontWeight: '700' },
  contextDivider: { width: 1, height: 12, backgroundColor: 'rgba(244,247,255,0.18)' },
});
