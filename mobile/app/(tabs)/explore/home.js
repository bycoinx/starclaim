import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import SpaceBackground from '../../../components/SpaceBackground';
import GoldButton from '../../../components/GoldButton';
import StarButton from '../../../components/StarButton';
import LanguagePicker from '../../../components/LanguagePicker';
import PurchaseModal from '../../../components/PurchaseModal';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [showBuy, setShowBuy] = useState(false);
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <LanguagePicker style={styles.lang} />
      <PagerView style={styles.pager} initialPage={0} orientation="horizontal">
        <View key="1" style={styles.page}>
          <Text style={styles.title}>GÖKYÜZÜNDE SONSUZ BİR İZ BIRAK</Text>
          <View style={styles.actions}>
            <StarButton title="YILDIZ AL" onPress={() => setShowBuy(true)} />
            <GoldButton title="KEŞFET" onPress={() => {}} outline />
          </View>
          <View style={{marginTop:16}}>
            <GoldButton title="GÖKYÜZÜNE BAK" onPress={() => router.push('./starmap')} outline />
          </View>
          <PurchaseModal visible={showBuy} onClose={()=>setShowBuy(false)} />
        </View>
        <View key="2" style={styles.page}>
          <Text style={styles.subtitle}>3 Adımda Sahiplen</Text>
          <View style={styles.cardRow}>
            <View style={styles.step}><Text style={styles.stepText}>1. Seç</Text></View>
            <View style={styles.step}><Text style={styles.stepText}>2. İsim Ver</Text></View>
            <View style={styles.step}><Text style={styles.stepText}>3. Sahiplen</Text></View>
          </View>
        </View>
        <View key="3" style={styles.page}>
          <Text style={styles.subtitle}>Öne Çıkan Yıldızlar</Text>
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#C9A84C', fontSize: 32, textAlign: 'center', marginHorizontal: 20, fontFamily: 'Cinzel_700Bold' },
  subtitle: { color: '#FFFFFF', fontSize: 20 },
  actions: { flexDirection: 'row', marginTop: 20 },
  cardRow: { flexDirection: 'row', marginTop: 20 },
  step: { backgroundColor: '#0A0A0F', padding: 20, margin: 8, borderRadius: 12 },
  stepText: { color: '#FFFFFF' },
  lang: { position: 'absolute', top: 12, right: 12 }
});
