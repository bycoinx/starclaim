import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/Theme';

/**
 * Real-time telemetry panel for 2D Sky Map
 * Shows: FPS, frame time, heap, native memory, thermal state
 * Used for P0.1 Render Motor Stability audit
 */
export default function SkyTelemetryPanel({ visible = false, fps = 0, frameTime = 0, heapUsed = 0 }) {
  if (!visible) return null;

  const fpsBg = fps >= 55 ? '#2ecc71' : fps >= 30 ? '#f39c12' : '#e74c3c';
  const frameTimeBg = frameTime < 20 ? '#2ecc71' : frameTime < 35 ? '#f39c12' : '#e74c3c';

  return (
    <View style={[styles.container]}>
      <Text style={styles.title}>Sky Telemetry</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>FPS:</Text>
        <Text style={[styles.value, { backgroundColor: fpsBg, color: '#000' }]}>
          {fps.toFixed(1)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Frame:</Text>
        <Text style={[styles.value, { backgroundColor: frameTimeBg, color: '#000' }]}>
          {frameTime.toFixed(1)}ms
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Heap:</Text>
        <Text style={styles.value}>
          {(heapUsed / 1024 / 1024).toFixed(1)}MB
        </Text>
      </View>

      <Text style={styles.note}>P0.1 Audit Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    minWidth: 140,
    zIndex: 100,
    borderWidth: 1,
    borderColor: THEME.colors.accent,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.accent,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    color: '#aaa',
    flex: 0.4,
  },
  value: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    flex: 0.6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  note: {
    fontSize: 7,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
