import Constants from 'expo-constants';

function getDevelopmentHost() {
  const hostUri = Constants.expoConfig?.hostUri
    || Constants.manifest2?.extra?.expoClient?.hostUri
    || '';

  return String(hostUri).split(':')[0] || '192.168.1.33';
}

const LOCAL_IP = getDevelopmentHost();
const PRODUCTION_URL = 'https://starclaim.onrender.com';

export const CONFIG = {
  API_URL: `http://${LOCAL_IP}:8000`,
  PRODUCTION_URL: PRODUCTION_URL,
  getCandidateAPIUrls: () => [
    `http://${getDevelopmentHost()}:8000`,
    PRODUCTION_URL,
  ],
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
