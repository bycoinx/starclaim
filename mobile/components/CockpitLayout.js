import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import WarpBackground from './WarpBackground';

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
        <View style={styles.topStatus}>
          <View style={styles.statusGroup}>
            <View style={[styles.statusDot, { backgroundColor: THEME.colors.primary }]} />
            <Text style={styles.statusLabel}>STARCALIMX AEGIS v2.0</Text>
          </View>
          <View style={styles.statusGroup}>
            <Text style={styles.statusLabel}>{new Date().toLocaleTimeString()}</Text>
          </View>
        </View>

        <View style={[styles.contentWrapper, !hasWings && styles.contentColumn]}>
          {leftWing && (
            <View style={styles.leftWing}>
              <View style={styles.glassPanel}>
                <View style={styles.scanline} />
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
                <View style={styles.scanline} />
                {rightWing}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {showHUD && (
        <View style={styles.hudOverlay} pointerEvents="none">
          <View style={[styles.hudCorner, styles.hudTopL, { borderColor: THEME.colors.primary + '4D' }]} />
          <View style={[styles.hudCorner, styles.hudTopR, { borderColor: THEME.colors.primary + '4D' }]} />
          <View style={[styles.hudCorner, styles.hudBottomL, { borderColor: THEME.colors.primary + '4D' }]} />
          <View style={[styles.hudCorner, styles.hudBottomR, { borderColor: THEME.colors.primary + '4D' }]} />
          
          <View style={styles.globalScanline} />
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
  topStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 242, 254, 0.2)', // Cyan border
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
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: THEME.spacing.sm,
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
    borderRadius: 22,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.glassBorder,
    overflow: 'hidden',
    padding: THEME.spacing.md,
  },
  scanline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    zIndex: 10,
  },
  globalScanline: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 242, 254, 0.02)',
    opacity: 0.5,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hudCorner: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  hudTopL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 28 },
  hudTopR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 28 },
  hudBottomL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 28 },
  hudBottomR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 28 },
});
