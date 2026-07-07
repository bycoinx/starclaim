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
const SNAPSHOT_META_KEY = '@hyg_core_snapshot_meta_v1';
const CSV_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv';
const CATALOG_VERSION = 'hyg-v4.1-sector-v1';
const SNAPSHOT_VERSION = 'hyg-v4.1-mag6-core-v2';
const CORE_CATALOG_LIMIT = 10000;
const CORE_COMPACTION_THRESHOLD = CORE_CATALOG_LIMIT * 2;
const PARSE_YIELD_INTERVAL = 2500;
const BUNDLED_MAGNITUDE_LIMIT = 6.0;
const BUNDLED_STAR_LIMIT = 5000;

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

function isValidHydratedStar(star) {
  if (!star || typeof star !== 'object') return false;
  if (!star.id) return false;
  if (!Number.isFinite(star.raHours) || !Number.isFinite(star.decDegrees)) return false;
  if (!Number.isFinite(star.magnitude)) return false;
  return true;
}

function dedupeByHygId(stars) {
  const seen = new Set();
  const deduped = [];
  for (let index = 0; index < stars.length; index += 1) {
    const star = stars[index];
    const key = String(star?.id ?? '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(star);
  }
  return deduped;
}

function getEmbeddedCoreCatalog() {
  const hydrated = embeddedCoreRows
    .map(hydrateEmbeddedStar)
    .filter(Boolean)
    .filter((star) => Number(star.id) !== 0)
    .filter((star) => Number.isFinite(star.magnitude) && star.magnitude <= BUNDLED_MAGNITUDE_LIMIT);
  const deduped = dedupeByHygId(hydrated)
    .sort((left, right) => left.magnitude - right.magnitude)
    .slice(0, BUNDLED_STAR_LIMIT);
  return deduped;
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

function sanitizeSnapshotStars(stars) {
  if (!Array.isArray(stars) || stars.length < 100) return null;
  const sampleIndexes = [0, 1, Math.floor(stars.length / 2), stars.length - 1];
  for (let index = 0; index < sampleIndexes.length; index += 1) {
    const star = stars[sampleIndexes[index]];
    if (!isValidHydratedStar(star)) return null;
  }
  return dedupeByHygId(stars);
}

async function readSnapshotPayload() {
  try {
    const metaValue = await AsyncStorage.getItem(SNAPSHOT_META_KEY);
    const starsValue = await AsyncStorage.getItem(CORE_STORAGE_KEY);
    if (!metaValue || !starsValue) return null;

    const meta = JSON.parse(metaValue);
    if (!meta || meta.version !== SNAPSHOT_VERSION) return null;

    const parsed = JSON.parse(starsValue);
    const stars = sanitizeSnapshotStars(parsed);
    if (!stars) return null;

    return { stars, meta };
  } catch (error) {
    console.warn('readSnapshotPayload', error);
    return null;
  }
}

async function clearSnapshotPayload() {
  await AsyncStorage.removeItem(SNAPSHOT_META_KEY);
  await AsyncStorage.removeItem(CORE_STORAGE_KEY);
}

async function writeSnapshotPayload(stars, source = 'bundled') {
  const payload = dedupeByHygId(stars);
  const meta = {
    version: SNAPSHOT_VERSION,
    source,
    count: payload.length,
    savedAt: new Date().toISOString(),
    magnitudeLimit: BUNDLED_MAGNITUDE_LIMIT,
  };
  await AsyncStorage.setItem(CORE_STORAGE_KEY, JSON.stringify(payload));
  await AsyncStorage.setItem(SNAPSHOT_META_KEY, JSON.stringify(meta));
  return meta;
}

async function loadStarData() {
  const embeddedCore = getEmbeddedCoreCatalog();

  // 1) Snapshot cache first.
  const snapshot = await readSnapshotPayload();
  if (snapshot?.stars?.length) return snapshot.stars;

  // Snapshot exists but is corrupt/old: clean and continue.
  const staleMeta = await AsyncStorage.getItem(SNAPSHOT_META_KEY).catch(() => null);
  const staleRows = await AsyncStorage.getItem(CORE_STORAGE_KEY).catch(() => null);
  if (staleMeta || staleRows) await clearSnapshotPayload().catch(() => {});

  // 2) Bundled fallback (offline-first).
  if (embeddedCore.length) {
    AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
    writeSnapshotPayload(embeddedCore, 'bundled').catch(() => {});
    return embeddedCore;
  }

  try {
    const cachedCore = await readStoredArray(CORE_STORAGE_KEY);
    if (cachedCore?.length) return cachedCore;

    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`HYG catalog request failed: ${response.status}`);
    const { coreStars, manifest } = await buildCatalog(await response.text());
    const deduped = dedupeByHygId(coreStars);
    await AsyncStorage.multiSet([
      [CORE_STORAGE_KEY, JSON.stringify(deduped)],
      [MANIFEST_STORAGE_KEY, JSON.stringify(manifest)],
    ]);
    await writeSnapshotPayload(deduped, 'remote').catch(() => {});
    return deduped;
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
  const snapshot = await readSnapshotPayload();
  if (snapshot?.stars?.length) return snapshot.stars;

  try {
    const embeddedCore = getEmbeddedCoreCatalog();
    return (await readStoredArray(CORE_STORAGE_KEY))
      || (await readStoredArray(LEGACY_STORAGE_KEY))
      || embeddedCore;
  } catch (error) {
    console.warn('getStoredStars', error);
    return getEmbeddedCoreCatalog();
  }
}

export async function getStarCatalogManifest() {
  try {
    const snapshotMetaRaw = await AsyncStorage.getItem(SNAPSHOT_META_KEY);
    if (snapshotMetaRaw) {
      const snapshotMeta = JSON.parse(snapshotMetaRaw);
      if (snapshotMeta?.version === SNAPSHOT_VERSION) {
        return {
          ...embeddedCoreManifest,
          catalogVersion: SNAPSHOT_VERSION,
          source: snapshotMeta.source || 'snapshot',
          recordCount: Number(snapshotMeta.count) || embeddedCoreManifest.recordCount,
          generatedAt: snapshotMeta.savedAt || embeddedCoreManifest.generatedAt,
        };
      }
    }
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
  snapshotMeta: SNAPSHOT_META_KEY,
  legacy: LEGACY_STORAGE_KEY,
};
