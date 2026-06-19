import React, {useEffect, useState, useRef} from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpaceBackground from '../../../components/SpaceBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

  const renderItem = ({item}) => {
    const unlockedState = isUnlocked(item);
    const borderColor = unlockedState ? THEME.colors.primary + '40' : THEME.colors.secondary + '40';
    
    return (
      <View style={[styles.cardContainer, { borderColor }]}>
        <LinearGradient 
          colors={['rgba(25, 25, 35, 0.7)', 'rgba(10, 10, 20, 0.8)']} 
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: unlockedState ? THEME.colors.primary + '15' : THEME.colors.secondary + '15' }]}>
              <MaterialCommunityIcons 
                name={item.type === 'audio' ? "waveform" : "text-box-outline"} 
                size={20} 
                color={unlockedState ? THEME.colors.primary : THEME.colors.secondary} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardType}>{item.type === 'audio' ? 'VOICE_LOG' : 'DATA_ENTRY'}</Text>
              <Text style={styles.cardId}>ENTRY_ID: {item.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusTag, { borderColor: unlockedState ? THEME.colors.primary + '60' : THEME.colors.danger + '60' }]}>
              <View style={[styles.statusDot, { backgroundColor: unlockedState ? THEME.colors.primary : THEME.colors.danger }]} />
              <Text style={[styles.statusTagText, { color: unlockedState ? THEME.colors.primary : THEME.colors.danger }]}>
                {unlockedState ? 'DECRYPTED' : 'LOCKED'}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, !unlockedState && styles.lockedText]}>
            {unlockedState ? (item.type === 'text' ? item.text : 'ACTIVE_AUDIO_BROADCAST') : 'ENCRYPTED_DATA_BLOCK_PROTECTED'}
          </Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="security" size={12} color={THEME.colors.textMuted} />
              <Text style={styles.metaText}>PROTOCOL: {item.lockType.toUpperCase()}</Text>
            </View>
            
            {unlockedState ? (
              item.type === 'audio' && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: THEME.colors.primary }]} 
                  onPress={playingId === item.id ? stopAndUnload : () => playAudio(item)}
                >
                  <Ionicons name={playingId === item.id ? "square" : "play"} size={14} color="#000" />
                  <Text style={styles.actionBtnText}>{playingId === item.id ? 'STOP' : 'ACCESS_LOG'}</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: THEME.colors.secondary }]} 
                onPress={()=>tryUnlock(item)}
              >
                <MaterialCommunityIcons name="key-variant" size={16} color="#000" />
                <Text style={styles.actionBtnText}>DECRYPT</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Card corners */}
          <View style={[styles.cardCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: unlockedState ? THEME.colors.primary : THEME.colors.secondary }]} />
          <View style={[styles.cardCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: unlockedState ? THEME.colors.primary : THEME.colors.secondary }]} />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SpaceBackground />
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => router.replace('/(tabs)/claim')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={THEME.colors.primary} />
              </TouchableOpacity>
              <View>
                <Text style={styles.header}>STAR_VAULT</Text>
                <View style={styles.statusRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.subHeader}>SECURE_STORAGE_CONNECTED</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={()=>router.push('/(tabs)/vault/newmessage')}>
              <MaterialCommunityIcons name="plus" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {messages.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="database-off-outline" size={48} color={THEME.colors.primary + '40'} />
              </View>
              <Text style={styles.emptyText}>BİR MESAJ BIRAKILMADI</Text>
              <Text style={styles.emptySubText}>Geleceğe bir zaman kapsülü mühürlemek için butona dokun.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={()=>router.push('/(tabs)/vault/newmessage')}>
                <Text style={styles.emptyBtnText}>YENİ KAYIT OLUŞTUR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList 
              data={messages} 
              keyExtractor={m=>m.id} 
              renderItem={renderItem} 
              contentContainerStyle={{paddingBottom: 120}} 
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Screen HUD Overlay */}
      <View style={styles.screenHud} pointerEvents="none">
        <View style={[styles.hudCorner, { top: 40, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.hudCorner, { top: 40, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />
        <View style={[styles.hudCorner, { bottom: 40, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.hudCorner, { bottom: 40, right: 20, borderBottomWidth: 1, borderRightWidth: 1 }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  header: { 
    color: '#fff', 
    fontSize: 26, 
    fontWeight: '900', 
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.success },
  subHeader: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  backBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'rgba(25, 25, 35, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)'
  },
  newBtn: { 
    backgroundColor: THEME.colors.primary, 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: { padding: 20, minHeight: 140 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardType: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  cardId: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'monospace', marginTop: 2 },
  statusTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusTagText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 20, lineHeight: 22 },
  lockedText: { color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  cardCorner: { position: 'absolute', width: 10, height: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(25, 25, 35, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 24, letterSpacing: 3 },
  emptySubText: { color: THEME.colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 18 },
  emptyBtn: { marginTop: 32, backgroundColor: 'rgba(0, 242, 254, 0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: THEME.colors.primary },
  emptyBtnText: { color: THEME.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  screenHud: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  hudCorner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(0, 242, 254, 0.2)' }
})
