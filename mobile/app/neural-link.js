import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CONFIG } from '../constants/Config';
import { getOwnershipPurchases } from '../src/data/ownershipSnapshot';

export default function NeuralLink() {
  const [session, setSession] = useState('');
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [subscription, setSubscription] = useState(null);
  const [ws, setWs] = useState(null);
  
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'telemetry'
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'AEGIS_NEURAL_LINK ACTIVE. WELCOME EXPLORER. QUANTUM SYSTEMS STABILIZED. HOW CAN I ASSIST YOUR VOYAGE?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();
  
  const router = useRouter();

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

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const stars = await getOwnershipPurchases();
      const starNames = stars.map(s => s.name).join(', ');
      
      const contextPrefix = stars.length > 0 
        ? `[System Info: User owns stars: ${starNames}] ` 
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
        content: (data.reply || 'İletişim kopukluğu yaşandı, Sir.').toUpperCase()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'QUANTUM_SERVERS_UNREACHABLE. STANDBY.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const LeftWing = (
    <View style={styles.wing}>
      <TouchableOpacity 
        style={styles.wingBackBtn} 
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      >
        <MaterialCommunityIcons name="power" size={20} color={THEME.colors.primary} />
        <Text style={styles.backText}>DISCONNECT</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      
      <Text style={styles.wingTitle}>LINK_MODE</Text>
      <TouchableOpacity 
        style={[styles.modeBtn, activeTab === 'chat' && styles.modeBtnActive]} 
        onPress={() => setActiveTab('chat')}
      >
        <MaterialCommunityIcons name="brain" size={18} color={activeTab === 'chat' ? '#000' : THEME.colors.primary} />
        <Text style={[styles.modeBtnText, activeTab === 'chat' && styles.modeBtnTextActive]}>AEGIS_AI</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modeBtn, activeTab === 'telemetry' && styles.modeBtnActive]} 
        onPress={() => setActiveTab('telemetry')}
      >
        <MaterialCommunityIcons name="pulse" size={18} color={activeTab === 'telemetry' ? '#000' : THEME.colors.purple} />
        <Text style={[styles.modeBtnText, activeTab === 'telemetry' && styles.modeBtnTextActive]}>TELEMETRY</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.wingTitle}>BRIDGE_STATUS</Text>
      <View style={[styles.statusBox, { borderColor: connected ? THEME.colors.primary + '40' : THEME.colors.danger + '40' }]}>
         <View style={[styles.statusDot, { backgroundColor: connected ? THEME.colors.primary : THEME.colors.danger }]} />
         <Text style={[styles.statusLabel, { color: connected ? THEME.colors.primary : THEME.colors.danger }]}>{connected ? 'SYNC_LOCKED' : 'NO_SIGNAL'}</Text>
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
                  <LinearGradient 
                    colors={item.role === 'user' ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] : [THEME.colors.primary + '15', 'rgba(0,0,0,0.4)']}
                    style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}
                  >
                    <Text style={[styles.messageText, item.role === 'assistant' && styles.aiText]}>{item.content}</Text>
                  </LinearGradient>
                </View>
              )}
            />
            {isTyping && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.typingText}>AEGIS_ANALYZING_QUANTUM_DATA...</Text>
              </View>
            )}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="TRANSMIT_MESSAGE_TO_AEGIS..."
                placeholderTextColor="rgba(0,242,254,0.3)"
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                <MaterialCommunityIcons name="send" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.telemetryView}>
            {!connected ? (
              <View style={styles.setupContainer}>
                <MaterialCommunityIcons name="remote-desktop" size={48} color={THEME.colors.purple} style={{ marginBottom: 20 }} />
                <Text style={styles.title}>HUD_SYNC_INITIALIZE</Text>
                <TextInput
                  style={styles.setupInput}
                  placeholder="INPUT_SESSION_KEY"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={session}
                  onChangeText={setSession}
                />
                <TouchableOpacity style={styles.initBtn} onPress={connectBridge}>
                  <LinearGradient colors={[THEME.colors.purple, THEME.colors.purple + '80']} style={styles.initGradient}>
                    <Text style={styles.initBtnText}>ESTABLISH_BRIDGE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeTelemetry}>
                <View style={styles.telemetryGrid}>
                  <TelemetryCard val={data.beta.toFixed(3)} label="PITCH" color={THEME.colors.primary} />
                  <TelemetryCard val={data.gamma.toFixed(3)} label="ROLL" color={THEME.colors.secondary} />
                  <TelemetryCard val={data.alpha.toFixed(3)} label="YAW" color={THEME.colors.purple} />
                </View>
                <TouchableOpacity style={styles.terminateBtn} onPress={() => ws && ws.close()}>
                  <Text style={styles.terminateText}>TERMINATE_LINK</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </CockpitLayout>
  );
}

function TelemetryCard({ val, label, color }) {
  return (
    <View style={[styles.telemetryCard, { borderColor: color + '40' }]}>
      <Text style={[styles.telemetryVal, { color }]}>{val}</Text>
      <Text style={styles.telemetryLabel}>{label}</Text>
      <View style={[styles.cardCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  wing: { flex: 1, padding: 8 },
  wingBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(255,0,0,0.05)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,0,0,0.1)' },
  backText: { color: THEME.colors.danger, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginVertical: 15 },
  wingTitle: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: 1, shadowRadius: 4 },
  statusLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modeBtnActive: { backgroundColor: THEME.colors.glassAccent, borderColor: THEME.colors.primary },
  modeBtnText: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modeBtnTextActive: { color: '#fff' },

  chatContainer: { flex: 1, padding: 20 },
  messageList: { paddingBottom: 24 },
  messageWrapper: { marginVertical: 10, flexDirection: 'row' },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '85%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  userBubble: { borderBottomRightRadius: 2 },
  aiBubble: { borderBottomLeftRadius: 2, borderColor: THEME.colors.primary + '30' },
  messageText: { color: '#fff', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  aiText: { color: THEME.colors.primary, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12, marginBottom: 12 },
  typingText: { color: THEME.colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  
  inputContainer: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', backgroundColor: 'rgba(25, 25, 35, 0.8)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: THEME.colors.primary + '30' },
  chatInput: { flex: 1, color: '#fff', fontSize: 14, maxHeight: 120, paddingTop: 8, fontWeight: '600' },
  sendBtn: { backgroundColor: THEME.colors.primary, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.colors.primary, shadowOpacity: 0.5, shadowRadius: 8 },

  telemetryView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  setupContainer: { width: '100%', alignItems: 'center', padding: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 6, marginBottom: 24, fontFamily: 'monospace' },
  setupInput: { width: '80%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 18, color: '#fff', textAlign: 'center', marginBottom: 24, borderWidth: 1, borderColor: THEME.colors.purple + '40', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  initBtn: { borderRadius: 12, overflow: 'hidden' },
  initGradient: { paddingHorizontal: 40, paddingVertical: 18, alignItems: 'center' },
  initBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 2 },

  activeTelemetry: { alignItems: 'center' },
  telemetryGrid: { flexDirection: 'row', gap: 20, marginBottom: 48 },
  telemetryCard: { width: 120, height: 90, backgroundColor: 'rgba(25, 25, 35, 0.7)', borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  telemetryVal: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace' },
  telemetryLabel: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  cardCorner: { position: 'absolute', width: 12, height: 12 },
  terminateBtn: { paddingVertical: 14, paddingHorizontal: 36, borderWidth: 1.5, borderColor: THEME.colors.danger, borderRadius: 10 },
  terminateText: { color: THEME.colors.danger, fontSize: 11, fontWeight: '900', letterSpacing: 2 }
});
