const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@babel/core');

function loadApplicationModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
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

const {
  isSkySegmentVisible,
  projectSkySegment,
  segmentIntersectsViewport,
} = loadApplicationModule('../src/utils/skyProjection.js');

const WIDTH = 1000;
const HEIGHT = 500;

function seamSegment(centerLongitude, zoom = 1) {
  return projectSkySegment(
    { ra: 359 / 15, dec: -10 },
    { ra: 1 / 15, dec: -10 },
    centerLongitude,
    -10,
    WIDTH,
    HEIGHT,
    zoom,
  );
}

test('constellation segment stays short when the RA seam is in view', () => {
  const segment = seamSegment(0);
  assert.ok(Math.abs(segment.p2.x - segment.p1.x) < 25);
  assert.equal(isSkySegmentVisible(segment, WIDTH, HEIGHT, 0, 'equatorial', 0), true);
});

test('RA seam segment does not become a false full-screen line on the opposite view', () => {
  const segment = seamSegment(180);
  assert.ok(Math.abs(segment.p2.x - segment.p1.x) < 25);
  assert.equal(isSkySegmentVisible(segment, WIDTH, HEIGHT, 0, 'equatorial', 0), false);
});

test('RA seam remains continuous while panning around 0/360 degrees', () => {
  for (const center of [358, 359, 0, 1, 2]) {
    const segment = seamSegment(center, 2);
    assert.ok(Math.abs(segment.p2.x - segment.p1.x) < 50, `unexpected span at ${center} degrees`);
  }
});

test('zoom changes scale without changing segment topology', () => {
  const normal = seamSegment(0, 1);
  const zoomed = seamSegment(0, 4);
  const normalSpan = Math.abs(normal.p2.x - normal.p1.x);
  const zoomedSpan = Math.abs(zoomed.p2.x - zoomed.p1.x);
  assert.ok(Math.abs(zoomedSpan / normalSpan - 4) < 0.001);
});

test('viewport intersection keeps a line whose endpoints are both outside', () => {
  assert.equal(
    segmentIntersectsViewport({ x: -100, y: 250 }, { x: 1100, y: 250 }, WIDTH, HEIGHT),
    true,
  );
});

test('viewport intersection rejects lines outside the same viewport edge', () => {
  assert.equal(
    segmentIntersectsViewport({ x: -100, y: -40 }, { x: 1100, y: -20 }, WIDTH, HEIGHT),
    false,
  );
});

test('horizontal constellation lines require both endpoints above the configured horizon', () => {
  const crossing = {
    p1: { x: 100, y: 200, skyAltitude: 5 },
    p2: { x: 900, y: 300, skyAltitude: -6 },
  };
  assert.equal(isSkySegmentVisible(crossing, WIDTH, HEIGHT, 0, 'horizontal', -5, true), false);
  assert.equal(isSkySegmentVisible(crossing, WIDTH, HEIGHT, 0, 'horizontal', 0, false), true);
});

test('IAU boundary fixture across 24h uses degree input converted to hours', () => {
  const firstBoundaryPoint = [359.75, 12];
  const secondBoundaryPoint = [0.25, 12];
  const segment = projectSkySegment(
    { ra: firstBoundaryPoint[0] / 15, dec: firstBoundaryPoint[1] },
    { ra: secondBoundaryPoint[0] / 15, dec: secondBoundaryPoint[1] },
    0,
    12,
    WIDTH,
    HEIGHT,
    2,
  );
  assert.ok(Math.abs(segment.p2.x - segment.p1.x) < 25);
  assert.equal(isSkySegmentVisible(segment, WIDTH, HEIGHT, 60, 'equatorial', 0), true);
});
