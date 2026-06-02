import React from 'react';
import { StyleSheet, View, SafeAreaView, ImageBackground, Text } from 'react-native';
import { THEME } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import WarpBackground from './WarpBackground';

export default function CockpitLayout({ children, leftWing, rightWing, showHUD = true }) {
  return (
    <View style={styles.container}>
      {/* Background Layer (Stars/Warp) */}
      <View style={styles.background}>
         <WarpBackground />
         <LinearGradient
            colors={['#000000', '#0a0a20', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
         />
         {/* HUD Decorative Lines could be added here as absolute overlays */}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Status Bar (Neural Link) */}
        <View style={styles.topStatus}>
           <View style={styles.statusGroup}>
              <View style={[styles.statusDot, { backgroundColor: THEME.colors.primary }]} />
              <Text style={styles.statusLabel}>NEURAL_LINK: ACTIVE</Text>
           </View>
           <View style={styles.statusGroup}>
              <Text style={styles.statusLabel}>{new Date().toLocaleTimeString()}</Text>
           </View>
        </View>

        <View style={styles.contentWrapper}>
          
          {/* LEFT WING: Navigation & Profile */}
          {leftWing && (
            <View style={styles.leftWing}>
              <View style={styles.glassPanel}>
                <View style={styles.scanline} />
                {leftWing}
              </View>
            </View>
          )}

          {/* CENTER VIEWPORT: Main Content / 3D */}
          <View style={styles.centerViewport}>
            {children}
          </View>

          {/* RIGHT WING: Stats & Live Activity */}
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
      
      {/* HUD Global Overlay (Curved edges, vignette) */}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: THEME.spacing.sm,
  },
  leftWing: {
    width: '18%',
    marginRight: THEME.spacing.sm,
  },
  centerViewport: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rightWing: {
    width: '22%',
    marginLeft: THEME.spacing.sm,
  },
  glassPanel: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    padding: THEME.spacing.sm,
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
    borderWidth: 0,
  },
  hudCorner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: 'rgba(0, 204, 255, 0.3)',
  },
  hudTopL: { top: 20, left: 20, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 30 },
  hudTopR: { top: 20, right: 20, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 30 },
  hudBottomL: { bottom: 20, left: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 30 },
  hudBottomR: { bottom: 20, right: 20, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 30 },
});
