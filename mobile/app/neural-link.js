import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CockpitLayout from '../components/CockpitLayout';
import { THEME } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../constants/Config';

export default function NeuralLink() {
  const [session, setSession] = useState('');
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [subscription, setSubscription] = useState(null);
  const [ws, setWs] = useState(null);
  const router = useRouter();

  const _subscribe = () => {
    setSubscription(
      DeviceMotion.addListener(motionData => {
        if (motionData.rotation) {
          const { alpha, beta, gamma } = motionData.rotation;
          setData({ alpha, beta, gamma });
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'motion',
              alpha,
              beta,
              gamma
            }));
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

    newWs.onerror = (e) => {
      console.warn("WS Error", e);
    };
  };

  useEffect(() => {
    return () => {
      _unsubscribe();
      if (ws) ws.close();
    };
  }, [ws]);

  const LeftWing = (
    <View style={styles.wing}>
      <TouchableOpacity 
        style={styles.backBtn} 
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      >
        <Ionicons name="chevron-back" size={20} color={THEME.colors.primary} />
        <Text style={styles.backText}>CLOSE_BRIDGE</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <Text style={styles.wingTitle}>CONNECTION_STATUS</Text>
      <View style={styles.statusBox}>
         <View style={[styles.statusDot, { backgroundColor: connected ? THEME.colors.accent : THEME.colors.danger }]} />
         <Text style={styles.statusLabel}>{connected ? 'LINK_ESTABLISHED' : 'OFFLINE_MODE'}</Text>
      </View>
    </View>
  );

  return (
    <CockpitLayout leftWing={LeftWing}>
      <View style={styles.viewport}>
        <View style={styles.header}>
           <Text style={styles.title}>NEURAL_LINK_v1.2</Text>
           <Text style={styles.subtitle}>QUANTUM_SPATIAL_GAZE_TRANSMITTER</Text>
        </View>

        {!connected ? (
          <View style={styles.setupContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="ENTER_HUD_SESSION_ID"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={session}
                onChangeText={setSession}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.initBtn} onPress={connectBridge}>
                <Text style={styles.initBtnText}>INITIALIZE_SYNC</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.hintBox}>
               <Ionicons name="information-circle-outline" size={14} color={THEME.colors.secondary} />
               <Text style={styles.hintText}>Session ID can be found in your PC terminal's top-right HUD panel.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryCard}>
                 <Text style={styles.telemetryVal}>{data.beta.toFixed(3)}</Text>
                 <Text style={styles.telemetryLabel}>PITCH_BETA</Text>
              </View>
              <View style={styles.telemetryCard}>
                 <Text style={styles.telemetryVal}>{data.gamma.toFixed(3)}</Text>
                 <Text style={styles.telemetryLabel}>ROLL_GAMMA</Text>
              </View>
              <View style={styles.telemetryCard}>
                 <Text style={styles.telemetryVal}>{data.alpha.toFixed(3)}</Text>
                 <Text style={styles.telemetryLabel}>YAW_ALPHA</Text>
              </View>
            </View>

            <View style={styles.pulseContainer}>
               <View style={styles.syncCircle}>
                  <ActivityIndicator color={THEME.colors.primary} />
                  <Text style={styles.syncText}>STREAMING_TELEMETRY</Text>
               </View>
            </View>

            <TouchableOpacity style={styles.terminateBtn} onPress={() => ws && ws.close()}>
              <Text style={styles.terminateText}>TERMINATE_LINK_PROTOCOL</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </CockpitLayout>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, padding: 30, justifyContent: 'center' },
  wing: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  backText: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20 },
  wingTitle: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 8 },
  subtitle: { color: THEME.colors.primary, fontSize: 8, fontWeight: 'bold', opacity: 0.6, letterSpacing: 3 },

  setupContainer: { alignItems: 'center' },
  inputWrapper: { width: 400, flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0, 204, 255, 0.2)', padding: 15, color: '#fff', textAlign: 'center', fontFamily: 'System', fontSize: 14 },
  initBtn: { backgroundColor: THEME.colors.primary, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 5 },
  initBtnText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, backgroundColor: 'rgba(251, 191, 36, 0.05)', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.1)' },
  hintText: { color: THEME.colors.secondary, fontSize: 8, fontWeight: 'bold' },

  activeContainer: { alignItems: 'center' },
  telemetryGrid: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  telemetryCard: { width: 120, height: 60, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  telemetryVal: { color: '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: 'System' },
  telemetryLabel: { color: THEME.colors.textMuted, fontSize: 7, fontWeight: 'bold', marginTop: 2 },
  
  pulseContainer: { marginBottom: 40 },
  syncCircle: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(0, 204, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(0, 204, 255, 0.2)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncText: { color: THEME.colors.primary, fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
  
  terminateBtn: { paddingVertical: 12, paddingHorizontal: 30, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: 2 },
  terminateText: { color: THEME.colors.danger, fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
});
