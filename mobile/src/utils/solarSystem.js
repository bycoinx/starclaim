/**
 * Güneş Sistemi nesnelerinin (Gezegenler ve Ay) anlık konumlarını hesaplayan yardımcı fonksiyonlar.
 * Keplerian Elements kullanılarak heliosentrik XYZ ve yaklaşık RA/Dec koordinatları üretilir.
 */

const deg2rad = (deg) => deg * Math.PI / 180;
const rad2deg = (rad) => rad * 180 / Math.PI;

function normalize(v) {
  let val = v % 360;
  if (val < 0) val += 360;
  return val;
}

// J2000 epoch değerleri (Keplerian Elements)
const PLANETS = {
  mercury: { N: 48.33, i: 7.00, w: 29.12, a: 0.387, e: 0.2056, M0: 174.79, dM: 4.0923 },
  venus:   { N: 76.68, i: 3.39, w: 54.89, a: 0.723, e: 0.0067, M0: 50.11,  dM: 1.6021 },
  mars:    { N: 49.56, i: 1.85, w: 286.5, a: 1.523, e: 0.0934, M0: 19.39,  dM: 0.5240 },
  jupiter: { N: 100.4, i: 1.30, w: 273.8, a: 5.202, e: 0.0484, M0: 20.02,  dM: 0.0830 },
  saturn:  { N: 113.6, i: 2.49, w: 339.3, a: 9.537, e: 0.0541, M0: 317.0,  dM: 0.0334 },
};

/**
 * Verilen tarih için gezegenlerin heliosentrik XYZ (AU) ve RA/Dec koordinatlarını döner.
 */
export function getPlanetPositions(date = new Date()) {
  const d = (date - new Date('2000-01-01T12:00:00Z')) / (1000 * 60 * 60 * 24);

  return Object.keys(PLANETS).map(name => {
    const p = PLANETS[name];
    const M = normalize(p.M0 + p.dM * d);
    const E = solveKepler(M, p.e);

    // Orbital plane coordinates
    const xv = p.a * (Math.cos(deg2rad(E)) - p.e);
    const yv = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(deg2rad(E));

    const v = rad2deg(Math.atan2(yv, xv));
    const r = Math.sqrt(xv * xv + yv * yv);

    // Convert to Heliocentric XYZ (Ecliptic)
    const cosN = Math.cos(deg2rad(p.N));
    const sinN = Math.sin(deg2rad(p.N));
    const cosVW = Math.cos(deg2rad(v + p.w));
    const sinVW = Math.sin(deg2rad(v + p.w));
    const cosi = Math.cos(deg2rad(p.i));
    const sini = Math.sin(deg2rad(p.i));

    const x = r * (cosN * cosVW - sinN * sinVW * cosi);
    const y = r * (sinN * cosVW + cosN * sinVW * cosi);
    const z = r * (sinVW * sini);

    // Simple RA/Dec for 2D map (approximate)
    const lon = rad2deg(Math.atan2(y, x));
    const ra = normalize(lon) / 15;
    const dec = rad2deg(Math.asin(z / r));

    return {
      id: `planet-${name}`,
      name: name.toUpperCase(),
      x, y, z, // In AU
      ra,
      dec,
      distanceAU: r,
      type: 'planet',
      color: getPlanetColor(name)
    };
  });
}

function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 10; i++) { // More iterations for accuracy
    E = E - (E - rad2deg(e * Math.sin(deg2rad(E))) - M) / (1 - e * Math.cos(deg2rad(E)));
  }
  return E;
}

function getPlanetColor(name) {
  const colors = {
    mercury: '#A5A5A5',
    venus: '#E3BB76',
    mars: '#E27B58',
    jupiter: '#D39C7E',
    saturn: '#C5AB6E'
  };
  return colors[name] || '#FFFFFF';
}
