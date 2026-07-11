import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import GoldButton from './GoldButton';
import { downloadCertificatePdf } from '../src/platform/certificates/certificateRepository';
import { emitPurchaseCommitted } from '../src/platform/ownership/ownershipSyncEvents';
import { useOwnershipStore } from '../src/platform/ownership/ownershipStore';
import { claimStar } from '../src/platform/purchase/purchaseRepository';
import { useVaultStore } from '../src/platform/vault/vaultStore';

function escapeCertificateText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resolveDisplayName(star, customName) {
  return customName || star?.proper || star?.properName || star?.name || 'Yeni Yildiz';
}

export default function PurchaseModal({ visible, onClose, star, onPurchaseSuccess }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchaseRecord, setPurchaseRecord] = useState(null);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setName(star?.proper || star?.properName || star?.name || '');
      setSelected(null);
      setPurchaseRecord(null);
    }
  }, [visible, star]);

  useEffect(() => {
    if (step === 3) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
    } else {
      scale.setValue(0);
    }
  }, [scale, step]);

  const generateCertificate = async () => {
    try {
      const serverPdfUri = await downloadCertificatePdf(purchaseRecord?.orderId);
      if (serverPdfUri) {
        await Sharing.shareAsync(serverPdfUri, { mimeType: 'application/pdf' });
        return;
      }

      const certificateName = escapeCertificateText(purchaseRecord?.name || resolveDisplayName(star, name));
      const starId = escapeCertificateText(purchaseRecord?.starId || star?.star_id || star?.id || 'N/A');
      const starCode = escapeCertificateText(purchaseRecord?.starClaimCode || 'N/A');
      const ra = escapeCertificateText(purchaseRecord?.ra ?? star?.ra ?? 'N/A');
      const dec = escapeCertificateText(purchaseRecord?.dec ?? star?.dec ?? 'N/A');
      const recordDate = new Date(purchaseRecord?.createdAt || purchaseRecord?.date || Date.now()).toLocaleDateString('tr-TR');
      const html = `
        <!doctype html>
        <html>
          <body style="margin:0;background:#050505;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:40px">
            <main style="border:10px double #C9A84C;padding:40px;min-height:620px">
              <h1 style="color:#C9A84C;font-size:42px;margin-bottom:0">StarClaimX</h1>
              <p style="color:#C9A84C;letter-spacing:4px;font-size:14px;margin-top:5px">ETERNAL COVENANT CERTIFICATE</p>
              <section style="margin:50px 0">
                <p style="font-size:18px;opacity:.8">This document confirms that the star</p>
                <h2 style="font-size:48px;margin:10px 0;color:#fff">${certificateName}</h2>
                <p style="font-size:18px;opacity:.8">has been claimed by the bearer of this soul-bound record.</p>
              </section>
              <footer style="border-top:1px solid rgba(201,168,76,.3);padding-top:20px;font-size:12px;color:#8A8A9A">
                <p>STAR_ID: ${starId}</p>
                <p>STARCLAIM_CODE: ${starCode}</p>
                <p>COORDINATES: RA ${ra} | DEC ${dec}</p>
                <p>RECORD_DATE: ${recordDate}</p>
              </footer>
            </main>
          </body>
        </html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('HATA', `Sertifika olusturulamadi: ${String(error?.message || error)}`);
    }
  };

  const handlePurchase = async () => {
    if (!selected) {
      Alert.alert('UYARI', 'Lutfen bir odeme yontemi secin.');
      return;
    }

    setLoading(true);
    try {
      const rec = await claimStar({
        star,
        customName: resolveDisplayName(star, name),
        paymentMethod: selected,
      });

      await useOwnershipStore.getState().addLocalRecord(rec, { emit: false });
      setPurchaseRecord(rec);

      try {
        await useVaultStore.getState().addMessage({
          id: `welcome-${Date.now()}`,
          type: 'text',
          text: `SISTEM MESAJI: ${(rec.name || resolveDisplayName(star, name)).toUpperCase()} yildizi basariyla tescil edildi. Ebedi mirasinizin ilk parcasi StarVault'a eklendi.`,
          lockType: 'none',
          createdAt: new Date().toISOString(),
          date: new Date().toISOString(),
        });
      } catch (vaultError) {
        console.warn('Vault integration failed', vaultError);
      }

      await emitPurchaseCommitted(rec, { source: 'purchase-modal' });

      if (onPurchaseSuccess) onPurchaseSuccess(rec);
      setStep(3);
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('SISTEM HATASI', error.message || 'Satin alma tamamlanamadi.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = purchaseRecord?.name || resolveDisplayName(star, name);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step === 1 && (
            <View>
              <Text style={styles.h}>YILDIZA ISIM VER</Text>
              <Text style={styles.sub}>Bu isim sertifikada ve haritada gorunecek.</Text>
              <TextInput
                placeholder="Yildizin yeni adi..."
                placeholderTextColor="#555"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
              <GoldButton title="DEVAM ET" onPress={() => setStep(2)} />
              <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                <Text style={styles.cancelText}>IPTAL ET</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.h}>ODEME YONTEMI</Text>
              <Text style={styles.sub}>Kayit ucreti: $12.00</Text>

              <TouchableOpacity
                style={[styles.payBtn, selected === 'stripe' && styles.payBtnActive]}
                onPress={() => setSelected('stripe')}
              >
                <Text style={[styles.payBtnText, selected === 'stripe' && styles.payBtnTextActive]}>Kredi Karti (Stripe)</Text>
              </TouchableOpacity>

              <View style={{ height: 12 }} />

              <GoldButton
                title={loading ? 'ISLENIYOR...' : 'ODEMEYI TAMAMLA'}
                onPress={handlePurchase}
                disabled={loading}
              />

              {loading && <ActivityIndicator style={{ marginTop: 12 }} color="#C9A84C" />}

              <TouchableOpacity style={styles.cancelLink} onPress={() => setStep(1)}>
                <Text style={styles.cancelText}>GERI GIT</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={{ alignItems: 'center' }}>
              <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
                <Text style={styles.hSuccess}>TEBRIKLER!</Text>
                <Text style={styles.successDesc}>
                  "{displayName.toUpperCase()}" artik sonsuza dek sizin adiniza tescillendi.
                </Text>
              </Animated.View>

              <View style={styles.certificatePreview}>
                <Text style={styles.certLabel}>OFFICIAL_RECORD</Text>
                <Text style={styles.certStarName}>{displayName.toUpperCase()}</Text>
                <Text style={styles.certMeta}>REGID: {purchaseRecord?.starId || star?.star_id || star?.id || 'ALPHA-01'}</Text>
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={generateCertificate}>
                <Text style={styles.shareBtnText}>SERTIFIKAYI PAYLAS / INDIR</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                <Text style={styles.finishBtnText}>TAMAMLA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: '#050A1A', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  h: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  sub: { color: '#8A8A9A', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 16, marginBottom: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 16 },
  payBtn: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  payBtnActive: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' },
  payBtnText: { color: '#8A8A9A', fontWeight: '700', fontSize: 14 },
  payBtnTextActive: { color: '#fff' },
  cancelLink: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#5A6A8A', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  hSuccess: { color: '#C9A84C', fontSize: 28, fontWeight: '900', letterSpacing: 4, marginBottom: 10 },
  successDesc: { color: '#fff', textAlign: 'center', fontSize: 14, opacity: 0.8, lineHeight: 20, marginBottom: 24 },
  certificatePreview: { width: '100%', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(201,168,76,0.5)', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  certLabel: { color: '#C9A84C', fontSize: 8, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  certStarName: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  certMeta: { color: '#5A6A8A', fontSize: 9, fontWeight: 'bold' },
  shareBtn: { backgroundColor: '#C9A84C', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  finishBtn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  finishBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
