import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/Theme';

export default function GoldButton({title, onPress, outline}){
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, outline ? styles.outline : styles.solid]}>
      <Text style={[styles.txt, outline ? styles.outlineTxt : styles.solidTxt]}>{title.toUpperCase()}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  solid: {
    backgroundColor: THEME.colors.secondary,
    borderColor: THEME.colors.secondary,
    shadowColor: THEME.colors.secondary,
  },
  outline: {
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderColor: THEME.colors.secondary,
    shadowColor: THEME.colors.secondary,
  },
  txt: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  solidTxt: {
    color: '#000',
  },
  outlineTxt: {
    color: THEME.colors.secondary,
  }
})
