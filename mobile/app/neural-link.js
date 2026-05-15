import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
    
    // session_id must match what PC shows
    const wsUrl = `wss://starclaim-api.onrender.com/ws/bridge/${session}`;
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050b1a', '#0a1a33']} style={styles.gradient}>
        <Text style={styles.title}>NEURAL LINK</Text>
        <Text style={styles.subtitle}>SPATIAL GAZE BRIDGE</Text>

        {!connected ? (
          <View style={styles.setup}>
            <TextInput
              style={styles.input}
              placeholder="Session ID (from PC HUD)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={session}
              onChangeText={setSession}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.button} onPress={connectBridge}>
              <Text style={styles.buttonText}>INITIALIZE LINK</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.active}>
            <View style={styles.statusCircle}>
              <Text style={styles.statusText}>LINK ACTIVE</Text>
              <Text style={styles.sessionBadge}>SESSION: {session}</Text>
            </View>
            <View style={styles.telemetry}>
              <View style={styles.telemetryItem}>
                 <Text style={styles.telemetryVal}>{data.beta.toFixed(3)}</Text>
                 <Text style={styles.telemetryLabel}>PITCH (β)</Text>
              </View>
              <View style={styles.telemetryItem}>
                 <Text style={styles.telemetryVal}>{data.gamma.toFixed(3)}</Text>
                 <Text style={styles.telemetryLabel}>ROLL (γ)</Text>
              </View>
              <View style={styles.telemetryItem}>
                 <Text style={styles.telemetryVal}>{data.alpha.toFixed(3)}</Text>
                 <Text style={styles.telemetryLabel}>YAW (α)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.disconnectButton} onPress={() => ws && ws.close()}>
              <Text style={styles.disconnectText}>TERMINATE LINK</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 8 },
  subtitle: { color: '#00ccff', fontSize: 10, letterSpacing: 4, marginBottom: 60, opacity: 0.8 },
  setup: { width: '100%', alignItems: 'center' },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 255, 0.3)',
    borderRadius: 15,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#00ccff',
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#000', fontWeight: 'bold', letterSpacing: 2, fontSize: 14 },
  backButton: { marginTop: 30 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2 },
  active: { alignItems: 'center', width: '100%' },
  statusCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: '#00ccff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    backgroundColor: 'rgba(0, 204, 255, 0.03)',
  },
  statusText: { color: '#00ccff', fontWeight: 'bold', letterSpacing: 6, fontSize: 16 },
  sessionBadge: { color: 'rgba(0, 204, 255, 0.5)', fontSize: 10, marginTop: 10, fontFamily: 'monospace' },
  telemetry: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 60 },
  telemetryItem: { alignItems: 'center' },
  telemetryVal: { color: '#fff', fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold' },
  telemetryLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, letterSpacing: 2, marginTop: 5 },
  disconnectButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,0,85,0.3)',
    borderRadius: 40,
  },
  disconnectText: { color: '#ff0055', fontSize: 11, fontWeight: 'bold', letterSpacing: 3 },
});
