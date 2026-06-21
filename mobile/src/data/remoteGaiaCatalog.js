import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { CONFIG } from '../../constants/Config';
import { getVisibleGaiaSectorIds, parseGaiaBinaryTile } from './gaiaBinaryCatalog';

const MANIFEST_KEY = '@gaia_2d_manifest_v1';
const NAMES_KEY = '@gaia_2d_names_v1';
const MEMORY_LIMIT = 24;
const DISK_LIMIT = 96;
const memoryTiles = new Map();
let manifestValue = null;
let namesValue = null;
let apiUrlPromise = null;
let unavailableUntil = 0;

async function fetchWithTimeout(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(bytes) {
  return bytesToHex(await digest(CryptoDigestAlgorithm.SHA256, bytes));
}

function touchMemory(key, stars) {
  memoryTiles.delete(key);
  memoryTiles.set(key, stars);
  while (memoryTiles.size > MEMORY_LIMIT) memoryTiles.delete(memoryTiles.keys().next().value);
}

async function getBaseUrl() {
  if (Date.now() < unavailableUntil) throw new Error('Gaia catalog endpoint is cooling down');
  if (!apiUrlPromise) {
    apiUrlPromise = (async () => {
      const candidates = [...new Set(CONFIG.getCandidateAPIUrls())];
      for (const candidate of candidates) {
        try {
          const response = await fetchWithTimeout(`${candidate}/api/catalog/2d/manifest`);
          if (!response.ok) continue;
          const manifest = await response.json();
          if (manifest?.format?.magic === 'SCB1' && Array.isArray(manifest.sectors)) {
            manifestValue = manifest;
            await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
            return candidate;
          }
        } catch (_) {
          // Try the next configured backend.
        }
      }
      unavailableUntil = Date.now() + 60_000;
      throw new Error('No backend exposes the Gaia 2D catalog');
    })().catch((error) => {
      apiUrlPromise = null;
      throw error;
    });
  }
  return apiUrlPromise;
}

async function getManifest() {
  if (manifestValue) return manifestValue;
  try {
    const baseUrl = await getBaseUrl();
    if (manifestValue) return manifestValue;
    const response = await fetch(`${baseUrl}/api/catalog/2d/manifest`);
    if (!response.ok) throw new Error(`Gaia manifest request failed: ${response.status}`);
    const manifest = await response.json();
    if (manifest?.format?.magic !== 'SCB1' || !Array.isArray(manifest.sectors)) {
      throw new Error('Gaia manifest format is invalid');
    }
    manifestValue = manifest;
    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
  } catch (error) {
    const cached = await AsyncStorage.getItem(MANIFEST_KEY);
    if (!cached) throw error;
    manifestValue = JSON.parse(cached);
  }
  return manifestValue;
}

async function getNames(manifest) {
  if (namesValue) return namesValue;
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/catalog/2d/names`);
    if (!response.ok) throw new Error(`Gaia names request failed: ${response.status}`);
    const text = await response.text();
    const encoded = new TextEncoder().encode(text);
    if (await sha256(encoded) !== manifest.names.sha256) throw new Error('Gaia names checksum failed');
    namesValue = JSON.parse(text);
    await AsyncStorage.setItem(NAMES_KEY, text);
  } catch (error) {
    const cached = await AsyncStorage.getItem(NAMES_KEY);
    namesValue = cached ? JSON.parse(cached) : {};
  }
  return namesValue;
}

function getCacheDirectory(catalogVersion) {
  const root = new Directory(Paths.cache, 'gaia-2d');
  if (!root.exists) root.create({ intermediates: true, idempotent: true });
  root.list().forEach((entry) => {
    if (entry instanceof Directory && entry.name !== catalogVersion) entry.delete();
  });
  const directory = new Directory(root, catalogVersion);
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

function pruneDiskCache(directory) {
  const files = directory.list()
    .filter((entry) => entry instanceof File && entry.name.endsWith('.bin'))
    .sort((left, right) => Number(right.info().modificationTime || 0) - Number(left.info().modificationTime || 0));
  files.slice(DISK_LIMIT).forEach((file) => file.delete());
}

async function readVerifiedTile(file, expectedSha) {
  if (!file.exists) return null;
  const bytes = await file.bytes();
  if (await sha256(bytes) !== expectedSha) {
    file.delete();
    return null;
  }
  return bytes;
}

async function loadTile(baseUrl, manifest, sector, names) {
  const key = `${manifest.catalogVersion}:${sector.id}`;
  if (memoryTiles.has(key)) {
    const stars = memoryTiles.get(key);
    touchMemory(key, stars);
    return stars;
  }
  const file = new File(getCacheDirectory(manifest.catalogVersion), `${sector.id}.bin`);
  let bytes = await readVerifiedTile(file, sector.sha256);
  if (!bytes) {
    const response = await fetch(`${baseUrl}/api/catalog/2d/tiles/${encodeURIComponent(sector.id)}`);
    if (!response.ok) throw new Error(`Gaia tile request failed (${sector.id}): ${response.status}`);
    bytes = new Uint8Array(await response.arrayBuffer());
    if (await sha256(bytes) !== sector.sha256) throw new Error(`Gaia tile checksum failed: ${sector.id}`);
    file.write(bytes);
    pruneDiskCache(file.parentDirectory);
  }
  const stars = parseGaiaBinaryTile(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), names);
  touchMemory(key, stars);
  return stars;
}

export async function loadGaiaViewport(options) {
  const manifest = await getManifest();
  const names = await getNames(manifest);
  const available = new Map(manifest.sectors.map((sector) => [sector.id, sector]));
  const ids = getVisibleGaiaSectorIds(
    options.centerRaDegrees,
    options.centerDecDegrees,
    options.horizontalFovDegrees,
    options.verticalFovDegrees,
  ).filter((id) => available.has(id));
  const baseUrl = await getBaseUrl();
  const tiles = [];
  for (let index = 0; index < ids.length; index += 4) {
    const batch = ids.slice(index, index + 4);
    const loaded = await Promise.all(batch.map((id) => loadTile(baseUrl, manifest, available.get(id), names)));
    tiles.push(...loaded);
  }
  const seen = new Set();
  const stars = tiles.flat().sort((left, right) => left.magnitude - right.magnitude).filter((star) => {
    if (seen.has(star.canonicalId)) return false;
    seen.add(star.canonicalId);
    return true;
  });
  return { stars: stars.slice(0, options.maxStars || 12000), sectorIds: ids, catalogVersion: manifest.catalogVersion };
}

export function clearGaiaMemoryCache() {
  memoryTiles.clear();
}
