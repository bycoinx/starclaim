import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Stars() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>STAR VIEWER</Text>
      <Text style={styles.text}>Modül 3.2: AR Star Viewer yakında burada olacak.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#00ccff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
});
