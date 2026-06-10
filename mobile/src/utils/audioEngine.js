import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class AmbientEngine {
  constructor() {
    this.ambientSound = null;
    this.warpSound = null;
    this.isLoaded = false;
  }

  async initialize() {
    if (this.isLoaded) return;
    try {
      // Background Space Hum (Low Frequency)
      const { sound: ambient } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/ambient/sounds/space-ambient-01.mp3' },
        { shouldPlay: true, isLooping: true, volume: 0.3 }
      );
      this.ambientSound = ambient;

      // Warp Engage Sound
      const { sound: warp } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/mechanical/sounds/jet-engine-take-off-1.mp3' },
        { shouldPlay: false, volume: 0.6 }
      );
      this.warpSound = warp;

      this.isLoaded = true;
    } catch (error) {
      console.warn('Audio initialization failed', error);
    }
  }

  async playWarp() {
    if (this.warpSound) {
      try {
        await this.warpSound.replayAsync();
        // Haptic Feedback for Warp (Heavy)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 500);
      } catch (e) {}
    }
  }

  async triggerImpact() {
    // Light haptic for UI interactions
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async stopAll() {
    if (this.ambientSound) await this.ambientSound.stopAsync();
    if (this.warpSound) await this.warpSound.stopAsync();
  }
}

export const SpaceAudio = new AmbientEngine();
