import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import WarpBackground from './WarpBackground';
import { Ionicons } from '@expo/vector-icons';

export default function CockpitLayout({ children, leftWing, rightWing, showHUD = true }) {
  const hasWings = !!leftWing || !!rightWing;

  return (
    <View style={styles.container}>
      <View style={styles.background}>
         <WarpBackground />
         <LinearGradient
            colors={['#000000', '#020617', '#000000']} // Deep Space Slate/Black
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
         />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <View style={styles.brandBar}>
          <View style={styles.statusGroup}>
            <Ionicons name="star" size={16} color={THEME.colors.secondary} />
            <Text style={styles.brandName}>STARCLAIM</Text>
          </View>
          <View style={styles.statusGroup}>
            <View style={styles.statusDot} />
            <Text style={styles.statusLabel}>GÜVENLİ OTURUM</Text>
          </View>
        </View>

        <View style={[styles.contentWrapper, !hasWings && styles.contentColumn]}>
          {leftWing && (
            <View style={styles.leftWing}>
              <View style={styles.glassPanel}>
                {leftWing}
              </View>
            </View>
          )}

          <View style={[styles.centerViewport, !hasWings && styles.fullViewport]}>
            {children}
          </View>

          {rightWing && (
            <View style={styles.rightWing}>
              <View style={styles.glassPanel}>
                {rightWing}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {showHUD && (
        <View style={styles.hudOverlay} pointerEvents="none">
          <View style={styles.observationFrame} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  brandBar: {
    height: THEME.components.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: 'rgba(2,4,10,0.72)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244,247,255,0.1)',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  brandName: { color: THEME.colors.text, fontSize: 16, fontFamily: 'Cinzel_700Bold' },
  statusLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  contentColumn: {
    flexDirection: 'column',
    paddingVertical: THEME.spacing.lg,
  },
  leftWing: {
    width: '20%',
    marginRight: THEME.spacing.sm,
  },
  centerViewport: {
    flex: 1,
    borderRadius: THEME.components.panelRadius,
    overflow: 'hidden',
  },
  fullViewport: {
    width: '100%',
  },
  rightWing: {
    width: '22%',
    marginLeft: THEME.spacing.sm,
  },
  glassPanel: {
    flex: 1,
    backgroundColor: THEME.colors.glass,
    borderRadius: THEME.components.panelRadius,
    borderWidth: 1,
    borderColor: THEME.colors.glassBorder,
    overflow: 'hidden',
    padding: THEME.spacing.md,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  observationFrame: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(119,191,255,0.13)',
    borderRadius: 12,
  },
});
