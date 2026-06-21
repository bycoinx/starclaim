import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addStarToSectorAccumulator,
  createSectorAccumulator,
  finalizeSectorManifest,
  getSectorScheme,
  getStarSectorId,
} from './starSectorCatalog';
import embeddedCoreRows from '../../assets/catalog/hyg-core-v1.json';
import embeddedCoreManifest from '../../assets/catalog/hyg-core-v1.manifest.json';
import { createCanonicalStar } from './canonicalStar';

const CORE_STORAGE_KEY = '@hyg_core_stars_v3';
const MANIFEST_STORAGE_KEY = '@hyg_sector_manifest_v1';
const LEGACY_STORAGE_KEY = '@hyg_stars_v2';
const CSV_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';
const CATALOG_VERSION = 'hyg-v4.1-sector-v1';
const CORE_CATALOG_LIMIT = 10000;
const CORE_COMPACTION_THRESHOLD = CORE_CATALOG_LIMIT * 2;
const PARSE_YIELD_INTERVAL = 2500;

let catalogLoadPromise = null;

function hydrateEmbeddedStar(row) {
  const [id, hip, hd, properName, raHours, decDegrees, distanceParsec, magnitude, spectralType, constellation, sectorId] = row;
  const star = createCanonicalStar({
    id: String(id),
    hip,
    hd,
    properName,
    raHours,
    decDegrees,
    distanceParsec,
    magnitude,
    spectralType,
    constellation,
  }, {
    source: 'hyg',
    sourceId: id,
    sourceCatalogVersion: '4.1',
  });
  if (!star) return null;
  star.sectorId = getStarSectorId(star);
  return star;
}

function getEmbeddedCoreCatalog() {
  return embeddedCoreRows.map(hydrateEmbeddedStar).filter(Boolean);
}

function csvLineToFields(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  values.push(current);
  return values;
}

function parseFiniteNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createHeaderIndexes(headerFields) {
  return {
    id: headerFields.indexOf('id'),
    hip: headerFields.indexOf('hip'),
    hd: headerFields.indexOf('hd'),
    proper: headerFields.indexOf('proper'),
    ra: headerFields.indexOf('ra'),
    dec: headerFields.indexOf('dec'),
    dist: headerFields.indexOf('dist'),
    mag: headerFields.indexOf('mag'),
    spect: headerFields.indexOf('spect'),
    con: headerFields.indexOf('con'),
  };
}

function normalizeStar(columns, indexes, fallbackId) {
  const raHours = parseFiniteNumber(columns[indexes.ra]);
  const decDegrees = parseFiniteNumber(columns[indexes.dec]);
  const magnitude = parseFiniteNumber(columns[indexes.mag]);
  if (raHours == null || decDegrees == null || magnitude == null) return null;

  const distanceParsec = parseFiniteNumber(columns[indexes.dist]);
  const properName = columns[indexes.proper] || '';
  const spectralType = columns[indexes.spect] || '';
  const constellation = columns[indexes.con] || '';
  const star = createCanonicalStar({
    id: columns[indexes.id] || String(fallbackId),
    hip: columns[indexes.hip] || '',
    hd: columns[indexes.hd] || '',
    properName,
    raHours,
    decDegrees,
    distanceParsec,
    magnitude,
    spectralType,
    constellation,
  }, {
    source: 'hyg',
    sourceId: columns[indexes.id] || String(fallbackId),
    sourceCatalogVersion: '4.1',
  });
  if (!star) return null;
  star.sectorId = getStarSectorId(star);
  return star;
}

function compactCoreCandidates(candidates) {
  candidates.sort((left, right) => left.magnitude - right.magnitude);
  if (candidates.length > CORE_CATALOG_LIMIT) candidates.length = CORE_CATALOG_LIMIT;
}

function yieldToMainThread() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function buildCatalog(csvText) {
  const lines = csvText.split('\n');
  const header = lines.shift();
  if (!header) throw new Error('HYG catalog header is missing');

  const indexes = createHeaderIndexes(csvLineToFields(header));
  const sectors = createSectorAccumulator();
  const coreCandidates = [];
  let normalizedCount = 0;
  let invalidRowCount = 0;
  let validDistanceCount = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim()) continue;
    const star = normalizeStar(csvLineToFields(line), indexes, normalizedCount + 1);
    if (!star) {
      invalidRowCount += 1;
      continue;
    }

    normalizedCount += 1;
    if (star.distanceParsec > 0) validDistanceCount += 1;
    addStarToSectorAccumulator(sectors, star);
    coreCandidates.push(star);
    if (coreCandidates.length >= CORE_COMPACTION_THRESHOLD) compactCoreCandidates(coreCandidates);
    if (lineIndex > 0 && lineIndex % PARSE_YIELD_INTERVAL === 0) await yieldToMainThread();
  }

  compactCoreCandidates(coreCandidates);
  const manifest = {
    schemaVersion: 1,
    catalogVersion: CATALOG_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl: CSV_URL,
    totalRows: lines.length,
    normalizedStarCount: normalizedCount,
    validDistanceStarCount: validDistanceCount,
    invalidRowCount,
    coreCatalogCount: coreCandidates.length,
    coreCatalogLimit: CORE_CATALOG_LIMIT,
    sectorScheme: getSectorScheme(),
    sectors: finalizeSectorManifest(sectors),
  };
  return { coreStars: coreCandidates, manifest };
}

async function readStoredArray(key) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : null;
}

async function loadStarData() {
  const embeddedCore = getEmbeddedCoreCatalog();

  if (embeddedCore.length) {
    // Older builds stored the full hydrated catalog in one Android SQLite row.
    // Never read that oversized row; the bundled catalog is the canonical offline core.
    AsyncStorage.multiRemove([CORE_STORAGE_KEY, LEGACY_STORAGE_KEY]).catch(() => {});
    return embeddedCore;
  }

  try {
    const cachedCore = await readStoredArray(CORE_STORAGE_KEY);
    if (cachedCore?.length) return cachedCore;

    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`HYG catalog request failed: ${response.status}`);
    const { coreStars, manifest } = await buildCatalog(await response.text());
    await AsyncStorage.multiSet([
      [CORE_STORAGE_KEY, JSON.stringify(coreStars)],
      [MANIFEST_STORAGE_KEY, JSON.stringify(manifest)],
    ]);
    return coreStars;
  } catch (error) {
    console.warn('StarLoader error', error);
    if (embeddedCore.length) return embeddedCore;

    try {
      return (await readStoredArray(LEGACY_STORAGE_KEY)) || [];
    } catch (legacyError) {
      console.warn('Legacy StarLoader fallback error', legacyError);
      return [];
    }
  }
}

export function ensureStarData() {
  if (!catalogLoadPromise) {
    catalogLoadPromise = loadStarData().finally(() => {
      catalogLoadPromise = null;
    });
  }
  return catalogLoadPromise;
}

export async function getStoredStars() {
  const embeddedCore = getEmbeddedCoreCatalog();
  if (embeddedCore.length) return embeddedCore;

  try {
    return (await readStoredArray(CORE_STORAGE_KEY))
      || (await readStoredArray(LEGACY_STORAGE_KEY))
      || embeddedCore;
  } catch (error) {
    console.warn('getStoredStars', error);
    return embeddedCore;
  }
}

export async function getStarCatalogManifest() {
  try {
    const raw = await AsyncStorage.getItem(MANIFEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : embeddedCoreManifest;
  } catch (error) {
    console.warn('getStarCatalogManifest', error);
    return embeddedCoreManifest;
  }
}

export const STAR_CATALOG_KEYS = {
  core: CORE_STORAGE_KEY,
  manifest: MANIFEST_STORAGE_KEY,
  legacy: LEGACY_STORAGE_KEY,
};
