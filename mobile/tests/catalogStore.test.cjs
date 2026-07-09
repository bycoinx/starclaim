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
  async clear() { this.store = {}; },
  async multiRemove(keys) { keys.forEach(k => delete this.store[k]); }
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
  if (request === 'expo-constants') return mockExpoConstants;

  if (request.startsWith('.') || path.isAbsolute(request)) {
    const parentDir = path.dirname(this.filename);
    let resolvedPath = path.isAbsolute(request) ? request : path.resolve(parentDir, request);
    
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

// Load the repository and store
const { loadLocalStars, searchStars } = loadApplicationModule('../src/platform/stars/starRepository.js');
const { useCatalogStore } = loadApplicationModule('../src/platform/stars/catalogStore.js');

test('loadLocalStars loads and normalizes local hyg catalog stars', async () => {
  const localStars = await loadLocalStars();
  assert.ok(Array.isArray(localStars));
  assert.ok(localStars.length > 0);
  
  // Verify first star structure
  const star = localStars[0];
  assert.ok(star.id);
  assert.ok(star.slug);
  assert.ok(star.name);
  assert.ok(star.asset);
  assert.equal(star.localCatalog, true);
  assert.ok(star.asset.previewImage);
});

test('searchStars filters list correctly', () => {
  const mockStars = [
    { name: 'Sirius', starClaimCode: 'SIRI-1' },
    { name: 'Vega', starClaimCode: 'VEGA-2' },
    { name: 'Rigel', starClaimCode: 'RIGE-3' }
  ];

  const siriMatches = searchStars('sirius', mockStars);
  assert.equal(siriMatches.length, 1);
  assert.equal(siriMatches[0].name, 'Sirius');

  const codeMatches = searchStars('VEGA', mockStars);
  assert.equal(codeMatches.length, 1);
  assert.equal(codeMatches[0].starClaimCode, 'VEGA-2');

  const noMatches = searchStars('nonexistent', mockStars);
  assert.equal(noMatches.length, 0);
});

test('useCatalogStore manages search and filter states', async () => {
  const store = useCatalogStore;
  
  // Init catalog
  await store.getState().loadCatalog();
  const stars = store.getState().stars;
  assert.ok(stars.length > 0);

  // Default filter
  const allFiltered = store.getState().getFilteredStars();
  assert.equal(allFiltered.length, stars.length);

  // Set Search Query
  store.getState().setSearchQuery(stars[0].name);
  const nameFiltered = store.getState().getFilteredStars();
  assert.ok(nameFiltered.length >= 1);
  assert.equal(nameFiltered[0].name, stars[0].name);

  // Clear search
  store.getState().setSearchQuery('');
  
  // Set Tier filter to named
  store.getState().setSelectedTier('named');
  const namedStars = store.getState().getFilteredStars();
  // Ensure all named stars have name properties
  assert.ok(namedStars.every(s => s.properName || s.proper || !s.localCatalog));
});
