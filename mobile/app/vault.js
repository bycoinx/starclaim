import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { decryptData } from '../lib/crypto';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Vault() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
        setError('');
      }
    } catch (err) {
      console.error('File picking error:', err);
    }
  };

  const handleDecrypt = async () => {
    if (!file || !password) return;

    setIsDecrypting(true);
    setError('');
    setDecryptedContent('');
    
    try {
      const content = await decryptData(file.uri, password);
      setDecryptedContent(content);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Şifre çözme başarısız. Yanlış şifre veya bozuk dosya.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>

      <Text style={styles.title}>VAULT CORE</Text>
      <Text style={styles.subtitle}>Verilerinizi Güvenle Çözün</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
          <Ionicons 
            name={file ? "document-lock" : "cloud-upload-outline"} 
            size={40} 
            color={file ? "#00ccff" : "#fff"} 
          />
          <Text style={styles.filePickerText}>
            {file ? file.name : ".vault dosyasını seçin"}
          </Text>
          {file && (
            <Text style={styles.fileSize}>
              {(file.size / 1024).toFixed(2)} KB
            </Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Vault Şifresi"
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.decryptButton, (!file || !password) && styles.disabledButton]}
          onPress={handleDecrypt}
          disabled={isDecrypting || !file || !password}
        >
          {isDecrypting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.decryptButtonText}>ŞİFREYİ ÇÖZ</Text>
          )}
        </TouchableOpacity>
      </View>

      {decryptedContent ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Çözülen İçerik:</Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{decryptedContent}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#00ccff',
    fontSize: 14,
    marginBottom: 30,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filePicker: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  filePickerText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  fileSize: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 5,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  decryptButton: {
    backgroundColor: '#00ccff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  decryptButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 15,
    fontSize: 12,
    textAlign: 'center',
  },
  resultCard: {
    marginTop: 30,
    animateIn: 'fade-in',
  },
  resultTitle: {
    color: '#00ccff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  resultBox: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,204,255,0.2)',
  },
  resultText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
