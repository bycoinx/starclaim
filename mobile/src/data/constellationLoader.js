import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@constellations_v2';
const DATA_ROOT = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data';
const SOURCES = {
  lines: `${DATA_ROOT}/constellations.lines.json`,
  labels: `${DATA_ROOT}/constellations.json`,
  boundaries: `${DATA_ROOT}/constellations.bounds.json`,
};
const FETCH_TIMEOUT_MS = 3000;

const EMPTY_COLLECTION = Object.freeze({ type: 'FeatureCollection', features: [] });

const fallbackLineFeatures = [
  {
    id: 'Ori',
    properties: { name: 'Orion', tr: 'Avci', rank: 1 },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[78.63, -8.20], [83.82, -5.39], [88.79, 7.41], [81.28, 6.35], [78.63, -8.20]],
        [[83.82, -5.39], [84.05, -1.20], [85.19, -1.94]],
      ],
    },
  },
  {
    id: 'Lyr',
    properties: { name: 'Lyra', tr: 'Lir', rank: 1 },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[279.23, 38.78], [281.41, 36.90], [284.74, 32.69], [279.23, 38.78]],
      ],
    },
  },
  {
    id: 'Cyg',
    properties: { name: 'Cygnus', tr: 'Kugu', rank: 1 },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[310.36, 45.28], [305.56, 40.26], [296.24, 45.13], [292.68, 27.96]],
        [[305.56, 40.26], [310.87, 33.97]],
      ],
    },
  },
  {
    id: 'UMa',
    properties: { name: 'Ursa Major', tr: 'Buyuk Ayi', rank: 1 },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[165.46, 56.38], [165.93, 61.75], [178.46, 53.69], [183.86, 57.03], [193.51, 55.96], [200.98, 54.93], [206.89, 49.31]],
      ],
    },
  },
  {
    id: 'Sco',
    properties: { name: 'Scorpius', tr: 'Akrep', rank: 1 },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[247.35, -26.43], [240.08, -22.62], [239.71, -26.11], [241.36, -19.81], [244.58, -4.69]],
        [[247.35, -26.43], [253.50, -34.29], [264.33, -42.99]],
      ],
    },
  },
];

const fallbackLabelFeatures = fallbackLineFeatures.map((feature) => {
  const firstPoint = feature.geometry.coordinates[0][0];
  return {
    id: feature.id,
    properties: feature.properties,
    geometry: { type: 'Point', coordinates: firstPoint },
  };
});

const FALLBACK_CONSTELLATIONS = Object.freeze({
  lines: Object.freeze({ type: 'FeatureCollection', features: fallbackLineFeatures }),
  labels: Object.freeze({ type: 'FeatureCollection', features: fallbackLabelFeatures }),
  boundaries: EMPTY_COLLECTION,
});

function isUsableCatalog(catalog) {
  return Array.isArray(catalog?.lines?.features) && catalog.lines.features.length > 0;
}

async function fetchGeoJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Constellation request failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function ensureConstellations() {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isUsableCatalog(parsed)) return parsed;
    }

    const [lines, labels, boundaries] = await Promise.all([
      fetchGeoJson(SOURCES.lines),
      fetchGeoJson(SOURCES.labels),
      fetchGeoJson(SOURCES.boundaries),
    ]);
    const catalog = { lines, labels, boundaries };
    if (!isUsableCatalog(catalog)) {
      throw new Error('Constellation catalog is empty');
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    return catalog;
  } catch (error) {
    console.warn('Constellation loader error', error);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_CONSTELLATIONS));
    } catch {
      // Ignore cache failures; the embedded fallback is enough to keep the layer usable.
    }
    return FALLBACK_CONSTELLATIONS;
  }
}
