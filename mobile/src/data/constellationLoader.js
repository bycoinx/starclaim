import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@constellations';
const CONSTELLATION_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';

export async function ensureConstellations() {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    const response = await fetch(CONSTELLATION_URL);
    const data = await response.json();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('Constellation loader error', error);
    return [];
  }
}
