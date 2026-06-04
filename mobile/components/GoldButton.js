import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function GoldButton({title, onPress, outline}){
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, outline && styles.outline]}>
      <Text style={[styles.txt, outline && styles.outlineTxt]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn:{
    backgroundColor:'#C9A84C',
    paddingVertical:12,
    paddingHorizontal:20,
    borderRadius:10,
    marginHorizontal:8
  },
  txt:{
    color:'#000',
    fontWeight:'700'
  },
  outline:{
    backgroundColor:'transparent',
    borderWidth:1,
    borderColor:'#C9A84C'
  },
  outlineTxt:{
    color:'#C9A84C'
  }
})
