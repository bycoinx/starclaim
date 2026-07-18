import { buildCatalogCollections } from '../catalogCollections';

const stars = [
  { canonicalId: 'hip:1', constellation: 'Ursa Major', iauCode: 'UMa', asterisms: ['Big Dipper'], claimable: true },
  { canonicalId: 'hip:2', constellation: 'Ursa Major', iauCode: 'UMa', asterisms: ['Big Dipper'], isClaimed: true },
  { canonicalId: 'hip:3', constellation: 'Lyra', iauCode: 'Lyr', asterisms: ['Summer Triangle'], claimable: false },
];

test('separates viewer progress from global claims', () => {
  const result = buildCatalogCollections(stars, [{ canonicalId: 'hip:1' }]);
  expect(result.constellations.find((group) => group.iauCode === 'UMa')).toMatchObject({
    total: 2, owned: 1, claimed: 1, available: 0, completionPercent: 50,
  });
});

test('asterism completion is descriptive and keeps canonical products unique', () => {
  const result = buildCatalogCollections(stars, [{ canonicalId: 'hip:1' }, { canonicalId: 'hip:2' }]);
  const group = result.asterisms.find((item) => item.name === 'Big Dipper');
  expect(group).toMatchObject({ total: 2, owned: 2, isComplete: true });
  expect(new Set(group.stars.map((star) => star.canonicalId)).size).toBe(2);
});
