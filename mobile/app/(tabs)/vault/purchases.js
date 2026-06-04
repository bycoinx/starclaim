import React, {useEffect, useState} from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import SpaceBackground from '../../../components/SpaceBackground';
import LanguagePicker from '../../../components/LanguagePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function PurchasesScreen(){
  const [purchases, setPurchases] = useState([]);
  const router = useRouter();

  useEffect(()=>{ load(); },[])
  const load = async ()=>{
    try{ const raw = await AsyncStorage.getItem('@purchases'); setPurchases(raw?JSON.parse(raw):[]); }catch(e){ console.warn(e); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <LanguagePicker style={{position:'absolute', top:12, right:12}} />
      <View style={styles.header}><Text style={styles.h}>Satın Alma Geçmişi</Text></View>
      {purchases.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Satınalma kaydı yok.</Text></View>
      ) : (
        <FlatList data={purchases} keyExtractor={p=>p.id} contentContainerStyle={{padding:16}} renderItem={({item})=> (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()} • {item.method}</Text>
          </View>
        )} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({container:{flex:1,backgroundColor:'#000'}, header:{padding:16}, h:{color:'#C9A84C',fontSize:18,fontWeight:'900'}, empty:{flex:1,justifyContent:'center',alignItems:'center'}, emptyText:{color:'#8A8A9A'}, card:{backgroundColor:'#0A0A0F',padding:12,borderRadius:12,marginBottom:12}, name:{color:'#fff',fontWeight:'700'}, meta:{color:'#8A8A9A',fontSize:12}})
