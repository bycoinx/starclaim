import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@constellations_v2';
const DATA_ROOT = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data';
const SOURCES = {
  lines: `${DATA_ROOT}/constellations.lines.json`,
  labels: `${DATA_ROOT}/constellations.json`,
  boundaries: `${DATA_ROOT}/constellations.bounds.json`,
};

async function fetchGeoJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Constellation request failed: ${response.status}`);
  }
  return response.json();
}

export async function ensureConstellations() {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) return JSON.parse(cached);

    const [lines, labels, boundaries] = await Promise.all([
      fetchGeoJson(SOURCES.lines),
      fetchGeoJson(SOURCES.labels),
      fetchGeoJson(SOURCES.boundaries),
    ]);
    const catalog = { lines, labels, boundaries };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    return catalog;
  } catch (error) {
    console.warn('Constellation loader error', error);
    return {
      lines: { type: 'FeatureCollection', features: [] },
      labels: { type: 'FeatureCollection', features: [] },
      boundaries: { type: 'FeatureCollection', features: [] },
    };
  }
}
