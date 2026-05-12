import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Sample Star Data (Azimuth: 0-360, Altitude: -90 to 90)
const MOCK_STARS = [
  { id: '1', name: 'Polaris', az: 0, alt: 41, tier: 'Legendary' },
  { id: '2', name: 'Sirius', az: 180, alt: 20, tier: 'Zodiac' },
  { id: '3', name: 'Betelgeuse', az: 90, alt: 60, tier: 'Named' },
  { id: '4', name: 'Vega', az: 270, alt: 10, tier: 'Constellation' },
  { id: '5', name: 'Rigel', az: 45, alt: 30, tier: 'Standard' },
];

export default function Stars() {
  const [permission, requestPermission] = useCameraPermissions();
  const [motion, setMotion] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let subscription;
    const startMotion = async () => {
      await DeviceMotion.setUpdateInterval(16); // ~60fps
      subscription = DeviceMotion.addListener((data) => {
        setMotion(data);
      });
    };

    if (permission?.granted) {
      startMotion();
    }

    return () => {
      subscription && subscription.remove();
    };
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kameraya erişim izni vermeniz gerekiyor.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStars = () => {
    if (!motion || !motion.rotation) return null;

    // rotation.alpha (yaw/azimuth): 0 to 2PI (or -PI to PI)
    // rotation.beta (pitch): -PI to PI
    // rotation.gamma (roll): -PI/2 to PI/2
    
    const { alpha, beta, gamma } = motion.rotation;

    // Convert radians to degrees
    const deviceAz = (alpha * 180) / Math.PI;
    const deviceAlt = (beta * 180) / Math.PI;

    return MOCK_STARS.map((star) => {
      // Calculate relative position
      let diffAz = star.az - deviceAz;
      if (diffAz > 180) diffAz -= 360;
      if (diffAz < -180) diffAz += 360;

      const diffAlt = star.alt - deviceAlt;

      // Field of View approximation (simple linear mapping for now)
      const FOV_X = 60; // 60 degrees horizontal
      const FOV_Y = 100; // 100 degrees vertical

      const x = (width / 2) + (diffAz * (width / FOV_X));
      const y = (height / 2) - (diffAlt * (height / FOV_Y));

      // Only render if within screen bounds (with some margin)
      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return null;

      return (
        <View key={star.id} style={[styles.starContainer, { left: x, top: y }]}>
          <View style={[styles.starIcon, { backgroundColor: getTierColor(star.tier) }]} />
          <Text style={styles.starName}>{star.name}</Text>
          <Text style={styles.starTier}>{star.tier}</Text>
        </View>
      );
    });
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Legendary': return '#ffd700';
      case 'Zodiac': return '#a020f0';
      case 'Named': return '#00ccff';
      case 'Constellation': return '#00ff00';
      default: return '#ffffff';
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
          {renderStars()}
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>

          <View style={styles.hudContainer}>
            <Text style={styles.hudText}>
              AZ: {motion?.rotation ? Math.round((motion.rotation.alpha * 180) / Math.PI) : '--'}°
            </Text>
            <Text style={styles.hudText}>
              ALT: {motion?.rotation ? Math.round((motion.rotation.beta * 180) / Math.PI) : '--'}°
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.instruction}>Yıldızları bulmak için telefonu gökyüzüne çevirin</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  message: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 18,
  },
  button: {
    backgroundColor: '#00ccff',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  hudContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,204,255,0.3)',
  },
  hudText: {
    color: '#00ccff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  starContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    marginLeft: -50,
    marginTop: -50,
  },
  starIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  starName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginTop: 4,
  },
  starTier: {
    color: '#00ccff',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instruction: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
