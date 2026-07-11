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
  if (request.startsWith('.') || path.isAbsolute(request)) {
    const parentDir = path.dirname(this.filename);
    let resolvedPath = path.isAbsolute(request) ? request : path.resolve(parentDir, request);
    if (!fs.existsSync(resolvedPath) && fs.existsSync(`${resolvedPath}.js`)) {
      resolvedPath = `${resolvedPath}.js`;
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
        return { SecurityService: { getSession: async () => ({ token: 'test-token', user: { id: 'user-1' } }) } };
      }
      return loadApplicationModule(resolvedPath);
    }
  }

  return originalRequire.apply(this, arguments);
};

const {
  MARKETPLACE_ACTIONS,
  normalizeMarketplaceListing,
  normalizeMarketplaceListings,
} = loadApplicationModule('../src/platform/marketplace/marketplaceRepository.js');

test('marketplace listing normalizer exposes the shared web and mobile contract', () => {
  const listing = normalizeMarketplaceListing({
    listing_id: 'lst-1',
    star_id: 'star-1',
    star_code: 'SIRIUS-A',
    star_name: 'Sirius',
    asking_price: '450',
    owner_id: 'seller-1',
    owner_name: 'Pilot One',
    status: 'active',
    listed_at: '2026-07-12T00:00:00.000Z',
  });

  assert.equal(listing.listingId, 'lst-1');
  assert.equal(listing.listing_id, 'lst-1');
  assert.equal(listing.starId, 'star-1');
  assert.equal(listing.star_id, 'star-1');
  assert.equal(listing.starClaimCode, 'SIRIUS-A');
  assert.equal(listing.code, 'SIRIUS-A');
  assert.equal(listing.name, 'Sirius');
  assert.equal(listing.askingPrice, 450);
  assert.equal(listing.asking_price, 450);
  assert.equal(listing.price, 450);
  assert.equal(listing.sellerId, 'seller-1');
  assert.equal(listing.sellerName, 'Pilot One');
  assert.equal(listing.canBuy, true);
  assert.deepEqual(listing.actions, ['viewDetail', 'buy', 'openVault', 'share']);
});

test('inactive marketplace listings remove buy while preserving safe actions', () => {
  const [listing] = normalizeMarketplaceListings([{
    listingId: 'lst-2',
    starId: 'star-2',
    starClaimCode: 'VEGA-LYR',
    askingPrice: 120,
    status: 'inactive',
    actions: ['viewDetail', 'buy', 'share', 'unknown'],
  }]);

  assert.equal(MARKETPLACE_ACTIONS.includes('unlist'), true);
  assert.equal(listing.canBuy, false);
  assert.deepEqual(listing.actions, ['viewDetail', 'share']);
});
