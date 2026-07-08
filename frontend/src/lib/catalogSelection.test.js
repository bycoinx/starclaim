import { getFeaturedStars, getNearbyStars, getTierMeta } from './catalogSelection';

describe('catalogSelection helpers', () => {
  it('prioritizes legendary and brighter stars for featured picks', () => {
    const stars = [
      { starId: '1', tier: 'standard', magnitude: 4.2, price: 400, distance: 50 },
      { starId: '2', tier: 'legendary', magnitude: -1.4, price: 3200, distance: 8.6 },
      { starId: '3', tier: 'supernova', magnitude: 0.2, price: 1500, distance: 30 },
      { starId: '4', tier: 'nova', magnitude: 2.1, price: 900, distance: 120 },
    ];

    const featured = getFeaturedStars(stars, 3);

    expect(featured[0].starId).toBe('2');
    expect(featured.map((star) => star.starId)).toEqual(['2', '3', '4']);
  });

  it('returns nearby stars sorted by distance', () => {
    const stars = [
      { starId: 'a', distance: 40 },
      { starId: 'b', distance: 12 },
      { starId: 'c', distance: 2 },
      { starId: 'd', distance: 75 },
    ];

    const nearby = getNearbyStars(stars, 3);

    expect(nearby.map((star) => star.starId)).toEqual(['c', 'b', 'a']);
  });

  it('returns localized tier metadata', () => {
    expect(getTierMeta('legendary', true)).toMatchObject({ label: 'Efsanevi', tone: 'gold' });
    expect(getTierMeta('supernova', false)).toMatchObject({ label: 'Supernova', tone: 'purple' });
  });
});
