import Constants from 'expo-constants';

// For local development, replace with your PC's local IP (e.g., 192.168.1.37)
// When deploying, use your production API URL
const LOCAL_IP = '192.168.1.37'; 
const PRODUCTION_URL = 'https://starclaim.onrender.com';

export const CONFIG = {
  API_URL: `http://${LOCAL_IP}:8000`,
  PRODUCTION_URL: PRODUCTION_URL,
  // Helper function to get working API URL
  getAPIUrl: async () => {
    try {
      // Try local first
      const res = await Promise.race([
        fetch(`http://${LOCAL_IP}:8000/api/marketplace/metrics`, { timeout: 2000 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      if (res.ok) return `http://${LOCAL_IP}:8000`;
    } catch (e) {
      console.log('Local API unavailable, using production');
    }
    return PRODUCTION_URL;
  }
};
