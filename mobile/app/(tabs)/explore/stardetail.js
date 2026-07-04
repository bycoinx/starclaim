import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SpaceBackground from '../../../components/SpaceBackground';
import { THEME } from '../../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { createStarTargetFromStar } from '../../../src/utils/starIdentity';
import { downloadCertificatePdf } from '../../../src/platform/certificates/certificateRepository';
import { starMapRoute, starVoyageRoute } from '../../../src/platform/navigation/routes';
import { useOwnershipStore } from '../../../src/platform/ownership/ownershipStore';

const { width } = Dimensions.get('window');

function escapeCertificateText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function StarDetailScreen() {
  const { starId, name: initialName } = useLocalSearchParams();
  const [purchase, setPurchase] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const records = useOwnershipStore((state) => state.records);
  const loadOwnership = useOwnershipStore((state) => state.load);
  const updateOwnershipMessage = useOwnershipStore((state) => state.updateMessage);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadOwnership()
      .catch((error) => console.warn('Load data error', error))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadOwnership, starId]);

  useEffect(() => {
    const found = records.find((record) => recordMatchesId(record, starId));
    setPurchase(found || null);
    if (found) {
      setMessage(found.message || '');
    }
  }, [records, starId]);

  const handleSaveMessage = async () => {
    try {
      const next = await updateOwnershipMessage(starId, message);
      setPurchase(next.find((record) => recordMatchesId(record, starId)) || purchase);
      Alert.alert('BAŞARILI', 'Ebedi mesajınız güncellendi.');
    } catch (e) {
      Alert.alert('HATA', 'Mesaj kaydedilemedi.');
    }
  };

  const handleCertificate = async () => {
    if (!purchase) return;
    try {
      const serverPdfUri = await downloadCertificatePdf(purchase.orderId);
      if (serverPdfUri) {
        await Sharing.shareAsync(serverPdfUri, { mimeType: 'application/pdf' });
        return;
      }

      const certificateName = escapeCertificateText(purchase.name || initialName || 'StarClaim Yıldızı');
      const html = `<!doctype html><html><body style="margin:0;background:#03060d;color:#fff;font-family:Arial;padding:48px;text-align:center"><main style="border:8px double #C9A84C;padding:44px;min-height:620px"><p style="color:#C9A84C;letter-spacing:5px">STARCLAIM</p><h1 style="font-size:42px">${certificateName}</h1><p>Bu kayıt, aşağıdaki yıldızın doğrulanmış sahiplik snapshot'ını temsil eder.</p><hr style="border-color:#C9A84C;margin:40px 0"><p>STARCLAIM KODU: ${escapeCertificateText(purchase.starClaimCode || purchase.code || 'N/A')}</p><p>YILDIZ ID: ${escapeCertificateText(purchase.starId || starId)}</p><p>KOORDİNATLAR: RA ${escapeCertificateText(purchase.ra ?? 'N/A')} / DEC ${escapeCertificateText(purchase.dec ?? 'N/A')}</p><p>TAKIMYILDIZI: ${escapeCertificateText(purchase.constellation || 'N/A')}</p><p>TARİH: ${new Date(purchase.createdAt || purchase.date).toLocaleDateString('tr-TR')}</p><p style="margin-top:60px;color:#C9A84C">${purchase.verified ? 'SUNUCU DOĞRULAMALI ÇEVRİMDIŞI KAYIT' : 'YEREL KAYIT'}</p></main></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('HATA', 'Sertifika oluşturulamadı.');
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
            onPress={() => router.push(starMapRoute({ starId, name: purchase?.name || initialName }))}
          >
            <Ionicons name="map-outline" size={20} color={THEME.colors.primary} />
            <Text style={styles.actionBtnText}>HARİTADA GÖR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.voyageBtn]} 
            onPress={() => router.push(starVoyageRoute(createStarTargetFromStar(purchase || { id: starId, properName: initialName, name: initialName })))}
          >
            <Ionicons name="rocket-outline" size={20} color={THEME.colors.accent} />
            <Text style={[styles.actionBtnText, { color: THEME.colors.accent }]}>3D YOLCULUK</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.certBtn]} onPress={handleCertificate}>
            <Ionicons name="ribbon-outline" size={20} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>SERTİFİKA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>BU YILDIZIN SAHİPLİĞİ STARCLAIM KAYITLARINDA DOĞRULANMIŞTIR.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function recordMatchesId(record, starId) {
  const target = String(starId ?? '');
  if (!target) return false;
  return [record.starId, record.id, record.orderId, record.hip, record.hd, record.starClaimCode]
    .some((value) => String(value ?? '') === target);
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

