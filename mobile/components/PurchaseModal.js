import React, {useState, useRef, useEffect} from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, ActivityIndicator, Alert } from 'react-native';
import GoldButton from './GoldButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CONFIG } from '../constants/Config';
import { SecurityService } from '../lib/security';

export default function PurchaseModal({visible, onClose, star, onPurchaseSuccess}){
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const generateCertificate = async ()=>{
    try{
      const html = `
        <html>
        <body style="background:#050505; color:#fff; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; padding: 40px;">
          <div style="border: 10px double #C9A84C; padding: 40px; border-radius: 20px;">
            <h1 style="color:#C9A84C; font-size: 42px; margin-bottom: 0;">StarClaim</h1>
            <p style="color:#C9A84C; letter-spacing: 4px; font-size: 14px; margin-top: 5px;">ETERNAL COVENANT CERTIFICATE</p>
            <div style="margin: 50px 0;">
              <p style="font-size: 18px; opacity: 0.8;">This document confirms that the star</p>
              <h2 style="font-size: 48px; margin: 10px 0; color: #fff;">${(name||'NEW STAR').toUpperCase()}</h2>
              <p style="font-size: 18px; opacity: 0.8;">has been claimed by the bearer of this soul-bound record.</p>
            </div>
            <div style="border-top: 1px solid rgba(201,168,76,0.3); padding-top: 20px; font-size: 12px; color: #8A8A9A;">
              <p>STAR_ID: ${star?.star_id || star?.id || 'ALPHA-CENTAURI'}</p>
              <p>COORDINATES: RA ${star?.ra?.toFixed(2) || '0.00'} | DEC ${star?.dec?.toFixed(2) || '0.00'}</p>
              <p>RECORD_DATE: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
        </html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    }catch(e){ Alert.alert('HATA', 'Sertifika oluşturulamadı: ' + String(e)); }
  }

  useEffect(()=>{
    if(visible){ setStep(1); setName(star?.proper || star?.name || ''); setSelected(null); }
  },[visible, star])

  useEffect(()=>{
    if(step===3){
      Animated.spring(scale,{toValue:1,useNativeDriver:true, bounciness: 12}).start();
    } else {
      scale.setValue(0);
    }
  },[step])

  const handlePurchase = async () => {
    if(!selected) {
      Alert.alert('UYARI', 'Lütfen bir ödeme yöntemi seçin.');
      return;
    }
    
    setLoading(true);
    try {
      // Get session
      const session = await SecurityService.getSession();
      if (!session || !session.user) {
        Alert.alert('HATA', 'Satın alma için cüzdanınızı bağlamanız gerekiyor.');
        setLoading(false);
        return;
      }

      // Backend API call
      const response = await fetch(`${CONFIG.API_URL}/api/stars/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token || ''}` // session token might be stored differently
        },
        body: JSON.stringify({
          star_id: star?.star_id || star?.id,
          custom_name: name || star?.proper || star?.name,
          payment_method: selected
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Satın alma işlemi başarısız oldu.');
      }

      // Successful purchase
      const purchasesRaw = await AsyncStorage.getItem('@purchases');
      const purchases = purchasesRaw ? JSON.parse(purchasesRaw) : [];
      const rec = {
        id: data.order_id || Date.now().toString(),
        starId: star?.star_id || star?.id,
        name: name || star?.proper || star?.name || 'Yeni Yıldız',
        method: selected,
        date: new Date().toISOString(),
      };
      
      purchases.unshift(rec);
      await AsyncStorage.setItem('@purchases', JSON.stringify(purchases));
      
      // Automatic Vault Integration
      try {
        const vaultMessagesRaw = await AsyncStorage.getItem('@vault_messages');
        const vaultMessages = vaultMessagesRaw ? JSON.parse(vaultMessagesRaw) : [];
        vaultMessages.unshift({
          id: 'welcome-' + Date.now(),
          type: 'text',
          text: `SİSTEM MESAJI: ${name.toUpperCase()} yıldızı başarıyla tescil edildi. Ebedi mirasınızın ilk parçası StarVault'a eklendi.`,
          lockType: 'none',
          date: new Date().toISOString(),
        });
        await AsyncStorage.setItem('@vault_messages', JSON.stringify(vaultMessages));
      } catch (vErr) {
        console.warn('Vault integration failed', vErr);
      }
      
      if(onPurchaseSuccess) onPurchaseSuccess(rec);
      setStep(3);
    } catch (e) {
      console.error('Purchase error:', e);
      Alert.alert('SİSTEM HATASI', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step===1 && (
            <View>
              <Text style={styles.h}>YILDIZA İSİM VER</Text>
              <Text style={styles.sub}>Bu isim sertifikada ve haritada görünecek.</Text>
              <TextInput 
                placeholder="Yıldızın yeni adı..." 
                placeholderTextColor="#555"
                value={name} 
                onChangeText={setName} 
                style={styles.input} 
              />
              <GoldButton title="DEVAM ET" onPress={()=>setStep(2)} />
              <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                <Text style={styles.cancelText}>İPTAL ET</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {step===2 && (
            <View>
              <Text style={styles.h}>ÖDEME YÖNTEMİ</Text>
              <Text style={styles.sub}>Kayıt ücreti: $12.00</Text>
              
              <TouchableOpacity 
                style={[styles.payBtn, selected==='stripe' && styles.payBtnActive]} 
                onPress={()=>setSelected('stripe')}
              >
                <Text style={[styles.payBtnText, selected==='stripe' && styles.payBtnTextActive]}>Kredi Kartı (Stripe)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.payBtn, selected==='solana' && styles.payBtnActive]} 
                onPress={()=>setSelected('solana')}
              >
                <Text style={[styles.payBtnText, selected==='solana' && styles.payBtnTextActive]}>Solana (SOL)</Text>
              </TouchableOpacity>
              
              <View style={{height: 12}} />
              
              <GoldButton 
                title={loading ? "İŞLENİYOR..." : "ÖDEMEYİ TAMAMLA"} 
                onPress={handlePurchase}
                disabled={loading}
              />
              
              {loading && <ActivityIndicator style={{marginTop:12}} color='#C9A84C' />}
              
              <TouchableOpacity style={styles.cancelLink} onPress={()=>setStep(1)}>
                <Text style={styles.cancelText}>GERİ GİT</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {step===3 && (
            <View style={{alignItems:'center'}}>
              <Animated.View style={{transform:[{scale}], alignItems: 'center'}}>
                <Text style={styles.hSuccess}>TEBRİKLER!</Text>
                <Text style={styles.successDesc}>
                  "{name.toUpperCase()}" artık sonsuza dek sizin adınıza tescillendi.
                </Text>
              </Animated.View>
              
              <View style={styles.certificatePreview}>
                <Text style={styles.certLabel}>OFFICIAL_RECORD</Text>
                <Text style={styles.certStarName}>{name.toUpperCase()}</Text>
                <Text style={styles.certMeta}>REGID: {star?.star_id || 'ALPHA-01'}</Text>
              </View>
              
              <TouchableOpacity style={styles.shareBtn} onPress={generateCertificate}>
                <Text style={styles.shareBtnText}>SERTİFİKAYI PAYLAŞ / İNDİR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                <Text style={styles.finishBtnText}>TAMAMLA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop:{flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center'},
  card:{width:'85%', backgroundColor:'#050A1A', padding:24, borderRadius:20, borderWidth:1, borderColor:'rgba(201,168,76,0.3)'},
  h:{color:'#fff', fontSize:22, fontWeight:'900', letterSpacing:2, textAlign:'center', marginBottom:8},
  sub:{color:'#8A8A9A', fontSize:12, textAlign:'center', marginBottom:20},
  input:{backgroundColor:'rgba(255,255,255,0.05)', color:'#fff', padding:16, marginBottom:20, borderRadius:12, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', fontSize:16},
  payBtn:{backgroundColor:'rgba(255,255,255,0.03)', padding:16, borderRadius:12, marginBottom:12, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.08)'},
  payBtnActive:{borderColor:'#C9A84C', backgroundColor:'rgba(201,168,76,0.1)'},
  payBtnText:{color:'#8A8A9A', fontWeight:'700', fontSize:14},
  payBtnTextActive:{color:'#fff'},
  cancelLink:{marginTop:20, alignItems:'center'},
  cancelText:{color:'#5A6A8A', fontSize:11, fontWeight:'700', letterSpacing:1},
  
  hSuccess:{color:'#C9A84C', fontSize:28, fontWeight:'900', letterSpacing:4, marginBottom:10},
  successDesc:{color:'#fff', textAlign:'center', fontSize:14, opacity:0.8, lineHeight:20, marginBottom:24},
  certificatePreview:{width:'100%', backgroundColor:'#000', borderWidth:1, borderColor:'rgba(201,168,76,0.5)', padding:20, borderRadius:12, alignItems:'center', marginBottom:24},
  certLabel:{color:'#C9A84C', fontSize:8, fontWeight:'900', letterSpacing:3, marginBottom:12},
  certStarName:{color:'#fff', fontSize:20, fontWeight:'900', letterSpacing:1, marginBottom:4},
  certMeta:{color:'#5A6A8A', fontSize:9, fontWeight:'bold'},
  shareBtn:{backgroundColor:'#C9A84C', width:'100%', padding:16, borderRadius:12, alignItems:'center', marginBottom:12},
  shareBtnText:{color:'#000', fontWeight:'900', fontSize:12, letterSpacing:1},
  finishBtn:{width:'100%', padding:16, borderRadius:12, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.1)'},
  finishBtnText:{color:'#fff', fontWeight:'700', fontSize:12}
})
