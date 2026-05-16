import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

export default function Home() {
  const { address, connecting, connect, disconnect } = useSolanaWallet();

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

          <Link href="/neural-link" asChild>
            <TouchableOpacity style={[styles.button, styles.bridgeButton]}>
              <Text style={styles.bridgeText}>NEURAL LINK BRIDGE</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/qr-login" asChild>
            <TouchableOpacity style={[styles.button, styles.quantumButton]}>
              <Text style={styles.quantumText}>QUANTUM LOGIN</Text>
            </TouchableOpacity>
          </Link>

          {address ? (
            <TouchableOpacity style={[styles.button, styles.walletButton]} onPress={disconnect}>
              <Text style={styles.walletText}>CÜZDAN: {address.slice(0, 4)}...{address.slice(-4)}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.walletButton]} 
              onPress={connect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#00ccff" />
              ) : (
                <Text style={styles.walletText}>CÜZDANI BAĞLA</Text>
              )}
            </TouchableOpacity>
          )}
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
    paddingBottom: 60,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 10,
  },
  subtitle: {
    color: '#00ccff',
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#00ccff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bridgeButton: {
    backgroundColor: 'rgba(0, 204, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00ccff',
    shadowColor: '#00ccff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bridgeText: {
    color: '#00ccff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  quantumButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 5,
  },
  quantumText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    opacity: 0.8,
  },
  walletButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00ccff',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  walletText: {
    color: '#00ccff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
