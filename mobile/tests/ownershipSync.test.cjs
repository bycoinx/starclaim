const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const projectRoot = path.resolve(__dirname, '..');
const originalRequire = Module.prototype.require;

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

Module.prototype.require = function patchedRequire(request) {
  if (request === '@react-native-async-storage/async-storage') {
    return { getItem: async () => null, setItem: async () => {}, multiSet: async () => {} };
  }
  if (request === 'expo-crypto') {
    return { CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => '' };
  }

  if (request.startsWith('.') || path.isAbsolute(request)) {
    const parentDir = path.dirname(this.filename);
    let resolvedPath = path.isAbsolute(request) ? request : path.resolve(parentDir, request);
    if (!fs.existsSync(resolvedPath)) {
      if (fs.existsSync(`${resolvedPath}.js`)) resolvedPath = `${resolvedPath}.js`;
    }
    if (
      resolvedPath.endsWith('.js')
      && resolvedPath.includes(projectRoot)
      && !resolvedPath.includes(`${path.sep}node_modules${path.sep}`)
    ) {
      if (resolvedPath.endsWith(`${path.sep}constants${path.sep}Config.js`)) {
        return { CONFIG: { getAPIUrl: async () => 'http://localhost:8000' } };
      }
      if (resolvedPath.endsWith(`${path.sep}lib${path.sep}security.js`)) {
        return { SecurityService: { getSession: async () => null } };
      }
      return loadApplicationModule(resolvedPath);
    }
  }

  return originalRequire.apply(this, arguments);
};

const {
  OWNERSHIP_SYNC_EVENT,
  emitOwnershipSync,
  normalizeOwnershipSyncPayload,
  onOwnershipSync,
} = loadApplicationModule('../src/platform/ownership/ownershipSyncEvents.js');
const {
  normalizeOwnershipRecords,
  ownershipRecordMatchesId,
} = loadApplicationModule('../src/platform/ownership/ownershipRepository.js');

test('ownership sync payload preserves canonical star identifiers', () => {
  const payload = normalizeOwnershipSyncPayload({
    orderId: 'ord-1',
    star_id: 'star-1',
    canonical_id: 'hip:32349',
    catalog_id: 'hyg:32349',
    source_id: '32349',
    gaia_source_id: '5793498453934637824',
    code: 'SIRI-001',
    name: 'Sirius',
  });

  assert.equal(payload.orderId, 'ord-1');
  assert.equal(payload.starId, 'star-1');
  assert.equal(payload.canonicalId, 'hip:32349');
  assert.equal(payload.catalogId, 'hyg:32349');
  assert.equal(payload.sourceId, '32349');
  assert.equal(payload.gaiaSourceId, '5793498453934637824');
  assert.equal(payload.starClaimCode, 'SIRI-001');
});

test('ownership sync emission waits for async listeners', async () => {
  const calls = [];
  const unsubscribe = onOwnershipSync(async (event, payload) => {
    await new Promise((resolve) => { setTimeout(resolve, 5); });
    calls.push(`${event}:${payload.starId}`);
    return 'done';
  });

  const results = await emitOwnershipSync(OWNERSHIP_SYNC_EVENT.PURCHASE_COMMITTED, { starId: 'star-1' });
  unsubscribe();

  assert.deepEqual(calls, ['purchase-committed:star-1']);
  assert.equal(results.length >= 1, true);
  assert.equal(results.some((result) => result.status === 'fulfilled'), true);
});

test('ownership records normalize and match across shared identity fields', () => {
  const [record] = normalizeOwnershipRecords([{
    id: 'ord-2',
    star_id: 'star-2',
    canonical_id: 'gaia-dr3:42',
    catalog_id: 'gaia:42',
    source_id: '42',
    gaia_source_id: '42',
    star_claim_code: 'GAIA-42',
    customName: 'Atlas Node',
    createdAt: '2026-07-11T00:00:00.000Z',
  }]);

  assert.equal(record.starId, 'star-2');
  assert.equal(record.canonicalId, 'gaia-dr3:42');
  assert.equal(record.name, 'Atlas Node');
  assert.equal(ownershipRecordMatchesId(record, 'gaia-dr3:42'), true);
  assert.equal(ownershipRecordMatchesId(record, 'GAIA-42'), true);
  assert.equal(ownershipRecordMatchesId(record, 'missing'), false);
});
