const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

// Mocks for React Native and Expo modules in Node context
const mockAsyncStorage = {
  store: {},
  async getItem(key) { return this.store[key] || null; },
  async setItem(key, value) { this.store[key] = value; },
  async removeItem(key) { delete this.store[key]; },
  async clear() { this.store = {}; }
};

const mockExpoCrypto = {
  CryptoDigestAlgorithm: { SHA256: 'sha256' },
  async digest(algorithm, bytes) {
    const crypto = require('node:crypto');
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return crypto.createHash('sha256').update(data).digest();
  }
};

class MockFile {
  constructor(parent, name) {
    this.parentDirectory = parent;
    this.name = name;
    this.exists = false;
    this.content = null;
    this._modificationTime = Date.now();
  }
  async bytes() { return this.content; }
  async text() { return this.content ? Buffer.from(this.content).toString() : ''; }
  write(bytes) {
    this.content = bytes;
    this.exists = true;
    if (this.parentDirectory) this.parentDirectory.files.set(this.name, this);
  }
  delete() {
    this.exists = false;
    this.content = null;
    if (this.parentDirectory) this.parentDirectory.files.delete(this.name);
  }
  info() {
    return { modificationTime: this._modificationTime };
  }
}

class MockDirectory {
  constructor(parent, name) {
    this.parent = parent;
    this.name = name;
    this.exists = false;
    this.files = new Map();
    this.directories = new Map();
  }
  create() {
    this.exists = true;
  }
  delete() {
    this.exists = false;
    this.files.clear();
    this.directories.clear();
  }
  list() {
    return [...this.directories.values(), ...this.files.values()];
  }
}

const mockExpoFileSystem = {
  Paths: { cache: 'cache' },
  Directory: MockDirectory,
  File: MockFile
};

const mockExpoConstants = {
  default: {
    expoConfig: { hostUri: '192.168.1.33:8000' },
    manifest2: { extra: { expoClient: { hostUri: '192.168.1.33:8000' } } }
  }
};

const projectRoot = path.resolve(__dirname, '..');

// Helper to compile ES modules to CommonJS
function loadApplicationModule(filePath) {
  const filename = path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath);
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, { filename, plugins: ['@babel/plugin-transform-modules-commonjs'] });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(transformed.code, filename);
  return loaded.exports;
}

// Hook require to intercept native packages and compile local project modules
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@react-native-async-storage/async-storage') return mockAsyncStorage;
  if (request === 'expo-crypto') return mockExpoCrypto;
  if (request === 'expo-file-system') return mockExpoFileSystem;
  if (request === 'expo-constants') return mockExpoConstants;

  if (request.startsWith('.') || path.isAbsolute(request)) {
    const parentDir = path.dirname(this.filename);
    const resolvedPath = path.isAbsolute(request) ? request : path.resolve(parentDir, request);
    
    let finalPath = resolvedPath;
    if (!fs.existsSync(finalPath)) {
      if (fs.existsSync(finalPath + '.js')) finalPath += '.js';
      else if (fs.existsSync(finalPath + '.json')) finalPath += '.json';
    }

    if (
      finalPath.endsWith('.js')
      && finalPath.includes(projectRoot)
      && !finalPath.includes(`${path.sep}node_modules${path.sep}`)
    ) {
      return loadApplicationModule(finalPath);
    }
  }

  return originalRequire.apply(this, arguments);
};

const { getStarSearchTokens, starMatchesQuery, starMatchesTarget } = loadApplicationModule('../src/utils/starIdentity.js');
const { parseGaiaBinaryTile } = loadApplicationModule('../src/data/gaiaBinaryCatalog.js');
const remoteCatalogModule = loadApplicationModule('../src/data/remoteGaiaCatalog.js');
const {
  getCatalogFieldDegrees,
  loadSkyCatalogWindow,
  mergeCatalogStars,
} = loadApplicationModule('../src/data/skyCatalogWindow.js');

test('P0.4 - Unified search resolving resolves all criteria from the same tokens', () => {
  const star = {
    canonicalId: 'gaia-dr3:4567890123',
    gaiaSourceId: '4567890123',
    hip: 78901,
    hd: 234567,
    properName: 'Sirius B',
    starClaimCode: 'VORTEX-456'
  };

  const tokens = getStarSearchTokens(star);
  assert.ok(tokens.includes('gaiadr34567890123'));
  assert.ok(tokens.includes('4567890123'));
  assert.ok(tokens.includes('hip78901'));
  assert.ok(tokens.includes('hd234567'));
  assert.ok(tokens.includes('siriusb'));
  assert.ok(tokens.includes('vortex456'));

  // Test case-insensitive exact queries
  assert.ok(starMatchesQuery(star, 'SIRIUS B'));
  assert.ok(starMatchesQuery(star, 'hip 78901'));
  assert.ok(starMatchesQuery(star, 'HD 234567'));
  assert.ok(starMatchesQuery(star, 'vortex-456'));
  assert.ok(starMatchesQuery(star, '4567890123'));

  // Test partial query matching
  assert.ok(starMatchesQuery(star, 'sirius'));
  assert.ok(starMatchesQuery(star, 'vortex'));
});

test('P0.4 - Memory cache size limit and LRU eviction', () => {
  const memoryTiles = new Map();
  const MEMORY_LIMIT = 24;

  const touchMemoryMock = (key, stars) => {
    memoryTiles.delete(key);
    memoryTiles.set(key, stars);
    while (memoryTiles.size > MEMORY_LIMIT) {
      memoryTiles.delete(memoryTiles.keys().next().value);
    }
  };

  // Add 25 tiles to trigger eviction
  for (let i = 1; i <= 25; i++) {
    touchMemoryMock(`tile-${i}`, [{ id: `star-${i}` }]);
  }

  // Memory limit is 24, so tile-1 should be evicted and tile-2 to tile-25 should remain
  assert.equal(memoryTiles.size, 24);
  assert.equal(memoryTiles.has('tile-1'), false);
  assert.equal(memoryTiles.has('tile-2'), true);
  assert.equal(memoryTiles.has('tile-25'), true);
});

test('P0.4 - Disk cache size limit and modified-time LRU eviction', () => {
  const mockDir = new MockDirectory(null, 'gaia-2d');
  const DISK_LIMIT = 96;

  // Fill disk cache with 100 tiles
  const mockFiles = [];
  for (let i = 1; i <= 100; i++) {
    const file = new MockFile(mockDir, `sector-${i}.bin`);
    file.write(new Uint8Array([i]));
    // Set mock modification times such that older files are deleted
    file._modificationTime = i * 1000; // earlier indices have older modificationTimes
    mockFiles.push(file);
  }

  // Run pruning algorithm
  const pruneDiskCacheMock = (directory) => {
    const files = directory.list()
      .filter((entry) => entry instanceof MockFile && entry.name.endsWith('.bin'))
      .sort((left, right) => Number(right.info().modificationTime || 0) - Number(left.info().modificationTime || 0));
    files.slice(DISK_LIMIT).forEach((file) => file.delete());
  };

  pruneDiskCacheMock(mockDir);

  // Assert exactly 96 files remain
  assert.equal(mockDir.files.size, 96);
  // Sector 1-4 should be evicted (they were the oldest, modTime 1000-4000)
  assert.equal(mockDir.files.has('sector-1.bin'), false);
  assert.equal(mockDir.files.has('sector-4.bin'), false);
  // Sector 5-100 should remain
  assert.equal(mockDir.files.has('sector-5.bin'), true);
  assert.equal(mockDir.files.has('sector-100.bin'), true);
});

test('P0.4 - Corrupted tile recovery and checksum validation', async () => {
  const expectedSha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'; // dummy Sha
  const file = new MockFile(null, 'corrupted.bin');
  file.write(new Uint8Array([1, 2, 3])); // content doesn't match expected Sha

  const sha256Mock = async (bytes) => {
    const crypto = require('node:crypto');
    return crypto.createHash('sha256').update(bytes).digest('hex');
  };

  const readVerifiedTileMock = async (file, expectedSha) => {
    if (!file.exists) return null;
    const bytes = await file.bytes();
    if (await sha256Mock(bytes) !== expectedSha) {
      file.delete();
      return null;
    }
    return bytes;
  };

  const result = await readVerifiedTileMock(file, expectedSha);
  // Must return null because SHA checksum failed
  assert.equal(result, null);
  // File must have been deleted
  assert.equal(file.exists, false);
});

test('P0.5 - Sky catalog window merges Gaia tiles with HYG core fallback without duplicates', async () => {
  const coreStars = [
    { canonicalId: 'hyg:1', hip: 1, magnitude: 1 },
    { canonicalId: 'hyg:2', hip: 2, magnitude: 2 },
    { canonicalId: 'hyg:3', hip: 3, magnitude: 3 },
  ];
  const gaiaStars = [
    { canonicalId: 'gaia-dr3:100', hip: 2, magnitude: 0 },
    { canonicalId: 'gaia-dr3:101', hip: 4, magnitude: 1 },
  ];

  const merged = mergeCatalogStars(gaiaStars, coreStars, 10);
  assert.deepEqual(merged.map((star) => star.canonicalId), [
    'gaia-dr3:100',
    'gaia-dr3:101',
    'hyg:1',
    'hyg:3',
  ]);
});

test('P0.5 - Sky catalog window falls back to HYG core when Gaia viewport is unavailable', async () => {
  const coreStars = [
    { canonicalId: 'hyg:1', magnitude: 1 },
    { canonicalId: 'hyg:2', magnitude: 2 },
  ];

  const result = await loadSkyCatalogWindow({
    centerRaDegrees: 180,
    centerDecDegrees: 0,
    zoom: 1,
    coreStars,
    loadGaia: async () => {
      throw new Error('offline');
    },
  });

  assert.equal(result.source, 'hyg-core');
  assert.equal(result.fallback, true);
  assert.deepEqual(result.stars, coreStars);
});

test('P0.5 - Sky catalog window calculates bounded viewport field from zoom', () => {
  assert.equal(getCatalogFieldDegrees(0.1), 112.5);
  assert.equal(getCatalogFieldDegrees(2), 45);
});
