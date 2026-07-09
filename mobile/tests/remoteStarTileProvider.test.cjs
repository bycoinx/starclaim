const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const projectRoot = path.resolve(__dirname, '..');
const mockAsyncStorage = {
  store: {},
  async getItem(key) { return this.store[key] ?? null; },
  async setItem(key, value) { this.store[key] = String(value); },
  async removeItem(key) { delete this.store[key]; },
  async multiGet(keys) { return keys.map((key) => [key, this.store[key] ?? null]); },
  async multiRemove(keys) { keys.forEach((key) => delete this.store[key]); },
  async clear() { this.store = {}; },
};

global.fetch = async (url) => {
  throw new Error(`Unexpected fetch call: ${url}`);
};

const previousLoader = require.extensions['.js'];
require.extensions['.js'] = (module, moduleFilename) => {
  if (!moduleFilename.includes(`${path.sep}src${path.sep}`) && !moduleFilename.includes(`${path.sep}tests${path.sep}`)) {
    return previousLoader(module, moduleFilename);
  }
  const source = fs.readFileSync(moduleFilename, 'utf8');
  const transformed = transformSync(source, {
    filename: moduleFilename,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    babelrc: false,
    configFile: false,
  });
  return module._compile(transformed.code, moduleFilename);
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@react-native-async-storage/async-storage') return mockAsyncStorage;
  if (request.includes('constants/Config')) {
    return {
      CONFIG: {
        getAPIUrl: async () => 'https://example.com',
        getCandidateAPIUrls: () => ['https://example.com'],
      },
    };
  }
  return originalRequire.apply(this, arguments);
};

function loadApplicationModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, {
    filename,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    babelrc: false,
    configFile: false,
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(transformed.code, filename);
  return loaded.exports;
}

const {
  loadRemoteStarSectorWindow,
  getStarTileOfflineMode,
  setStarTileOfflineMode,
  getRemoteStarTileCacheStats,
  clearRemoteStarTileDiskCache,
} = loadApplicationModule('../src/data/remoteStarTileProvider.js');
const { createStarSectorTileStore } = loadApplicationModule('../src/data/starSectorTileStore.js');

function buildStar(id, sectorId, magnitude) {
  return { id: String(id), sectorId, magnitude };
}

function resetAsyncStorage() {
  mockAsyncStorage.store = {};
}

test('star sector tile store deduplicates overlapping sector windows and includes target', () => {
  const sectorId = 'r0-d0-s0';
  const stars = [
    buildStar('1', sectorId, 1),
    buildStar('2', sectorId, 2),
    buildStar('3', sectorId, 3),
    buildStar('1', sectorId, 1),
  ];
  const store = createStarSectorTileStore(stars);
  assert.equal(store.starCount, 4);
  assert.equal(store.tileCount, 1);

  const targetStar = buildStar('1', sectorId, 1);
  const window = store.getWindow(targetStar, { maxStars: 10, minStars: 2 });
  assert.equal(window.mode, 'sector');
  assert.equal(window.targetIncluded, true);
  assert.equal(window.stars.length, 3);
  assert.ok(window.sectorIds.length > 0);
  assert.equal(new Set(window.stars.map((star) => star.id)).size, window.stars.length);
});

test('remote star tile provider cache-only path loads manifest and tile entries from storage', async () => {
  resetAsyncStorage();
  await mockAsyncStorage.setItem('@star_tile_manifest_v1', JSON.stringify({
    catalogVersion: 'v1',
    sectors: [{ id: 'r0-d0-s0', count: 2 }],
  }));
  await mockAsyncStorage.setItem('@star_tile_v1:v1:r0-d0-s0', JSON.stringify([
    { id: 'a', magnitude: 1 },
    { id: 'b', magnitude: 2 },
  ]));
  await mockAsyncStorage.setItem('@star_tile_disk_lru_v1', JSON.stringify(['@star_tile_v1:r0-d0-s0']));

  const targetStar = { sectorId: 'r0-d0-s0' };
  const result = await loadRemoteStarSectorWindow(targetStar, { cacheOnly: true, minStars: 1, maxStars: 2 });
  assert.equal(result.catalogVersion, 'v1');
  assert.deepEqual(result.sectorIds, ['r0-d0-s0']);
  assert.equal(result.stars.length, 2);
  assert.equal(result.stars[0].id, 'a');
});

test('star tile offline mode setters and getters persist boolean state', async () => {
  resetAsyncStorage();
  const setResult = await setStarTileOfflineMode(true);
  assert.equal(setResult, true);
  assert.equal(await getStarTileOfflineMode(), true);
  await setStarTileOfflineMode(false);
  assert.equal(await getStarTileOfflineMode(), false);
});

test('remote star tile cache stats report stored tile count and catalog version', async () => {
  resetAsyncStorage();
  await mockAsyncStorage.setItem('@star_tile_manifest_v1', JSON.stringify({
    catalogVersion: 'v1',
    sectors: [{ id: 'r0-d0-s0', count: 1 }],
  }));
  await mockAsyncStorage.setItem('@star_tile_disk_lru_v1', JSON.stringify(['@star_tile_v1:r0-d0-s0']));
  await mockAsyncStorage.setItem('@star_tile_v1:r0-d0-s0', JSON.stringify([{ id: 'a', magnitude: 1 }]));

  const stats = await getRemoteStarTileCacheStats();
  assert.equal(stats.tileCount, 1);
  assert.equal(stats.catalogVersion, 'v1');
  assert.ok(stats.byteSize > 0);
});

test('clearRemoteStarTileDiskCache removes disk keys and resets cache state', async () => {
  resetAsyncStorage();
  await mockAsyncStorage.setItem('@star_tile_manifest_v1', JSON.stringify({
    catalogVersion: 'v1',
    sectors: [{ id: 'r0-d0-s0', count: 1 }],
  }));
  await mockAsyncStorage.setItem('@star_tile_disk_lru_v1', JSON.stringify(['@star_tile_v1:r0-d0-s0']));
  await mockAsyncStorage.setItem('@star_tile_v1:r0-d0-s0', JSON.stringify([{ id: 'a', magnitude: 1 }]));

  await clearRemoteStarTileDiskCache();
  const stats = await getRemoteStarTileCacheStats();
  assert.equal(stats.tileCount, 0);
  assert.equal(stats.catalogVersion, 'v1');
});
