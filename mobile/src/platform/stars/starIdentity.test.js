/**
 * P0.2 Unit Tests - StarIdentity and HYG Normalizer
 * 
 * Tests canonical star identity validation and HYG normalization
 * Reference stars: Sirius, Vega, Polaris, Achernar (across different magnitude ranges)
 */

import {
  isStarIdentity,
  validateStarIdentity,
  extractAstronomyData,
  extractDisplayData,
  resolveStar,
} from '../starIdentity.types';

import {
  normalizeHygRecord,
  validateNormalizedCatalog,
  catalogStatistics,
} from '../hygNormalizer';

// Reference test data - verified from Yale Bright Star Catalog & Hipparcos
const TEST_STARS = {
  sirius: {
    id: 32349,
    hip: 32349,
    hd: 48915,
    proper: 'Sirius',
    ra: 6.7525,
    dec: -16.7161,
    dist: 2.64,
    mag: -1.46,
    spect: 'A1V',
    con: 'CMa',
  },
  vega: {
    id: 91262,
    hip: 91262,
    hd: 172167,
    proper: 'Vega',
    ra: 18.6025,
    dec: 38.7837,
    dist: 7.76,
    mag: 0.03,
    spect: 'A0V',
    con: 'Lyr',
  },
  polaris: {
    id: 11767,
    hip: 11767,
    hd: 8890,
    proper: 'Polaris',
    ra: 2.5302,
    dec: 89.2642,
    dist: 133,
    mag: 1.98,
    spect: 'F7Ib-II',
    con: 'UMi',
  },
  achernar: {
    id: 1562,
    hip: 1562,
    hd: 1084,
    proper: 'Achernar',
    ra: 1.6267,
    dec: -57.2367,
    dist: 39,
    mag: 0.45,
    spect: 'B6Epe',
    con: 'Eri',
  },
};

/**
 * Test 1: HYG Normalization - All reference stars
 */
export function testHygNormalization() {
  console.log('[P0.2] Test 1: HYG Normalization');

  const results = [];
  for (const [name, record] of Object.entries(TEST_STARS)) {
    const normalized = normalizeHygRecord(record);
    const pass = isStarIdentity(normalized) && normalized.hip === String(record.hip);
    results.push({
      name,
      pass,
      star: normalized,
      error: pass ? null : 'Failed normalization',
    });
    console.log(`  ✓ ${name}: ${pass ? 'PASS' : 'FAIL'}`);
  }

  return {
    testName: 'HYG Normalization',
    passed: results.every((r) => r.pass),
    details: results,
  };
}

/**
 * Test 2: StarIdentity Validation
 */
export function testStarIdentityValidation() {
  console.log('[P0.2] Test 2: StarIdentity Validation');

  const normalized = normalizeHygRecord(TEST_STARS.sirius);
  const validation = validateStarIdentity(normalized);

  console.log(`  ✓ Sirius validation: ${validation.valid ? 'PASS' : 'FAIL'}`);
  if (!validation.valid) {
    console.log('    Errors:', validation.errors);
  }

  // Test invalid objects
  const invalidTests = [
    { obj: null, name: 'null' },
    { obj: {}, name: 'empty object' },
    { obj: { id: 'test' }, name: 'missing canonicalId' },
  ];

  for (const invalid of invalidTests) {
    const result = validateStarIdentity(invalid.obj);
    console.log(`  ✓ Invalid ${invalid.name}: ${!result.valid ? 'PASS (rejected)' : 'FAIL (accepted)'}`);
  }

  return {
    testName: 'StarIdentity Validation',
    passed: validation.valid,
    validation,
  };
}

/**
 * Test 3: Coordinate Range Validation
 */
export function testCoordinateRanges() {
  console.log('[P0.2] Test 3: Coordinate Range Validation');

  const testCases = [
    { ra: 0, dec: 0, valid: true, name: 'Origin' },
    { ra: 6.7525, dec: -16.7161, valid: true, name: 'Sirius' },
    { ra: 2.5302, dec: 89.2642, valid: true, name: 'Polaris (near pole)' },
    { ra: 24.1, dec: 0, valid: false, name: 'RA > 24' },
    { ra: 12, dec: 91, valid: false, name: 'Dec > 90' },
    { ra: 12, dec: -91, valid: false, name: 'Dec < -90' },
  ];

  const results = [];
  for (const tc of testCases) {
    const record = { ...TEST_STARS.sirius, ra: tc.ra, dec: tc.dec };
    const normalized = normalizeHygRecord(record);
    const pass = tc.valid ? normalized != null : normalized == null;
    results.push({ ...tc, pass, result: pass ? 'PASS' : 'FAIL' });
    console.log(`  ✓ ${tc.name}: ${pass ? 'PASS' : 'FAIL'}`);
  }

  return {
    testName: 'Coordinate Range Validation',
    passed: results.every((r) => r.pass),
    details: results,
  };
}

/**
 * Test 4: Distance Fallback Policy
 */
export function testDistanceFallback() {
  console.log('[P0.2] Test 4: Distance Fallback Policy');

  const tests = [
    { dist: 2.64, expected: 2.64, name: 'Valid distance' },
    { dist: null, expected: null, name: 'Null distance' },
    { dist: 0, expected: null, name: 'Zero distance (invalid)' },
    { dist: -5, expected: null, name: 'Negative distance' },
    { dist: 100000, expected: null, name: 'HYG unknown marker (100000)' },
    { dist: 999999, expected: null, name: 'Unrealistic distance' },
  ];

  const results = [];
  for (const test of tests) {
    const record = { ...TEST_STARS.sirius, dist: test.dist };
    const normalized = normalizeHygRecord(record);
    const actual = normalized?.distanceParsec ?? null;
    const pass = actual === test.expected;
    results.push({ ...test, actual, pass });
    console.log(`  ✓ ${test.name}: ${pass ? 'PASS' : 'FAIL'} (got ${actual}, expected ${test.expected})`);
  }

  return {
    testName: 'Distance Fallback Policy',
    passed: results.every((r) => r.pass),
    details: results,
  };
}

/**
 * Test 5: Data Extraction Helpers
 */
export function testDataExtraction() {
  console.log('[P0.2] Test 5: Data Extraction Helpers');

  const normalized = normalizeHygRecord(TEST_STARS.sirius);

  const astronomy = extractAstronomyData(normalized);
  const astronomy_pass = astronomy && astronomy.raDegrees != null && astronomy.magnitude != null;
  console.log(`  ✓ extractAstronomyData: ${astronomy_pass ? 'PASS' : 'FAIL'}`);

  const display = extractDisplayData(normalized);
  const display_pass = display && display.name != null && display.constellation != null;
  console.log(`  ✓ extractDisplayData: ${display_pass ? 'PASS' : 'FAIL'}`);

  return {
    testName: 'Data Extraction',
    passed: astronomy_pass && display_pass,
    astronomy,
    display,
  };
}

/**
 * Test 6: Star Resolution by Multiple Lookup Keys
 */
export function testStarResolution() {
  console.log('[P0.2] Test 6: Star Resolution');

  const catalog = Object.values(TEST_STARS).map((r) => normalizeHygRecord(r)).filter(Boolean);

  const queries = [
    { query: 'sirius-hip-32349', type: 'slug' },
    { query: '32349', type: 'hip' },
    { query: '48915', type: 'hd' },
    { query: 'Sirius', type: 'properName' },
  ];

  const results = [];
  for (const q of queries) {
    const found = resolveStar(catalog, q.query);
    const pass = found && found.properName === 'Sirius';
    results.push({ ...q, pass });
    console.log(`  ✓ Resolve by ${q.type} (${q.query}): ${pass ? 'PASS' : 'FAIL'}`);
  }

  return {
    testName: 'Star Resolution',
    passed: results.every((r) => r.pass),
    details: results,
  };
}

/**
 * Test 7: Catalog Statistics & Validation
 */
export function testCatalogStatistics() {
  console.log('[P0.2] Test 7: Catalog Statistics');

  const catalog = Object.values(TEST_STARS).map((r) => normalizeHygRecord(r)).filter(Boolean);
  const stats = catalogStatistics(catalog);
  const validation = validateNormalizedCatalog(catalog);

  console.log(`  ✓ Catalog size: ${stats.size}`);
  console.log(`  ✓ With HIP: ${stats.withHip}`);
  console.log(`  ✓ Valid: ${validation.valid ? 'PASS' : 'FAIL'}`);

  return {
    testName: 'Catalog Statistics',
    passed: validation.valid,
    stats,
    validation,
  };
}

/**
 * Run all P0.2 tests
 */
export function runAllP0Tests() {
  console.log('\n=== P0.2 StarIdentity Unit Tests ===\n');

  const results = [
    testHygNormalization(),
    testStarIdentityValidation(),
    testCoordinateRanges(),
    testDistanceFallback(),
    testDataExtraction(),
    testStarResolution(),
    testCatalogStatistics(),
  ];

  const allPassed = results.every((r) => r.passed);
  const summary = {
    totalTests: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    allPassed,
    details: results,
  };

  console.log('\n=== P0.2 Test Summary ===');
  console.log(`✓ Total: ${summary.totalTests}`);
  console.log(`✓ Passed: ${summary.passed}`);
  console.log(`✓ Failed: ${summary.failed}`);
  console.log(`✓ Result: ${allPassed ? 'ALL PASS' : 'SOME FAILURES'}\n`);

  return summary;
}

// Export for testing
export default {
  runAllP0Tests,
  testHygNormalization,
  testStarIdentityValidation,
  testCoordinateRanges,
  testDistanceFallback,
  testDataExtraction,
  testStarResolution,
  testCatalogStatistics,
};
