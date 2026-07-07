const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const mockAsyncStorage = {
  store: {},
  async getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
  async setItem(key, value) { this.store[key] = value; },
  async removeItem(key) { delete this.store[key]; },
  async clear() { this.store = {}; },
};

const projectRoot = path.resolve(__dirname, '..');

function loadApplicationModule(filePath) {
  const filename = path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, filePath);
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, {
    filename,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(transformed.code, filename);
  return loaded.exports;
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@react-native-async-storage/async-storage') return mockAsyncStorage;

  if (request.startsWith('.') || path.isAbsolute(request)) {
    const parentDir = path.dirname(this.filename);
    const resolved = path.isAbsolute(request) ? request : path.resolve(parentDir, request);
    let finalPath = resolved;
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

const {
  ensureStarData,
  STAR_CATALOG_KEYS,
} = loadApplicationModule('../src/data/starLoader.js');

test('Phase 3 self-check: cache meta read, reset, and reseed from bundled catalog', async () => {
  await mockAsyncStorage.clear();

  const starsFirstBoot = await ensureStarData();
  assert.ok(Array.isArray(starsFirstBoot));
  assert.ok(starsFirstBoot.length >= 3000);

  const firstMetaRaw = await mockAsyncStorage.getItem(STAR_CATALOG_KEYS.snapshotMeta);
  assert.ok(firstMetaRaw, 'snapshot meta should be written on first load');
  const firstMeta = JSON.parse(firstMetaRaw);
  assert.equal(firstMeta.version, 'hyg-v4.1-mag6-core-v2');
  assert.equal(firstMeta.source, 'bundled');
  assert.equal(firstMeta.count, starsFirstBoot.length);

  const uniqueIds = new Set(starsFirstBoot.map((star) => String(star.id)));
  assert.equal(uniqueIds.size, starsFirstBoot.length, 'HYG IDs must be deduplicated');

  await mockAsyncStorage.removeItem(STAR_CATALOG_KEYS.snapshotMeta);
  await mockAsyncStorage.removeItem(STAR_CATALOG_KEYS.core);

  assert.equal(await mockAsyncStorage.getItem(STAR_CATALOG_KEYS.snapshotMeta), null);
  assert.equal(await mockAsyncStorage.getItem(STAR_CATALOG_KEYS.core), null);

  const starsAfterReset = await ensureStarData();
  assert.ok(Array.isArray(starsAfterReset));
  assert.ok(starsAfterReset.length >= 3000);

  const secondMetaRaw = await mockAsyncStorage.getItem(STAR_CATALOG_KEYS.snapshotMeta);
  assert.ok(secondMetaRaw, 'snapshot meta should be recreated after reset');
  const secondMeta = JSON.parse(secondMetaRaw);
  assert.equal(secondMeta.version, 'hyg-v4.1-mag6-core-v2');
  assert.equal(secondMeta.source, 'bundled');
  assert.equal(secondMeta.count, starsAfterReset.length);
});
