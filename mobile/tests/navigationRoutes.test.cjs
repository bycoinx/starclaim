const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

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
Module.prototype.require = function patchedRequire(request) {
  if (request.startsWith('.') || path.isAbsolute(request)) {
    const parentDir = path.dirname(this.filename);
    let finalPath = path.isAbsolute(request) ? request : path.resolve(parentDir, request);
    if (!fs.existsSync(finalPath)) {
      if (fs.existsSync(`${finalPath}.js`)) finalPath = `${finalPath}.js`;
      else if (fs.existsSync(`${finalPath}.json`)) finalPath = `${finalPath}.json`;
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
  ROUTES,
  TAB_ITEMS,
  getActiveTabKey,
  starDetailRoute,
  starMapRoute,
  starVoyageRoute,
} = loadApplicationModule('../src/platform/navigation/routes.js');
const {
  createDeepLinkTarget,
  resolveParsedDeepLinkRoute,
} = loadApplicationModule('../src/platform/navigation/deepLinks.js');
const { getPurchaseMapParams } = loadApplicationModule('../src/utils/starIdentity.js');

const STARS = [
  {
    id: 'sirius-id',
    hip: 32349,
    hd: 48915,
    proper: 'Sirius',
    name: 'Sirius',
    starClaimCode: 'SIRIUS-A',
    raHours: 6.752,
    raDegrees: 101.287,
    decDegrees: -16.716,
    distanceParsec: 2.637,
    magnitude: -1.46,
    spectralType: 'A1V',
    constellation: 'Canis Major',
  },
];

test('tab routes expose the mobile production shell entry points', () => {
  assert.deepEqual(TAB_ITEMS.map((item) => item.key), ['claim', 'sky', 'universe', 'vault', 'profile']);
  assert.equal(TAB_ITEMS.find((item) => item.key === 'claim').href, ROUTES.claim);
  assert.equal(TAB_ITEMS.find((item) => item.key === 'vault').href, ROUTES.vaultHome);
  assert.equal(getActiveTabKey('/(tabs)/explore/starmap'), 'sky');
  assert.equal(getActiveTabKey('/(tabs)/sky'), 'sky');
  assert.equal(getActiveTabKey('/(tabs)/explore/starvoyage'), 'universe');
  assert.equal(getActiveTabKey('/(tabs)/vault/home'), 'vault');
  assert.equal(getActiveTabKey('/(tabs)/mystars/collection'), 'profile');
});

test('route builders keep star identity params compact and stable', () => {
  assert.deepEqual(starDetailRoute({ starId: 'sirius-id', name: '' }), {
    pathname: ROUTES.starDetail,
    params: { starId: 'sirius-id' },
  });
  assert.deepEqual(starMapRoute({ starId: 'sirius-id', hip: 32349, hd: null }), {
    pathname: ROUTES.starMap,
    params: { starId: 'sirius-id', hip: 32349 },
  });
  assert.deepEqual(starVoyageRoute({ id: 'sirius-id', name: 'Sirius' }), {
    pathname: ROUTES.starVoyage,
    params: { target: JSON.stringify({ id: 'sirius-id', name: 'Sirius' }) },
  });
});

test('deep links resolve star, hip and vault targets to app routes', () => {
  assert.deepEqual(createDeepLinkTarget('star', 'SIRIUS-A'), { starClaimCode: 'SIRIUS-A' });
  assert.deepEqual(createDeepLinkTarget('hip', '32349'), { hip: '32349' });

  const starRoute = resolveParsedDeepLinkRoute({ hostname: 'star', path: 'SIRIUS-A' }, STARS);
  assert.equal(starRoute.pathname, ROUTES.starMap);
  assert.equal(starRoute.params.starId, 'sirius-id');
  assert.equal(starRoute.params.starClaimCode, 'SIRIUS-A');

  const hipRoute = resolveParsedDeepLinkRoute({ hostname: 'hip', path: '32349' }, STARS);
  assert.equal(hipRoute.pathname, ROUTES.starMap);
  assert.equal(hipRoute.params.hip, 32349);

  assert.deepEqual(resolveParsedDeepLinkRoute({ hostname: 'vault', path: 'item/sirius-id' }, []), {
    pathname: ROUTES.vaultHome,
  });
});

test('purchase map params preserve the star identity for direct navigation', () => {
  const params = getPurchaseMapParams({
    starId: 'sirius-id',
    hip: 32349,
    hd: 48915,
    name: 'Sirius',
    starClaimCode: 'SIRIUS-A',
  });
  assert.equal(params.starId, 'sirius-id');
  assert.equal(params.hip, 32349);
  assert.equal(params.starClaimCode, 'SIRIUS-A');
});

test('unsupported or unresolved deep links are ignored', () => {
  assert.equal(createDeepLinkTarget('marketplace', 'SIRIUS-A'), null);
  assert.equal(resolveParsedDeepLinkRoute({ hostname: 'star', path: 'UNKNOWN' }, STARS), null);
  assert.equal(resolveParsedDeepLinkRoute({ hostname: '', path: '' }, STARS), null);
});

test('deep links handle leading slash paths and vault root correctly', () => {
  const starRoute = resolveParsedDeepLinkRoute({ hostname: 'star', path: '/SIRIUS-A' }, STARS);
  assert.equal(starRoute.pathname, ROUTES.starMap);
  assert.equal(starRoute.params.starClaimCode, 'SIRIUS-A');

  assert.deepEqual(resolveParsedDeepLinkRoute({ hostname: 'vault', path: '' }, STARS), {
    pathname: ROUTES.vaultHome,
  });
  assert.deepEqual(resolveParsedDeepLinkRoute({ hostname: 'vault', path: '/item/sirius-id' }, STARS), {
    pathname: ROUTES.vaultHome,
  });
});
