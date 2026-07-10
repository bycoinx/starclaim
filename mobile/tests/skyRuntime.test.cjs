const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

function loadApplicationModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const previousLoader = require.extensions['.js'];
  require.extensions['.js'] = (module, moduleFilename) => {
    if (!moduleFilename.includes(`${path.sep}src${path.sep}`)) {
      return previousLoader(module, moduleFilename);
    }
    const moduleSource = fs.readFileSync(moduleFilename, 'utf8');
    const moduleTransformed = transformSync(moduleSource, {
      filename: moduleFilename,
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    return module._compile(moduleTransformed.code, moduleFilename);
  };
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = transformSync(source, {
    filename,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  try {
    loaded._compile(transformed.code, filename);
    return loaded.exports;
  } finally {
    require.extensions['.js'] = previousLoader;
  }
}

const {
  createObserverFromLocation,
  getEquatorialViewportCenter,
  getHorizontalPositionForObject,
  getSensorCanvasTarget,
  isSensorHeadingStale,
  limitSensorCanvasTarget,
  shouldCommitSensorView,
  smoothHeading,
} = loadApplicationModule('../src/sky/skyRuntime.js');

test('creates observer from Expo location payload', () => {
  assert.deepEqual(
    createObserverFromLocation({ coords: { latitude: 37.01, longitude: 35.31 } }),
    { latitude: 37.01, longitude: 35.31 },
  );
});

test('rejects invalid observer location payloads', () => {
  assert.equal(createObserverFromLocation(null), null);
  assert.equal(createObserverFromLocation({ coords: { latitude: 'x', longitude: 35.31 } }), null);
  assert.equal(createObserverFromLocation({ coords: { latitude: 95, longitude: 35.31 } }), null);
  assert.equal(createObserverFromLocation({ coords: { latitude: 37.01, longitude: -190 } }), null);
});

test('heading smoothing follows the shortest path across north', () => {
  const next = smoothHeading(359, 1, 0, 0.5);
  assert.ok(next > 359 || next < 1, `expected wrap-safe heading, received ${next}`);
});

test('sensor canvas target clamps altitude and keeps heading normalized', () => {
  assert.deepEqual(getSensorCanvasTarget(370, 200), { ra: 10, dec: 90 });
  assert.deepEqual(getSensorCanvasTarget(-10, -200), { ra: 350, dec: -90 });
});

test('sensor canvas target is rate limited for planetarium-style motion', () => {
  const limited = limitSensorCanvasTarget(
    { ra: 350, dec: 0 },
    { ra: 20, dec: 40 },
    100,
    { maxHeadingDegreesPerSecond: 30, maxTiltDegreesPerSecond: 20 },
  );

  assert.equal(limited.ra, 353);
  assert.equal(limited.dec, 2);
});

test('horizontal viewport center converts to finite equatorial coordinates', () => {
  const center = getEquatorialViewportCenter({
    coordinateMode: 'horizontal',
    observer: { latitude: 41.0082, longitude: 28.9784 },
    centerRa: 180,
    centerDec: 45,
    siderealTime: 125.5,
  });
  assert.ok(Number.isFinite(center.raDegrees));
  assert.ok(Number.isFinite(center.dec));
});

test('horizontal object position remains finite', () => {
  const position = getHorizontalPositionForObject(
    { raHours: 6.752481, decDegrees: -16.716116 },
    { latitude: 41.0082, longitude: 28.9784 },
    new Date('2026-06-21T12:00:00.000Z'),
  );
  assert.ok(Number.isFinite(position.az));
  assert.ok(Number.isFinite(position.alt));
});

test('sensor view commits are throttled by interval and motion threshold', () => {
  const previousTarget = { ra: 10, dec: 5 };
  assert.equal(shouldCommitSensorView({
    previousTarget,
    nextTarget: { ra: 10.1, dec: 5.1 },
    lastCommitAt: 100,
    nowMs: 120,
  }), false);
  assert.equal(shouldCommitSensorView({
    previousTarget,
    nextTarget: { ra: 11, dec: 5 },
    lastCommitAt: 100,
    nowMs: 200,
  }), true);
});

test('sensor heading stale detection waits for startup grace and then trips', () => {
  assert.equal(isSensorHeadingStale({
    lastHeadingAt: 0,
    sensorStartedAt: 1000,
    nowMs: 3000,
  }), false);
  assert.equal(isSensorHeadingStale({
    lastHeadingAt: 0,
    sensorStartedAt: 1000,
    nowMs: 6001,
  }), true);
  assert.equal(isSensorHeadingStale({
    lastHeadingAt: 5000,
    sensorStartedAt: 1000,
    nowMs: 6200,
  }), false);
  assert.equal(isSensorHeadingStale({
    lastHeadingAt: 5000,
    sensorStartedAt: 1000,
    nowMs: 6601,
  }), true);
});
