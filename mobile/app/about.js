import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';

export default function About() {
  const router = useRouter();

  return (
    <CockpitLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← GERİ</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HAKKIMIZDA</Text>
          <Text style={styles.subtitle}>STARCLAIM MİSYONU</Text>
        </View>

        <ScrollView style={styles.scroll}>
          <View style={styles.contentCard}>
            <Text style={styles.heading}>Vizyonumuz</Text>
            <Text style={styles.text}>
              StarClaim, insanlığın gökyüzüyle olan kadim bağını modern teknolojiyle yeniden kurmayı hedefler. 
              Her bir yıldızın bir hikayesi, her bir hikayenin bir mirası olduğuna inanıyoruz.
            </Text>

            <Text style={styles.heading}>Güven ve Şeffaflık</Text>
            <Text style={styles.text}>
              Blockchain teknolojisi sayesinde yıldız sahipliğiniz ebediyen kayıt altına alınır. 
              Aegis güvenlik katmanı ile verileriniz ve varlıklarınız en üst düzeyde korunur.
            </Text>

            <Text style={styles.heading}>Ebedi Miras</Text>
            <Text style={styles.text}>
              StarVault ile sevdiklerinize zaman ayarlı mesajlar bırakabilir, 
              yıldızınızı gelecek nesillere bir vasiyet olarak devredebilirsiniz.
            </Text>
          </View>
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
  contentCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heading: { color: THEME.colors.secondary, fontSize: 18, fontWeight: '900', marginBottom: 12, marginTop: 20 },
  text: { color: THEME.colors.textMuted, fontSize: 15, lineHeight: 24 },
});
