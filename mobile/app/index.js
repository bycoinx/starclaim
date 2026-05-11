import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>STARCLAIM</Text>
          <Text style={styles.subtitle}>Sonsuzluğa Hoş Geldiniz</Text>
          
          <Link href="/stars" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>KEŞFETMEYE BAŞLA</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/vault" asChild>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>VAULT CORE</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 100,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 10,
    marginBottom: 10,
  },
  subtitle: {
    color: '#00ccff',
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 50,
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#00ccff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
