import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NeuralLink() {
  const [session, setSession] = useState('');
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [subscription, setSubscription] = useState(null);
  const [ws, setWs] = useState(null);
  
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'telemetry'
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'Aegis Neural Link aktif. Hoş geldiniz Explorer. Kuantum sistemleri stabilize edildi. Size nasıl yardımcı olabilirim?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();
  
  const router = useRouter();

  // Telemetry logic
  const _subscribe = () => {
    setSubscription(
      DeviceMotion.addListener(motionData => {
        if (motionData.rotation) {
          const { alpha, beta, gamma } = motionData.rotation;
          setData({ alpha, beta, gamma });
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'motion', alpha, beta, gamma }));
          }
        }
      })
    );
    DeviceMotion.setUpdateInterval(50);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const connectBridge = () => {
    if (!session) return;
    const wsBase = CONFIG.API_URL.replace('http', 'ws');
    const wsUrl = `${wsBase}/ws/bridge/${session}`;
    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      setConnected(true);
      setWs(newWs);
      _subscribe();
    };
    newWs.onclose = () => {
      setConnected(false);
      setWs(null);
      _unsubscribe();
    };
    newWs.onerror = (e) => console.warn("WS Error", e);
  };

  useEffect(() => {
    return () => {
      _unsubscribe();
      if (ws) ws.close();
    };
  }, [ws]);

  // Chat logic
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Get context (owned stars)
      const starsRaw = await AsyncStorage.getItem('@purchases');
      const stars = starsRaw ? JSON.parse(starsRaw) : [];
      const starNames = stars.map(s => s.name).join(', ');
      
      const contextPrefix = stars.length > 0 
        ? `[Sistem Bilgisi: Kullanıcı şu yıldızlara sahip: ${starNames}] ` 
        : '';

      const response = await fetch(`${CONFIG.API_URL}/api/ai/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextPrefix + userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          language: 'TR'
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.reply || 'İletişim kopukluğu yaşandı, Sir.' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'Kuantum sunucularına erişilemiyor, Sir.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const LeftWing = (
    <View style={styles.wing}>
      <TouchableOpacity 
        style={styles.backBtn} 
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      >
        <Ionicons name="chevron-back" size={20} color={THEME.colors.primary} />
        <Text style={styles.backText}>CLOSE_LINK</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      
      <Text style={styles.wingTitle}>SİSTEM_MODU</Text>
      <TouchableOpacity 
        style={[styles.modeBtn, activeTab === 'chat' && styles.modeBtnActive]} 
        onPress={() => setActiveTab('chat')}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={activeTab === 'chat' ? '#000' : '#fff'} />
        <Text style={[styles.modeBtnText, activeTab === 'chat' && styles.modeBtnTextActive]}>AEGIS_CHAT</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modeBtn, activeTab === 'telemetry' && styles.modeBtnActive]} 
        onPress={() => setActiveTab('telemetry')}
      >
        <Ionicons name="speedometer-outline" size={16} color={activeTab === 'telemetry' ? '#000' : '#fff'} />
        <Text style={[styles.modeBtnText, activeTab === 'telemetry' && styles.modeBtnTextActive]}>TELEMETRİ</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.wingTitle}>HUD_BRIDGE</Text>
      <View style={styles.statusBox}>
         <View style={[styles.statusDot, { backgroundColor: connected ? THEME.colors.accent : THEME.colors.danger }]} />
         <Text style={styles.statusLabel}>{connected ? 'SYNC_ACTIVE' : 'NOT_SYNCED'}</Text>
      </View>
    </View>
  );

  return (
    <CockpitLayout leftWing={LeftWing}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.viewport}
      >
        {activeTab === 'chat' ? (
          <View style={styles.chatContainer}>
            <FlatList
              ref={scrollViewRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
              renderItem={({ item }) => (
                <View style={[styles.messageWrapper, item.role === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                    <Text style={styles.messageText}>{item.content}</Text>
                  </View>
                </View>
              )}
            />
            {isTyping && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.typingText}>AEGIS_ANALYZING...</Text>
              </View>
            )}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Aegis'e bir mesaj gönder..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                <Ionicons name="send" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.telemetryView}>
            {!connected ? (
              <View style={styles.setupContainer}>
                <Text style={styles.title}>HUD_SYNC</Text>
                <TextInput
                  style={styles.setupInput}
                  placeholder="SESSION_ID"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={session}
                  onChangeText={setSession}
                />
                <TouchableOpacity style={styles.initBtn} onPress={connectBridge}>
                  <Text style={styles.initBtnText}>INITIALIZE_BRIDGE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeTelemetry}>
                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryVal}>{data.beta.toFixed(3)}</Text>
                    <Text style={styles.telemetryLabel}>PITCH</Text>
                  </View>
                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryVal}>{data.gamma.toFixed(3)}</Text>
                    <Text style={styles.telemetryLabel}>ROLL</Text>
                  </View>
                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryVal}>{data.alpha.toFixed(3)}</Text>
                    <Text style={styles.telemetryLabel}>YAW</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.terminateBtn} onPress={() => ws && ws.close()}>
                  <Text style={styles.terminateText}>DISCONNECT</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  wing: { flex: 1, padding: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  backText: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 15 },
  wingTitle: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  modeBtnActive: { backgroundColor: THEME.colors.primary },
  modeBtnText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  modeBtnTextActive: { color: '#000' },

  chatContainer: { flex: 1, padding: 15 },
  messageList: { paddingBottom: 20 },
  messageWrapper: { marginVertical: 8, flexDirection: 'row' },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 16 },
  userBubble: { backgroundColor: 'rgba(255,255,255,0.08)', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: 'rgba(0, 204, 255, 0.1)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(0, 204, 255, 0.2)' },
  messageText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10, marginBottom: 10 },
  typingText: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold' },
  
  inputContainer: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatInput: { flex: 1, color: '#fff', fontSize: 14, maxHeight: 100, paddingTop: 8 },
  sendBtn: { backgroundColor: THEME.colors.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  telemetryView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  setupContainer: { width: '100%', alignItems: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 8, marginBottom: 20 },
  setupInput: { width: '80%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 15, color: '#fff', textAlign: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0, 204, 255, 0.2)' },
  initBtn: { backgroundColor: THEME.colors.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 8 },
  initBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },

  activeTelemetry: { alignItems: 'center' },
  telemetryGrid: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  telemetryCard: { width: 100, height: 80, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  telemetryVal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  telemetryLabel: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: 'bold', marginTop: 4 },
  terminateBtn: { paddingVertical: 12, paddingHorizontal: 30, borderWidth: 1, borderColor: THEME.colors.danger, borderRadius: 8 },
  terminateText: { color: THEME.colors.danger, fontSize: 10, fontWeight: 'bold' }
});
