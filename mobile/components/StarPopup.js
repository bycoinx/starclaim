import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import StarButton from './StarButton';

export default function StarPopup({ visible, star, owned, onClose, onPurchase, onProfile }) {
  if (!star) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{star.proper || `HIP ${star.hip || star.id}`}</Text>
          <Text style={styles.meta}>{star.con ? `Takımyıldız: ${star.con}` : 'Takımyıldız: Bilinmiyor'}</Text>
          <Text style={styles.meta}>Mesafe: {star.dist.toFixed(1)} ışık yılı</Text>
          <Text style={styles.meta}>Parlaklık: {star.mag.toFixed(2)}</Text>
          <Text style={styles.meta}>Spektral tip: {star.spect || '—'}</Text>
          {owned ? <Text style={styles.badge}>★ Sahiplenilmiş</Text> : null}
          <View style={styles.actions}>
            {!owned ? (
              <StarButton compact title="Yıldız Al" active onPress={onPurchase} />
            ) : (
              <StarButton compact title="Yıldızımı Gör" active onPress={onProfile} />
            )}
            <TouchableOpacity style={[styles.button, styles.close]} onPress={onClose}><Text style={styles.buttonText}>Kapat</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', backgroundColor: '#0B0B12', padding: 20, borderRadius: 16, borderColor: '#2E5BFF', borderWidth: 1 },
  title: { color: '#C9A84C', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  meta: { color: '#E8E8F0', fontSize: 13, marginBottom: 4 },
  badge: { color: '#FFD700', fontWeight: '900', marginVertical: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  button: { flex: 1, backgroundColor: '#1B1B28', borderRadius: 12, padding: 12, margin: 4, alignItems: 'center' },
  close: { backgroundColor: '#16161F' },
  buttonText: { color: '#fff', fontWeight: '700' }
});
