import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SPECTRAL_MAP = {
  O: ['#06b6d4', '#0ea5e9'],
  B: ['#3b82f6', '#6366f1'],
  A: ['#bae6fd', '#60a5fa'],
  F: ['#fef3c7', '#f59e0b'],
  G: ['#f59e0b', '#fbbf24'],
  K: ['#fb923c', '#ef4444'],
  M: ['#ef4444', '#be185d'],
  default: ['#6366f1', '#7c3aed'],
};

export default function StarAssetImage({ star, variant = 'preview', style }) {
  const [imgError, setImgError] = useState(false);
  if (!star) return null;
  const asset = star.asset || star.assetInfo || {};
  const spectral = (star.spectralType || asset.spectralType || 'G').charAt(0).toUpperCase();
  const colors = SPECTRAL_MAP[spectral] || SPECTRAL_MAP.default;
  const imageUri = variant === 'hero' ? asset.heroImage : asset.previewImage;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient colors={[colors[0] + '22', colors[1] + '18']} style={StyleSheet.absoluteFill} />

      {imageUri && !imgError ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.fallback} />
      )}

      <View style={styles.reticle} pointerEvents="none">
        <View style={styles.core} />
      </View>

      <View style={styles.caption}>
        <Text style={styles.captionText}>{(star.spectralType || '').toUpperCase() || 'G' }  ·  {star.starClaimCode || star.slug || (star.id || '').toString().slice(0,6)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#030615',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  reticle: { position: 'absolute', left: 12, top: 12, width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  core: { width: 10, height: 10, borderRadius: 6, backgroundColor: '#fff', opacity: 0.9 },
  caption: { position: 'absolute', bottom: 6, left: 10 },
  captionText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }
});
