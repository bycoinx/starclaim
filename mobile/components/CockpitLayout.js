import React from 'react';
import { StyleSheet, View, SafeAreaView, Text } from 'react-native';
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
            colors={['#000000', '#0a0a20', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
         />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topStatus}>
          <View style={styles.statusGroup}>
            <View style={[styles.statusDot, { backgroundColor: THEME.colors.primary }]} />
            <Text style={styles.statusLabel}>AEGIS MOBILE</Text>
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
          <View style={[styles.hudCorner, styles.hudTopL]} />
          <View style={[styles.hudCorner, styles.hudTopR]} />
          <View style={[styles.hudCorner, styles.hudBottomL]} />
          <View style={[styles.hudCorner, styles.hudBottomR]} />
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
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  },
  statusLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    padding: THEME.spacing.md,
  },
  scanline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 204, 255, 0.1)',
    zIndex: 10,
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hudCorner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: 'rgba(0, 204, 255, 0.3)',
  },
  hudTopL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 28 },
  hudTopR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 28 },
  hudBottomL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 28 },
  hudBottomR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 28 },
});
