import {
  buildARConstellationSegments,
  buildCatalogPresentationIndex,
  buildConstellationStateIndex,
  enrichStarWithCatalogPresentation,
} from '../catalogSkyPresentation';

test('joins canonical presentation by HIP without replacing astronomy fields', () => {
  const index = buildCatalogPresentationIndex([
    { canonicalId: 'hip:1', hip: 1, iauCode: 'Ori', availabilityState: 'available', price: 900 },
  ]);
  expect(enrichStarWithCatalogPresentation({ id: 'hyg-1', hip: 1, ra: 5, dec: -2 }, index)).toMatchObject({
    id: 'hyg-1', canonicalId: 'hip:1', ra: 5, dec: -2, availabilityState: 'available', price: 900,
  });
});

test('constellation state keeps viewer ownership distinct from global claims', () => {
  const index = buildConstellationStateIndex([
    { key: 'Ori', iauCode: 'Ori', name: 'Orion', total: 3, owned: 1, claimed: 1, available: 1, completionPercent: 33 },
    { key: 'Lyr', iauCode: 'Lyr', name: 'Lyra', total: 2, owned: 0, claimed: 2, available: 0 },
  ]);
  expect(index.get('ori')).toMatchObject({ state: 'owned', completionPercent: 33 });
  expect(index.get('lyr')).toMatchObject({ state: 'claimed', owned: 0 });
});

test('AR projection emits only curated constellation segments with state', () => {
  const states = buildConstellationStateIndex([
    { iauCode: 'Ori', name: 'Orion', total: 2, owned: 0, claimed: 0, available: 2 },
  ]);
  const segments = buildARConstellationSegments({
    features: [{ id: 'Ori', geometry: { type: 'MultiLineString', coordinates: [[[0, 30], [2, 30]]] } }],
    constellationStates: states,
    lstDegrees: 0,
    latitude: 0,
    deviceAz: 0,
    deviceAlt: 60,
    width: 400,
    height: 800,
    fovX: 180,
    fovY: 180,
  });
  expect(segments).toHaveLength(1);
  expect(segments[0]).toMatchObject({ state: 'available', constellation: 'Ori' });
});
