import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import SpaceBackground from '../../../components/SpaceBackground';
import LanguagePicker from '../../../components/LanguagePicker';

export default function StarProfileScreen(){
  return (
    <SafeAreaView style={styles.container}>
      <SpaceBackground />
      <LanguagePicker style={{position:'absolute', top:12, right:12}} />
      <Text style={styles.text}>Star Profile - placeholder</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({container:{flex:1,backgroundColor:'#000'}, text:{color:'#fff',alignSelf:'center',marginTop:40}})
