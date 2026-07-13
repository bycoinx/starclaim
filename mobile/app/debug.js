import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MobileHeader from '../components/MobileHeader';
import { THEME } from '../constants/Theme';
import { clearRenderDiagnostics, getRenderDiagnostics } from '../src/utils/renderDiagnostics';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Bilinmeyen zaman' : date.toLocaleString('tr-TR');
}

function statusColor(status) {
  if (['ready', 'sensor-active', 'recovered', 'resumed', 'sample'].includes(status)) return THEME.colors.success;
  if (['low-fps', 'sensor-fallback', 'suspended'].includes(status)) return THEME.colors.secondary;
  return THEME.colors.danger;
}

function entrySummary(item) {
  const parts = [];
  if (Number.isFinite(item.fps)) parts.push(`${item.fps} FPS`);
  if (Number.isFinite(item.startupMs)) parts.push(`${item.startupMs} ms açılış`);
  if (Number.isFinite(item.renderedStarCount)) parts.push(`${item.renderedStarCount} yıldız`);
  if (item.quality) parts.push(`kalite ${item.quality}`);
  if (item.mode) parts.push(`mod ${item.mode}`);
  if (item.stage) parts.push(`aşama ${item.stage}`);
  if (item.reason) parts.push(`neden ${item.reason}`);
  return parts.join(' · ') || item.message || 'Ek ölçüm yok';
}

export default function DebugScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setEntries(await getRenderDiagnostics());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadEntries();
  }, [loadEntries]));

  const summary = useMemo(() => {
    const latestReady = entries.find((item) => Number.isFinite(item.fps));
    return {
      count: entries.length,
      fps: latestReady?.fps ?? '--',
      failures: entries.filter((item) => ['error', 'timeout', 'low-fps', 'maintenance'].includes(item.status)).length,
    };
  }, [entries]);

  const clearEntries = async () => {
    if (await clearRenderDiagnostics()) setEntries([]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <MobileHeader
          title="Hata Ayıklama"
          eyebrow="MOBİL TANI"
          leftIcon="chevron-back"
          onLeftPress={() => router.back()}
          rightIcon="refresh"
          rightLabel="Kayıtları yenile"
          onRightPress={loadEntries}
        />

        <View style={styles.summaryBar}>
          <Metric label="KAYIT" value={summary.count} />
          <Metric label="SON FPS" value={summary.fps} />
          <Metric label="SORUN" value={summary.failures} danger={summary.failures > 0} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Kayıtları temizle" style={styles.clearButton} onPress={clearEntries}>
            <Ionicons name="trash-outline" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={THEME.colors.primary} /></View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item, index) => `${item.recordedAt || 'entry'}-${item.status || 'unknown'}-${index}`}
            contentContainerStyle={entries.length ? styles.list : styles.emptyList}
            renderItem={({ item }) => (
              <View style={styles.entry}>
                <View style={styles.entryHeader}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                  <Text style={styles.entryStatus}>{String(item.status || 'unknown').toUpperCase()}</Text>
                  <Text style={styles.entrySurface}>{String(item.surface || 'mobile').toUpperCase()}</Text>
                </View>
                <Text style={styles.entrySummary}>{entrySummary(item)}</Text>
                <Text style={styles.entryTime}>{formatDate(item.recordedAt)}</Text>
                {item.message ? <Text style={styles.entryMessage}>{item.message}</Text> : null}
              </View>
            )}
            ListEmptyComponent={(
              <View style={styles.centered}>
                <Ionicons name="checkmark-circle-outline" size={42} color={THEME.colors.success} />
                <Text style={styles.emptyTitle}>Henüz tanı kaydı yok</Text>
                <Text style={styles.emptyCopy}>Sky Live ekranını açıp haritayı hareket ettirdikten sonra buraya dönün.</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, danger && styles.metricDanger]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  safeArea: { flex: 1 },
  summaryBar: { minHeight: 72, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: THEME.colors.glassBorder },
  metric: { width: 112 },
  metricLabel: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '700' },
  metricValue: { color: THEME.colors.primary, fontSize: 20, fontWeight: '800', marginTop: 3 },
  metricDanger: { color: THEME.colors.danger },
  clearButton: { marginLeft: 'auto', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 10 },
  emptyList: { flexGrow: 1 },
  entry: { padding: 15, borderWidth: 1, borderColor: THEME.colors.glassBorder, borderRadius: 8, backgroundColor: THEME.colors.panel },
  entryHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  entryStatus: { color: THEME.colors.text, fontSize: 11, fontWeight: '800' },
  entrySurface: { marginLeft: 'auto', color: THEME.colors.primary, fontSize: 9, fontWeight: '700' },
  entrySummary: { color: THEME.colors.text, fontSize: 13, marginTop: 10 },
  entryTime: { color: THEME.colors.textMuted, fontSize: 10, marginTop: 5 },
  entryMessage: { color: THEME.colors.danger, fontSize: 11, lineHeight: 16, marginTop: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { color: THEME.colors.text, fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyCopy: { maxWidth: 420, color: THEME.colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
});
