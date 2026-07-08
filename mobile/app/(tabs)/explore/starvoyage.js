import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { THEME } from '../../../constants/Theme';
import { ROUTES } from '../../../src/platform/navigation/routes';

export default function StarVoyageMaintenance() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#02040A', '#071020', '#02040A']}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Ionicons name="cube-outline" size={22} color={THEME.colors.primary} />
        </View>
        <View>
          <Text style={styles.eyebrow}>STARCLAIM</Text>
          <Text style={styles.headerTitle}>3D EVREN</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.orbit}>
          <View style={styles.orbitInner}>
            <Ionicons name="sparkles" size={38} color={THEME.colors.secondary} />
          </View>
        </View>

        <Text style={styles.title}>YENI BIR EVREN HAZIRLANIYOR</Text>
        <Text style={styles.description}>
          3D yildiz yolculugu yeni render motoru ve astronomik veri katmaniyla yeniden kuruluyor.
        </Text>

        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>GUNCELLEME GELISTIRILIYOR</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.78}
          style={styles.skyButton}
          onPress={() => router.push(ROUTES.sky)}
        >
          <Ionicons name="telescope-outline" size={20} color="#06101D" />
          <Text style={styles.skyButtonText}>SKY LIVE'A DON</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  brandMark: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(119,191,255,0.28)',
    borderRadius: 8,
    backgroundColor: 'rgba(119,191,255,0.07)',
  },
  eyebrow: {
    color: THEME.colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0,
  },
  headerTitle: {
    color: THEME.colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  orbit: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: 'rgba(119,191,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  orbitInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: 'rgba(230,188,74,0.34)',
    backgroundColor: 'rgba(230,188,74,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: THEME.colors.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
  },
  description: {
    maxWidth: 540,
    marginTop: 12,
    color: THEME.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.colors.secondary,
  },
  statusText: {
    color: THEME.colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
  },
  skyButton: {
    minWidth: 210,
    minHeight: 48,
    marginTop: 30,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 8,
    backgroundColor: THEME.colors.primary,
  },
  skyButtonText: {
    color: '#06101D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
});

