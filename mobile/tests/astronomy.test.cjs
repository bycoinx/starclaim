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
  getGreenwichSiderealTime,
  getLocalSiderealTime,
  altAzToRaDec,
  colorForStar,
  normalizeRaDelta,
  projectRaDec,
  raDecToAltAz,
} = loadApplicationModule('../src/utils/astronomy.js');

test('horizontal and equatorial coordinates round-trip within numerical tolerance', () => {
  const horizontal = raDecToAltAz(6.752481, -16.716116, 41.0082, 125.5);
  const equatorial = altAzToRaDec(horizontal.az, horizontal.alt, 41.0082, 125.5);
  assert.ok(Math.abs(equatorial.ra - 6.752481) < 1e-9);
  assert.ok(Math.abs(equatorial.dec - (-16.716116)) < 1e-9);
});

test('Gaia BP-RP color is preferred and spectral class remains a fallback', () => {
  assert.equal(colorForStar({ colorIndex: -0.3, spectralType: 'M' }), '#9DBBFF');
  assert.equal(colorForStar({ colorIndex: 1.6, spectralType: 'O' }), '#FF9B82');
  assert.equal(colorForStar({ spectralType: 'G2V' }), '#FFF0C2');
});

const STARS = {
  sirius: { raHours: 6.752481, decDegrees: -16.716116 },
  vega: { raHours: 18.615649, decDegrees: 38.783689 },
  polaris: { raHours: 2.530301, decDegrees: 89.264109 },
  achernar: { raHours: 1.628571, decDegrees: -57.236753 },
};

function closeTo(actual, expected, tolerance = 0.02) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test('J2000 Greenwich sidereal time matches the Meeus reference epoch', () => {
  closeTo(getGreenwichSiderealTime(new Date('2000-01-01T12:00:00.000Z')), 280.46061837, 1e-8);
});

test('local sidereal time wraps at 0/360 degrees and respects longitude', () => {
  const instant = new Date('2000-01-01T12:00:00.000Z');
  closeTo(getLocalSiderealTime(90, instant), 10.46061837, 1e-8);
  closeTo(getLocalSiderealTime(-120, instant), 160.46061837, 1e-8);
});

test('equivalent timezone timestamps produce the same sidereal time', () => {
  const utc = getGreenwichSiderealTime(new Date('2026-06-21T12:00:00.000Z'));
  const istanbul = getGreenwichSiderealTime(new Date('2026-06-21T15:00:00.000+03:00'));
  closeTo(utc, istanbul, 1e-10);
});

test('sidereal time stays continuous across UTC date and year boundaries', () => {
  const beforeMidnight = getGreenwichSiderealTime(new Date('2025-12-31T23:59:59.000Z'));
  const afterMidnight = getGreenwichSiderealTime(new Date('2026-01-01T00:00:01.000Z'));
  closeTo(normalizeRaDelta(afterMidnight - beforeMidnight), 0.008356, 0.00001);
});

test('Sirius transits south at the expected altitude from Greenwich', () => {
  const result = raDecToAltAz(
    STARS.sirius.raHours,
    STARS.sirius.decDegrees,
    51.4779,
    STARS.sirius.raHours * 15,
  );
  closeTo(result.alt, 21.806, 0.02);
  closeTo(result.az, 180, 0.02);
});

test('Polaris remains near north and near the observer latitude', () => {
  const result = raDecToAltAz(
    STARS.polaris.raHours,
    STARS.polaris.decDegrees,
    40,
    STARS.polaris.raHours * 15,
  );
  closeTo(result.alt, 40.736, 0.02);
  closeTo(result.az, 0, 0.02);
});

test('Vega is correctly placed from the southern hemisphere', () => {
  const result = raDecToAltAz(
    STARS.vega.raHours,
    STARS.vega.decDegrees,
    -33.8688,
    STARS.vega.raHours * 15,
  );
  closeTo(result.alt, 17.348, 0.02);
  closeTo(result.az, 0, 0.02);
});

test('Achernar transits high in the southern sky from Cape Town', () => {
  const result = raDecToAltAz(
    STARS.achernar.raHours,
    STARS.achernar.decDegrees,
    -33.9249,
    STARS.achernar.raHours * 15,
  );
  closeTo(result.alt, 66.688, 0.02);
  closeTo(result.az, 180, 0.02);
});

test('RA deltas and projections stay continuous across the 0/24h boundary', () => {
  closeTo(normalizeRaDelta(359.8 - 0.2), -0.4, 1e-10);
  closeTo(normalizeRaDelta(0.2 - 359.8), 0.4, 1e-10);

  const left = projectRaDec({ raHours: 23.986666667, decDegrees: 0 }, 0, 0, 1000, 500, 1);
  const right = projectRaDec({ raHours: 0.013333333, decDegrees: 0 }, 0, 0, 1000, 500, 1);
  closeTo(left.x, 497.778, 0.02);
  closeTo(right.x, 502.222, 0.02);
  assert.ok(Math.abs(right.x - left.x) < 5, 'RA seam should remain a short visual segment');
});

test('altitude remains finite at polar latitudes and declination inputs are clamped', () => {
  const northPole = raDecToAltAz(0, 95, 90, 0);
  const southPole = raDecToAltAz(0, -95, -90, 0);
  closeTo(northPole.alt, 90, 1e-8);
  closeTo(southPole.alt, 90, 1e-8);
  assert.ok(Number.isFinite(northPole.az));
  assert.ok(Number.isFinite(southPole.az));
});
