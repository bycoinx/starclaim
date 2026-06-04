import React, {useEffect, useState, useRef} from 'react';
import { SafeAreaView, Text, StyleSheet, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import SpaceBackground from '../../../components/SpaceBackground';
import LanguagePicker from '../../../components/LanguagePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';

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
        Alert.alert('Açıldı','Mesaj açıldı.');
      } else {
        Alert.alert('Kilidi aşamazsınız','Kilit tarihi henüz gelmedi.');
      }
      return;
    }

    if(item.lockType === 'person'){
      try{
        const res = await LocalAuthentication.authenticateAsync({promptMessage:'Kimlik doğrulaması yapın'});
        if(res.success) { await setUnlockedFor(item.id); Alert.alert('Açıldı','Kullanıcı doğrulandı.'); }
        else Alert.alert('Başarısız','Doğrulama başarısız.');
      }catch(e){ Alert.alert('Hata',String(e)); }
      return;
    }

    // conditional or unknown: ask user to confirm (simulation)
    Alert.alert('Kilidi aç', 'Koşullu kilidi manuel olarak açmak istiyor musunuz?', [
      {text:'Hayır'},
      {text:'Evet', onPress: async ()=>{ await setUnlockedFor(item.id); Alert.alert('Açıldı'); }}
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
    if(!isUnlocked(item)) return Alert.alert('Kilidi Aç', 'Önce kilidi açmalısınız.');
    try{
      if(soundRef.current){ await stopAndUnload(); }
      const { sound } = await Audio.Sound.createAsync({ uri: item.audioUri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item.id);
      sound.setOnPlaybackStatusUpdate((status)=>{
        if(status.didJustFinish) stopAndUnload();
      })
    }catch(e){ console.warn(e); Alert.alert('Oynatma hatası', String(e)); }
  }

  const stopAudio = async ()=>{ await stopAndUnload(); }

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.type === 'text' ? item.text : '🔊 Ses Mesajı'}</Text>
      <Text style={styles.meta}>Kilit: {item.lockType} {item.lockValue || ''}</Text>
      {!isUnlocked(item) ? (
        <View style={{flexDirection:'row',marginTop:8}}>
          <TouchableOpacity style={styles.unlockBtn} onPress={()=>tryUnlock(item)}><Text style={{color:'#000'}}>Kilidi Aç</Text></TouchableOpacity>
          <Text style={{color:'#8A8A9A',alignSelf:'center',marginLeft:8}}>Şu an kilitli</Text>
        </View>
      ) : (
        <View style={{flexDirection:'row',marginTop:8}}>
          {item.type === 'audio' ? (
            playingId === item.id ? (
              <TouchableOpacity style={styles.playBtn} onPress={stopAudio}><Text style={{color:'#fff'}}>Durdur</Text></TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.playBtn} onPress={()=>playAudio(item)}><Text style={{color:'#fff'}}>Oynat</Text></TouchableOpacity>
            )
          ) : null}
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <LanguagePicker style={{position:'absolute', top:12, right:12}} />
      <View style={styles.headerRow}>
        <Text style={styles.header}>Kilitlemiş Mesajlar</Text>
        <TouchableOpacity style={styles.newBtn} onPress={()=>router.push('./newmessage')}>
          <Text style={styles.newBtnText}>Yeni Mesaj</Text>
        </TouchableOpacity>
      </View>

      {messages.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Kayıtlı kilitli mesaj yok.</Text></View>
      ) : (
        <FlatList data={messages} keyExtractor={m=>m.id} renderItem={renderItem} contentContainerStyle={{padding:16}} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({container:{flex:1,backgroundColor:'#000'}, header:{color:'#C9A84C',fontSize:18,fontWeight:'900'}, headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16}, newBtn:{backgroundColor:'#C9A84C',padding:10,borderRadius:8}, newBtnText:{color:'#000',fontWeight:'700'}, card:{backgroundColor:'#0A0A0F',padding:12,borderRadius:12,marginBottom:12}, title:{color:'#fff',fontWeight:'700'}, meta:{color:'#8A8A9A',fontSize:12}, empty:{flex:1,justifyContent:'center',alignItems:'center'}, emptyText:{color:'#8A8A9A'}})
