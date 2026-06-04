import React, {useEffect, useState} from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';

const LANGS = ['tr','en','ru','es','zh','de','fr'];

export default function LanguagePicker({style}){
  const [lang, setLang] = useState('tr');

  useEffect(()=>{
    AsyncStorage.getItem('@language').then(l=>{
      if(l){ setLang(l); i18n.changeLanguage(l); }
    })
  },[])

  const next = async ()=>{
    const idx = (LANGS.indexOf(lang)+1)%LANGS.length;
    const nl = LANGS[idx];
    setLang(nl);
    i18n.changeLanguage(nl);
    await AsyncStorage.setItem('@language', nl);
  }

  return (
    <TouchableOpacity onPress={next} style={[styles.wrap, style]}>
      <Text style={styles.txt}>{lang.toUpperCase()}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap:{
    backgroundColor:'#0A0A0F',
    padding:8,
    borderRadius:8,
    borderWidth:1,
    borderColor:'#222'
  },
  txt:{color:'#C9A84C',fontWeight:'700'}
})
