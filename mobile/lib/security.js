import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const SESSION_KEY = 'starclaim_session_token';
const USER_DATA_KEY = 'starclaim_user_data';

export const SecurityService = {
  /**
   * Check if biometrics are available and enrolled
   */
  async checkBiometrics() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /**
   * Authenticate using biometrics
   */
  async authenticate(reason = 'Kuantum yetkilendirme gerekli') {
    const results = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Parola kullan',
      disableDeviceFallback: false,
    });
    return results.success;
  },

  /**
   * Save session securely after biometric approval (optional)
   */
  async saveSession(token, userData) {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, token);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
      return true;
    } catch (e) {
      console.error('Session save failed', e);
      return false;
    }
  },

  /**
   * Load session with optional biometric gate
   */
  async getSession(requireBiometric = false) {
    if (requireBiometric) {
      const authenticated = await this.authenticate('Oturumu geri yüklemek için kimlik doğrulaması yapın');
      if (!authenticated) return null;
    }

    try {
      const token = await SecureStore.getItemAsync(SESSION_KEY);
      const userStr = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (!token) return null;
      return { token, user: JSON.parse(userStr) };
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear session
   */
  async clearSession() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  }
};
