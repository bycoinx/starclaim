import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpaceBackground from '../../../components/SpaceBackground';
import { THEME } from '../../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function StarDetailScreen() {
  const { starId, name: initialName } = useLocalSearchParams();
  const [purchase, setPurchase] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [starId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem('@purchases');
      const list = raw ? JSON.parse(raw) : [];
      // starId could be from HIP or custom ID
      const found = list.find(p => p.starId === starId || p.starId?.toString() === starId);
      if (found) {
        setPurchase(found);
        setMessage(found.message || '');
      }
    } catch (e) {
      console.warn('Load data error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMessage = async () => {
    try {
      const raw = await AsyncStorage.getItem('@purchases');
      let list = raw ? JSON.parse(raw) : [];
      list = list.map(p => {
        if (p.starId === starId || p.starId?.toString() === starId) {
          return { ...p, message };
        }
        return p;
      });
      await AsyncStorage.setItem('@purchases', JSON.stringify(list));
      Alert.alert('BAŞARILI', 'Ebedi mesajınız güncellendi.');
    } catch (e) {
      Alert.alert('HATA', 'Mesaj kaydedilemedi.');
    }
  };

  const handleShare = async () => {
    try {
      const shareMsg = `Göklerde bir izim var! ★ ${purchase?.name || initialName} artık benim adıma mühürlü. StarClaim ile siz de yıldızınızı seçin.`;
      await Share.share({
        message: shareMsg,
        title: 'StarClaim Yıldız Sahipliği',
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{(purchase?.name || initialName || 'YILDIZ').toUpperCase()}</Text>
          <Text style={styles.subtitle}>{purchase ? 'SAHİPLENİLDİ' : 'DETAYLAR'}</Text>
        </View>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient 
          colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.5)']}
          style={styles.infoCard}
        >
          <View style={styles.telemetryHeader}>
            <Text style={styles.telemetryText}>SYSTEM.READY // ID_{starId}</Text>
            <Ionicons name="shield-checkmark" size={14} color={THEME.colors.accent} />
          </View>

          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <Text style={styles.label}>REG_ID</Text>
              <Text style={styles.value}>#{starId}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.label}>STATUS</Text>
              <Text style={[styles.value, { color: purchase ? THEME.colors.accent : THEME.colors.primary }]}>
                {purchase ? 'SECURED' : 'AVAILABLE'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>SAHİPLENME TARİHİ</Text>
          <Text style={styles.value}>
            {purchase ? new Date(purchase.date || purchase.createdAt).toLocaleString('tr-TR') : 'YETKİLENDİRME BEKLENİYOR'}
          </Text>
        </LinearGradient>

        {purchase && (
          <View style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Ionicons name="document-text" size={16} color={THEME.colors.primary} />
              <Text style={styles.messageTitle}>EBEDİ MESAJ</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Yıldızınıza bir mesaj mühürleyin..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMessage}>
              <LinearGradient 
                colors={[THEME.colors.primary, '#0099ff']}
                start={{x:0, y:0}} end={{x:1, y:0}}
                style={styles.saveGradient}
              >
                <Text style={styles.saveBtnText}>MESAJI GÜNCELLE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push({ pathname: '/(tabs)/explore/starmap', params: { starId, name: purchase?.name || initialName } })}
          >
            <Ionicons name="map-outline" size={20} color={THEME.colors.primary} />
            <Text style={styles.actionBtnText}>HARİTADA GÖR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.voyageBtn]} 
            onPress={() => router.push({ pathname: '/(tabs)/explore/starvoyage', params: { starId, name: purchase?.name || initialName } })}
          >
            <Ionicons name="rocket-outline" size={20} color={THEME.colors.accent} />
            <Text style={[styles.actionBtnText, { color: THEME.colors.accent }]}>3D YOLCULUK</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.certBtn]}>
            <Ionicons name="ribbon-outline" size={20} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>SERTİFİKA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>BU YILDIZIN MÜLKİYETİ BLOCKCHAIN ÜZERİNDE DOĞRULANMIŞTIR.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: 20 },
  headerCenter: { alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  shareIconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 204, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 204, 255, 0.1)' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  subtitle: { fontSize: 10, color: THEME.colors.primary, fontWeight: '700', letterSpacing: 2, opacity: 0.8 },
  content: { padding: 20 },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  telemetryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, opacity: 0.5 },
  telemetryText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dataItem: { flex: 1 },
  label: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  value: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  messageCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 255, 0.1)',
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  messageTitle: { color: THEME.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: { borderRadius: 12, overflow: 'hidden' },
  saveGradient: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 15 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  certBtn: { backgroundColor: 'rgba(201, 168, 76, 0.1)', borderColor: 'rgba(201, 168, 76, 0.3)' },
  voyageBtn: { backgroundColor: 'rgba(0, 204, 255, 0.05)', borderColor: 'rgba(0, 204, 255, 0.2)' },
  actionBtnText: { color: THEME.colors.primary, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  footerNote: { alignItems: 'center', marginTop: 30, opacity: 0.4 },
  footerText: { color: '#fff', fontSize: 8, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
});

