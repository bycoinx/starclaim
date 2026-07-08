import { getFeaturedStars, getNearbyStars, getTierMeta } from '../platform/stars/catalogSelection';

describe('mobile catalog selection helpers', () => {
  it('prioritizes legendary and brighter stars for featured picks', () => {
    const stars = [
      { id: '1', tier: 'standard', magnitude: 4.2, price: 400, distanceParsec: 50 },
      { id: '2', tier: 'legendary', magnitude: -1.4, price: 3200, distanceParsec: 8.6 },
      { id: '3', tier: 'supernova', magnitude: 0.2, price: 1500, distanceParsec: 30 },
      { id: '4', tier: 'nova', magnitude: 2.1, price: 900, distanceParsec: 120 },
    ];

    const featured = getFeaturedStars(stars, 3);

    expect(featured[0].id).toBe('2');
    expect(featured.map((star) => star.id)).toEqual(['2', '3', '4']);
  });

  it('returns nearby stars sorted by distance', () => {
    const stars = [
      { id: 'a', distanceParsec: 40 },
      { id: 'b', distanceParsec: 12 },
      { id: 'c', distanceParsec: 2 },
      { id: 'd', distanceParsec: 75 },
    ];

    const nearby = getNearbyStars(stars, 3);

    expect(nearby.map((star) => star.id)).toEqual(['c', 'b', 'a']);
  });

  it('returns localized tier metadata', () => {
    expect(getTierMeta('legendary', true)).toMatchObject({ label: 'Efsanevi', tone: 'gold' });
    expect(getTierMeta('supernova', false)).toMatchObject({ label: 'Supernova', tone: 'purple' });
  });
});
