import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';

export default function Marketplace() {
  const router = useRouter();

  const mockItems = [
    { id: 1, name: 'Sirius A', price: 450, tier: 'Supernova', constellation: 'Canis Major' },
    { id: 2, name: 'Betelgeuse', price: 320, tier: 'Supernova', constellation: 'Orion' },
    { id: 3, name: 'Vega', price: 180, tier: 'Nova', constellation: 'Lyra' },
    { id: 4, name: 'Altair', price: 150, tier: 'Nova', constellation: 'Aquila' },
  ];

  return (
    <CockpitLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← GERİ</Text>
          </TouchableOpacity>
          <Text style={styles.title}>MARKETPLACE</Text>
          <Text style={styles.subtitle}>İKİNCİL PAZAR</Text>
        </View>

        <ScrollView style={styles.scroll}>
          {mockItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.tierText}>{item.tier.toUpperCase()}</Text>
                <Text style={styles.priceText}>${item.price}</Text>
              </View>
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.constellationText}>{item.constellation}</Text>
              <TouchableOpacity style={styles.buyBtn}>
                <Text style={styles.buyBtnText}>SATIN AL</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  backBtn: { position: 'absolute', left: 0, top: 0 },
  backBtnText: { color: THEME.colors.primary, fontWeight: '700' },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: THEME.colors.primary, fontWeight: '700', letterSpacing: 2 },
  scroll: { flex: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tierText: { color: THEME.colors.secondary, fontSize: 10, fontWeight: 'bold' },
  priceText: { color: THEME.colors.primary, fontSize: 18, fontWeight: '900' },
  nameText: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  constellationText: { color: THEME.colors.textMuted, fontSize: 14, marginBottom: 16 },
  buyBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyBtnText: { color: '#000', fontWeight: '900' },
});
