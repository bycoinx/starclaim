import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { decryptData } from '../lib/crypto';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

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
      setError('DECRYPTION_FAILED: INVALID_KEY_OR_CORRUPT_BUFFER');
    } finally {
      setIsDecrypting(false);
    }
  };

  const LeftWing = (
    <View style={styles.wing}>
      <TouchableOpacity 
        style={styles.backBtn} 
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      >
        <Ionicons name="chevron-back" size={20} color={THEME.colors.primary} />
        <Text style={styles.backText}>RETURN_HOME</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <Text style={styles.wingTitle}>VAULT_STATUS</Text>
      <View style={styles.statusBox}>
         <View style={[styles.statusDot, { backgroundColor: decryptedContent ? THEME.colors.accent : THEME.colors.secondary }]} />
         <Text style={styles.statusLabel}>{decryptedContent ? 'SECURE_REVEAL' : 'ENCRYPTED_IDLE'}</Text>
      </View>
    </View>
  );

  return (
    <CockpitLayout leftWing={LeftWing}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
           <Text style={styles.title}>VAULT_CORE_v2.0</Text>
           <Text style={styles.subtitle}>QUANTUM_ENCRYPTION_ACCESS_PORTAL</Text>
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
              <Ionicons 
                name={file ? "document-lock" : "cloud-upload-outline"} 
                size={32} 
                color={file ? THEME.colors.primary : 'rgba(255,255,255,0.4)'} 
              />
              <Text style={styles.filePickerText}>
                {file ? file.name.toUpperCase() : "SELECT_VAULT_FILE"}
              </Text>
              {file && (
                <Text style={styles.fileSize}>
                  SIZE: {(file.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="ENTER_DECRYPTION_KEY"
              placeholderTextColor="rgba(255,255,255,0.2)"
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
                <Text style={styles.decryptButtonText}>INITIATE_DECRYPTION</Text>
              )}
            </TouchableOpacity>
          </View>

          {decryptedContent ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>DECRYPTED_DATA_RECOVERY:</Text>
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{decryptedContent}</Text>
              </View>
            </View>
          ) : (
             <View style={styles.emptyCard}>
                <Ionicons name="shield-outline" size={40} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyText}>WAITING_FOR_VALID_KEY...</Text>
             </View>
          )}
        </View>
      </ScrollView>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 30 },
  wing: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  backText: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  wingTitle: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  
  header: { marginBottom: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  subtitle: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold', opacity: 0.8, letterSpacing: 2 },
  
  mainGrid: { flexDirection: 'row', gap: 20 },
  card: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filePicker: { height: 120, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(0, 204, 255, 0.2)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  filePickerText: { color: '#fff', marginTop: 10, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  fileSize: { color: THEME.colors.textMuted, fontSize: 8, marginTop: 4 },
  input: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 5, padding: 12, color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', fontSize: 12, fontFamily: 'System' },
  decryptButton: { backgroundColor: THEME.colors.primary, padding: 15, borderRadius: 5, alignItems: 'center' },
  disabledButton: { opacity: 0.3 },
  decryptButtonText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  errorText: { color: THEME.colors.danger, marginBottom: 15, fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  
  resultCard: { flex: 1.2 },
  resultTitle: { color: THEME.colors.accent, fontSize: 9, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 },
  resultBox: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)', minHeight: 200 },
  resultText: { color: '#fff', fontFamily: 'System', fontSize: 12, lineHeight: 18 },
  emptyCard: { flex: 1.2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 15 },
});
