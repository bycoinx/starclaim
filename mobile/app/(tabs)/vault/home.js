import React, {useEffect, useState, useRef} from 'react';
import { SafeAreaView, Text, StyleSheet, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import SpaceBackground from '../../../components/SpaceBackground';
import LanguagePicker from '../../../components/LanguagePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function VaultHomeScreen(){
  const [messages, setMessages] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const soundRef = useRef(null);
  const router = useRouter();

  useEffect(()=>{ load(); },[])

  const load = async ()=>{
    try{
      const raw = await AsyncStorage.getItem('@vault_messages');
      const arr = raw ? JSON.parse(raw) : [];
      setMessages(arr);
      const uRaw = await AsyncStorage.getItem('@vault_unlocked');
      const uArr = uRaw ? JSON.parse(uRaw) : [];
      setUnlocked(uArr);
    }catch(e){ console.warn(e); }
  }

  const isUnlocked = (item)=>{
    if(unlocked.includes(item.id)) return true;
    if(item.lockType === 'date' && item.lockValue){
      const ts = Number(item.lockValue) || Date.parse(item.lockValue);
      if(!isNaN(ts) && Date.now() >= ts) return true;
    }
    return false;
  }

  const setUnlockedFor = async (id)=>{
    try{
      const next = Array.from(new Set([id, ...unlocked]));
      setUnlocked(next);
      await AsyncStorage.setItem('@vault_unlocked', JSON.stringify(next));
    }catch(e){ console.warn(e); }
  }

  const tryUnlock = async (item)=>{
    if(item.lockType === 'date'){
      const ts = Number(item.lockValue) || Date.parse(item.lockValue);
      if(!isNaN(ts) && Date.now() >= ts){
        await setUnlockedFor(item.id);
        Alert.alert('SİSTEM ONAYI','Kilit açıldı. Veri erişilebilir.');
      } else {
        const remaining = new Date(ts - Date.now());
        Alert.alert('ERİŞİM REDDİ',`Kilit süresi henüz dolmadı.`);
      }
      return;
    }

    if(item.lockType === 'person'){
      try{
        const res = await LocalAuthentication.authenticateAsync({promptMessage:'Biyometrik doğrulama gerekli'});
        if(res.success) { 
          await setUnlockedFor(item.id); 
          Alert.alert('YETKİ VERİLDİ','Kimlik doğrulandı.'); 
        }
        else Alert.alert('HATA','Doğrulama başarısız.');
      }catch(e){ Alert.alert('SİSTEM HATASI',String(e)); }
      return;
    }

    Alert.alert('GÜVENLİ ERİŞİM', 'Bu veriyi manuel olarak açmak istiyor musunuz?', [
      {text:'İPTAL'},
      {text:'EVET', onPress: async ()=>{ await setUnlockedFor(item.id); Alert.alert('VERİ AÇILDI'); }}
    ])
  }

  const stopAndUnload = async ()=>{
    try{
      if(soundRef.current){
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    }catch(e){ console.warn(e); }
    setPlayingId(null);
  }

  const playAudio = async (item)=>{
    if(!isUnlocked(item)) return tryUnlock(item);
    try{
      if(soundRef.current){ await stopAndUnload(); }
      const { sound } = await Audio.Sound.createAsync({ uri: item.audioUri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item.id);
      sound.setOnPlaybackStatusUpdate((status)=>{
        if(status.didJustFinish) stopAndUnload();
      })
    }catch(e){ console.warn(e); Alert.alert('SİSTEM HATASI', String(e)); }
  }

  const renderItem = ({item}) => (
    <LinearGradient 
      colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} 
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Ionicons 
          name={item.type === 'audio' ? "mic-outline" : "document-text-outline"} 
          size={18} 
          color={THEME.colors.primary} 
        />
        <Text style={styles.cardType}>{item.type === 'audio' ? 'VOICE_LOG' : 'TEXT_ENTRY'}</Text>
        <View style={[styles.statusTag, { backgroundColor: isUnlocked(item) ? THEME.colors.accent + '20' : THEME.colors.danger + '20' }]}>
          <Text style={[styles.statusTagText, { color: isUnlocked(item) ? THEME.colors.accent : THEME.colors.danger }]}>
            {isUnlocked(item) ? 'DECRYPTED' : 'LOCKED'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>
        {isUnlocked(item) ? (item.type === 'text' ? item.text : 'Audio Broadcast Active') : '••••••••••••••••'}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.metaBox}>
          <Ionicons name="lock-closed-outline" size={10} color={THEME.colors.textMuted} />
          <Text style={styles.metaText}>{item.lockType.toUpperCase()}</Text>
        </View>
        
        {isUnlocked(item) ? (
          item.type === 'audio' && (
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={playingId === item.id ? stopAndUnload : () => playAudio(item)}
            >
              <Ionicons name={playingId === item.id ? "stop" : "play"} size={16} color="#000" />
              <Text style={styles.actionBtnText}>{playingId === item.id ? 'STOP' : 'PLAY'}</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={()=>tryUnlock(item)}>
            <Ionicons name="key-outline" size={16} color="#000" />
            <Text style={styles.actionBtnText}>UNLOCK</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  )

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>STAR_VAULT</Text>
            <Text style={styles.subHeader}>SECURE_TIME_CAPSULE_RECORDS</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={()=>router.push('./newmessage')}>
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>BİR MESAJ BIRAKILMADI</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={()=>router.push('./newmessage')}>
              <Text style={styles.emptyBtnText}>YENİ KAYIT OLUŞTUR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList 
            data={messages} 
            keyExtractor={m=>m.id} 
            renderItem={renderItem} 
            contentContainerStyle={{paddingBottom: 40}} 
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  header: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  subHeader: { color: THEME.colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 2, opacity: 0.8 },
  newBtn: { backgroundColor: THEME.colors.primary, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardType: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1, marginLeft: 6, flex: 1 },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusTagText: { fontSize: 8, fontWeight: '900' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: 'bold' },
  actionBtn: { backgroundColor: THEME.colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  emptyText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 16, letterSpacing: 2 },
  emptyBtn: { marginTop: 20, borderWidth: 1, borderColor: THEME.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900' }
})
