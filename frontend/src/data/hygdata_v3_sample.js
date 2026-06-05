// Minimal HYG v3 loader — no external CSV dependency to avoid package.json changes
// Exports: loadHygStars() -> Promise<stars[]>

const HYG_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/v3/hyg_v3.csv';
const SCALE = 0.01; // 1 parsec = 0.01 three units

async function parseHygCsvWithWorker(text, limit = 9000) {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(new URL('../workers/hygParser.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.stars || []);
        }
        worker.terminate();
      };
      worker.onerror = (err) => {
        reject(err.error || new Error('Worker parse failed'));
        worker.terminate();
      };
      worker.postMessage({ text, limit });
    } catch (err) {
      reject(err);
    }
  });
}

function bvToColor(bv) {
  if (bv === null || bv === undefined || isNaN(bv)) return '#ffffff';
  const v = parseFloat(bv);
  if (v < -0.3) return '#aaaaff';
  if (v < 0.0) return '#ffffff';
  if (v < 0.3) return '#ffffee';
  if (v < 0.6) return '#ffff88';
  if (v < 1.0) return '#ffcc44';
  return '#ff8844';
}

function computeSize(mag) {
  const m = parseFloat(mag);
  if (isNaN(m)) return 0.5;
  // Brighter stars (lower mag) are bigger, with exponential curve for realism
  return Math.max(0.2, Math.pow(10, (6.5 - m) * 0.15));
}

const FALLBACK = [
  // Minimal fallback near-sun sample (id, proper, ra, dec, dist, mag, ci, x,y,z)
  { id: 'SIRIUS', proper: 'Sirius', ra: 101.2875, dec: -16.7161, dist: 2.637, mag: -1.46, ci: -0.03, x: -1.612, y: -2.478, z: -0.295 },
  { id: 'CANOPUS', proper: 'Canopus', ra: 95.9879, dec: -52.6957, dist: 10.91, mag: -0.74, ci: 0.15, x: -2.0, y: -10.7, z: -4.5 },
  { id: 'VEGA', proper: 'Vega', ra: 279.2347, dec: 38.7837, dist: 7.68, mag: 0.03, ci: 0.00, x: 5.0, y: 2.0, z: 6.5 },
  { id: 'ARCTURUS', proper: 'Arcturus', ra: 213.9153, dec: 19.1824, dist: 11.26, mag: -0.05, ci: 1.23, x: -10.1, y: 3.2, z: -1.1 },
];

export async function loadHygStars({ url = HYG_URL, limit = 50000 } = {}) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const text = await res.text();
    const stars = await parseHygCsvWithWorker(text, limit);
    if (!stars || stars.length === 0) throw new Error('No stars parsed');
    return stars;
  } catch (err) {
    // fallback
    return FALLBACK.map(s => {
      const ra = s.ra;
      const dec = s.dec;
      const dist = s.dist;
      const raRad = ra * Math.PI / 180;
      const decRad = dec * Math.PI / 180;
      const x = dist * Math.cos(decRad) * Math.cos(raRad);
      const y = dist * Math.cos(decRad) * Math.sin(raRad);
      const z = dist * Math.sin(decRad);
      return {
        id: s.id,
        proper: s.proper,
        ra: s.ra,
        dec: s.dec,
        dist: s.dist,
        mag: s.mag,
        ci: s.ci,
        x,
        y,
        z,
        threeX: x * SCALE,
        threeY: z * SCALE,
        threeZ: -y * SCALE,
        color: bvToColor(s.ci),
        size: computeSize(s.mag),
      };
    });
  }
}

export default loadHygStars;
