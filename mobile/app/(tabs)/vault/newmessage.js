import React, {useState, useRef} from 'react';
import { SafeAreaView, Text, StyleSheet, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import SpaceBackground from '../../../components/SpaceBackground';
import LanguagePicker from '../../../components/LanguagePicker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function NewMessageScreen(){
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [lockType, setLockType] = useState('date');
  const [lockValue, setLockValue] = useState('');
  const [recipient, setRecipient] = useState('');
  const router = useRouter();

  const startRecording = async ()=>{
    try{
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    }catch(e){ Alert.alert('HATA', String(e)); }
  }

  const stopRecording = async ()=>{
    try{
      if(!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    }catch(e){ Alert.alert('HATA', String(e)); }
  }

  const save = async ()=>{
    if(!text && !audioUri) {
      Alert.alert('EKSİK BİLGİ', 'Lütfen bir mesaj yazın veya ses kaydedin.');
      return;
    }

    const id = Date.now().toString();
    const msg = { 
      id, 
      type: audioUri ? 'audio' : 'text', 
      text, 
      audioUri, 
      lockType, 
      lockValue, 
      recipient,
      createdAt: Date.now() 
    };

    try{
      const raw = await AsyncStorage.getItem('@vault_messages');
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(msg);
      await AsyncStorage.setItem('@vault_messages', JSON.stringify(arr));
      Alert.alert('BAŞARILI', 'Mesajınız StarVault\'a güvenli bir şekilde kaydedildi.');
      router.back();
    }catch(e){ Alert.alert('HATA', String(e)); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={()=>router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YENİ_KAYIT</Text>
        <View style={{width: 44}} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>MESAJ İÇERİĞİ</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ebedi mesajınızı buraya yazın..." 
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={text} 
          onChangeText={setText} 
          multiline 
          numberOfLines={4} 
        />

        <View style={styles.recSection}>
          <TouchableOpacity 
            style={[styles.recBtn, recording && styles.recActive]} 
            onPress={recording ? stopRecording : startRecording}
          >
            <Ionicons name={recording ? "stop" : "mic"} size={20} color={recording ? "#fff" : "#000"} />
            <Text style={[styles.recText, {color: recording ? "#fff" : "#000"}]}>{recording ? 'DURDUR' : 'SES KAYDET'}</Text>
          </TouchableOpacity>
          {audioUri && (
            <View style={styles.audioBadge}>
              <Ionicons name="checkmark-circle" size={14} color={THEME.colors.accent} />
              <Text style={styles.audioBadgeText}>SES_VERİSİ_HAZIR</Text>
            </View>
          )}
        </View>

        <Text style={styles.label}>ALICI BİLGİSİ (OPSİYONEL)</Text>
        <TextInput 
          style={styles.inputSmall} 
          placeholder="Cüzdan adresi veya e-posta" 
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={recipient} 
          onChangeText={setRecipient} 
        />

        <Text style={styles.label}>ERİŞİM KİLİDİ</Text>
        <View style={styles.lockTypeRow}>
          <TouchableOpacity style={[styles.lockBtn, lockType==='date' && styles.lockBtnActive]} onPress={()=>setLockType('date')}>
            <Ionicons name="calendar-outline" size={16} color={lockType==='date'?'#000':'#fff'} />
            <Text style={[styles.lockBtnText, lockType==='date' && styles.lockBtnTextActive]}>Tarih</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lockBtn, lockType==='person' && styles.lockBtnActive]} onPress={()=>setLockType('person')}>
            <Ionicons name="person-outline" size={16} color={lockType==='person'?'#000':'#fff'} />
            <Text style={[styles.lockBtnText, lockType==='person' && styles.lockBtnTextActive]}>Kişi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lockBtn, lockType==='conditional' && styles.lockBtnActive]} onPress={()=>setLockType('conditional')}>
            <Ionicons name="code-working-outline" size={16} color={lockType==='conditional'?'#000':'#fff'} />
            <Text style={[styles.lockBtnText, lockType==='conditional' && styles.lockBtnTextActive]}>Koşul</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput 
          style={styles.inputSmall} 
          placeholder={lockType==='date' ? "GG.AA.YYYY" : "Kilit değeri girin..."} 
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={lockValue} 
          onChangeText={setLockValue} 
        />

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <LinearGradient 
            colors={[THEME.colors.primary, '#0099ff']} 
            start={{x:0, y:0}} end={{x:1, y:0}}
            style={styles.saveGradient}
          >
            <Text style={styles.saveBtnText}>SİSTEME KAYDET</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#000'},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  form:{padding: 20},
  label:{color: THEME.colors.primary, marginBottom: 12, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, opacity: 0.8},
  input:{backgroundColor: 'rgba(255,255,255,0.03)', color:'#fff', padding:16, borderRadius:16, marginBottom:20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minHeight: 100, textAlignVertical: 'top'},
  inputSmall: { backgroundColor: 'rgba(255,255,255,0.03)', color:'#fff', padding:14, borderRadius:12, marginBottom:20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  recSection: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 },
  recBtn:{ backgroundColor: THEME.colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  recActive: { backgroundColor: THEME.colors.danger },
  recText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  audioBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: THEME.colors.accent + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  audioBadgeText: { color: THEME.colors.accent, fontSize: 9, fontWeight: 'bold' },
  lockTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  lockBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  lockBtnActive:{ backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  lockBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  lockBtnTextActive: { color: '#000' },
  saveBtn:{ marginTop: 10, borderRadius: 16, overflow: 'hidden' },
  saveGradient: { paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 12 }
})
