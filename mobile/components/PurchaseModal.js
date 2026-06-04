import React, {useState, useRef, useEffect} from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, ActivityIndicator } from 'react-native';
import GoldButton from './GoldButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PurchaseModal({visible, onClose}){
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const generateCertificate = async ()=>{
    try{
      const html = `
        <html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
          <h1 style="color:#C9A84C">StarClaim Sertifikası</h1>
          <h2 style="margin-top:20px">${(name||'YENI YILDIZ').toUpperCase()}</h2>
          <p style="margin-top:12px">Sahiplik onayı: ${new Date().toLocaleString()}</p>
        </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if(!(await Sharing.isAvailableAsync())){
        alert('Paylaşma kullanılamıyor. Dosya kaydedildi: ' + uri);
        return;
      }
      await Sharing.shareAsync(uri);
    }catch(e){ alert('Sertifika oluşturulamadı: ' + String(e)); }
  }

  useEffect(()=>{
    if(visible){ setStep(1); setName(''); }
  },[visible])

  useEffect(()=>{
    if(step===3){
      Animated.spring(scale,{toValue:1,useNativeDriver:true}).start();
    } else {
      scale.setValue(0);
    }
  },[step])

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step===1 && (
            <View>
              <Text style={styles.h}>1. Yıldıza isim ver</Text>
              <TextInput placeholder="Yıldız adı" value={name} onChangeText={setName} style={styles.input} />
              <GoldButton title="İleri" onPress={()=>setStep(2)} />
            </View>
          )}
          {step===2 && (
            <View>
              <Text style={styles.h}>2. Ödeme seç</Text>
              <TouchableOpacity style={[styles.payBtn, selected==='stripe'&&{borderWidth:1,borderColor:'#C9A84C'}]} onPress={()=>setSelected('stripe')}><Text style={{color:'#fff'}}>Stripe</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.payBtn, selected==='solana'&&{borderWidth:1,borderColor:'#C9A84C'}]} onPress={()=>setSelected('solana')}><Text style={{color:'#fff'}}>Solana</Text></TouchableOpacity>
              <GoldButton title="Öde ve Tamamla" onPress={async ()=>{
                if(!selected) return; setLoading(true);
                // simulate payment
                setTimeout(async ()=>{
                  try{
                    const purchasesRaw = await AsyncStorage.getItem('@purchases');
                    const purchases = purchasesRaw ? JSON.parse(purchasesRaw) : [];
                    const rec = { id: Date.now().toString(), name: name||'Yeni Yıldız', method: selected, createdAt: Date.now() };
                    purchases.unshift(rec);
                    await AsyncStorage.setItem('@purchases', JSON.stringify(purchases));
                    setLoading(false);
                    setStep(3);
                  }catch(e){ setLoading(false); alert('Kaydedilemedi'); }
                }, 1200)
              }} />
              {loading ? <ActivityIndicator style={{marginTop:12}} color='#C9A84C' /> : null}
            </View>
          )}
          {step===3 && (
            <View style={{alignItems:'center'}}>
              <Animated.View style={{transform:[{scale}]}}>
                <Text style={styles.h}>Tebrikler!</Text>
                <Text style={{color:'#fff',marginTop:8}}>"{name||'Yeni Yıldız'}" artık sizin.</Text>
              </Animated.View>
              <View style={{height:12}} />
              <View style={styles.certificate}>
                <Text style={styles.certTitle}>StarClaim Sertifikası</Text>
                <Text style={styles.certName}>{name || 'YENI YILDIZ'}</Text>
              </View>
              <View style={{height:8}} />
              <TouchableOpacity style={[styles.payBtn,{alignSelf:'stretch'}]} onPress={generateCertificate}><Text style={{color:'#fff',textAlign:'center'}}>Sertifikayı İndir / Paylaş</Text></TouchableOpacity>
              <View style={{height:12}} />
              <GoldButton title="Kapat" onPress={onClose} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'center',alignItems:'center'},
  card:{width:'90%',backgroundColor:'#0A0A0F',padding:20,borderRadius:12},
  h:{color:'#C9A84C',fontSize:18,fontWeight:'700'},
  input:{backgroundColor:'#111',color:'#fff',padding:10,marginVertical:12,borderRadius:8},
  payBtn:{backgroundColor:'#222',padding:12,borderRadius:8,marginVertical:8,alignItems:'center'}
  ,certificate:{marginTop:8,backgroundColor:'#000',borderWidth:1,borderColor:'#C9A84C',padding:12,borderRadius:8,alignItems:'center'},
  certTitle:{color:'#C9A84C',fontWeight:'900',marginBottom:6},
  certName:{color:'#fff',fontWeight:'900',fontSize:16}
})
