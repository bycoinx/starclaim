import React, {useState, useRef} from 'react';
import { SafeAreaView, Text, StyleSheet, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import SpaceBackground from '../../../components/SpaceBackground';
import LanguagePicker from '../../../components/LanguagePicker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function NewMessageScreen(){
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [lockType, setLockType] = useState('date');
  const [lockValue, setLockValue] = useState('');
  const router = useRouter();

  const startRecording = async ()=>{
    try{
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    }catch(e){ Alert.alert('Recording error', String(e)); }
  }

  const stopRecording = async ()=>{
    try{
      if(!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    }catch(e){ Alert.alert('Stop error', String(e)); }
  }

  const save = async ()=>{
      const id = Date.now().toString();
    const msg = { id, type: audioUri ? 'audio' : 'text', text, audioUri, lockType, lockValue, createdAt: Date.now() };
    try{
      const raw = await AsyncStorage.getItem('@vault_messages');
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(msg);
      await AsyncStorage.setItem('@vault_messages', JSON.stringify(arr));
      router.back();
    }catch(e){ Alert.alert('Save failed', String(e)); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <LanguagePicker style={{position:'absolute', top:12, right:12}} />
      <View style={styles.form}>
        <Text style={styles.label}>Mesaj metni</Text>
        <TextInput style={styles.input} placeholder="Mesajınızı yazın" value={text} onChangeText={setText} multiline numberOfLines={4} />

        <Text style={styles.label}>Ses kaydı</Text>
        <View style={{flexDirection:'row',gap:8}}>
          <TouchableOpacity style={styles.recBtn} onPress={recording ? stopRecording : startRecording}>
            <Text style={{color:'#fff'}}>{recording ? 'Durdur' : 'Kaydet'}</Text>
          </TouchableOpacity>
          {audioUri ? <Text style={{color:'#8A8A9A',alignSelf:'center'}}>Kayıt: {audioUri.split('/').pop()}</Text> : null}
        </View>

        <Text style={styles.label}>Kilit koşulu</Text>
        <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
          <TouchableOpacity style={[styles.lockBtn, lockType==='date' && styles.lockBtnActive]} onPress={()=>setLockType('date')}><Text style={lockType==='date'?{color:'#000'}:{color:'#fff'}}>Tarih</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.lockBtn, lockType==='person' && styles.lockBtnActive]} onPress={()=>setLockType('person')}><Text style={lockType==='person'?{color:'#000'}:{color:'#fff'}}>Kişi</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.lockBtn, lockType==='conditional' && styles.lockBtnActive]} onPress={()=>setLockType('conditional')}><Text style={lockType==='conditional'?{color:'#000'}:{color:'#fff'}}>Koşul</Text></TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder="Kilit değeri (tarih/kişi/koşul)" value={lockValue} onChangeText={setLockValue} />

        <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={{color:'#000',fontWeight:'900'}}>Kaydet</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#000'},
  form:{padding:16},
  label:{color:'#8A8A9A',marginBottom:8,fontSize:12},
  input:{backgroundColor:'#0A0A0F',color:'#fff',padding:12,borderRadius:8,marginBottom:12,minHeight:44},
  recBtn:{backgroundColor:'#222',padding:12,borderRadius:8},
  lockBtn:{backgroundColor:'rgba(255,255,255,0.04)',padding:10,borderRadius:8},
  lockBtnActive:{backgroundColor:'#C9A84C'},
  saveBtn:{backgroundColor:'#C9A84C',padding:14,borderRadius:10,alignItems:'center',marginTop:12}
})
