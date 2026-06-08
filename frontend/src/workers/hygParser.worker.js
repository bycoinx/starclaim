/* eslint-env worker */
/* global globalThis */
const SCALE = 0.02;

function bvToColor(bv) {
  if (bv === null || bv === undefined || isNaN(bv)) return '#ffffff';
  const v = parseFloat(bv);
  
  // Spectral type colors (O, B, A, F, G, K, M)
  // B-V color index mapping to realistic star colors
  if (v < -0.3) return '#9bb0ff'; // O-type: blue
  if (v < 0.0) return '#aabfff'; // B-type: blue-white
  if (v < 0.3) return '#cad7ff'; // A-type: white
  if (v < 0.5) return '#f8f7ff'; // F-type: white-yellow
  if (v < 0.8) return '#fff4ea'; // G-type: yellow (like Sun)
  if (v < 1.2) return '#ffd2a1'; // K-type: orange
  if (v < 1.5) return '#ffcc6f'; // M-type: red
  return '#ff6b35'; // Very red stars
}

function spectralClass(ci) {
  if (ci === null || ci === undefined || isNaN(ci)) return 'Unknown';
  const v = parseFloat(ci);
  if (v < -0.3) return 'O';
  if (v < 0.0) return 'B';
  if (v < 0.3) return 'A';
  if (v < 0.5) return 'F';
  if (v < 0.8) return 'G';
  if (v < 1.2) return 'K';
  return 'M';
}

function computeLuminosity(absmag) {
  const M = parseFloat(absmag);
  if (isNaN(M)) return null;
  // Sun absolute magnitude ~4.83
  return Math.pow(10, -0.4 * (M - 4.83));
}

function computeSize(mag, ci, absmag) {
  const m = parseFloat(mag);
  if (isNaN(m)) return 0.5;
  const brightFactor = Math.max(0.2, Math.pow(10, (6.5 - m) * 0.16));
  let baseSize = brightFactor;
  const lum = computeLuminosity(absmag);
  if (lum !== null) {
    baseSize *= Math.min(3.5, 1.0 + Math.pow(lum, 0.2));
  }
  if (ci !== null && ci !== undefined && !isNaN(ci)) {
    const colorIndex = parseFloat(ci);
    if (colorIndex > 0.8) {
      baseSize *= 1.2;
    } else if (colorIndex < -0.2) {
      baseSize *= 1.05;
    }
  }
  return Math.max(0.22, Math.min(5.5, baseSize));
}

function toCartesian(ra, dec, dist) {
  const raRad = ra * Math.PI / 180;
  const decRad = dec * Math.PI / 180;
  const x = dist * Math.cos(decRad) * Math.cos(raRad);
  const y = dist * Math.cos(decRad) * Math.sin(raRad);
  const z = dist * Math.sin(decRad);
  return { x, y, z };
}

function parseCSV(text, limit = 9000) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1);
  const stars = [];
  for (let i = 0; i < rows.length && stars.length < limit; i++) {
    const line = rows[i];
    const vals = [];
    let cur = '';
    let inQuote = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { vals.push(cur); cur = ''; continue; }
      cur += ch;
    }
    vals.push(cur);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[j] === undefined ? '' : vals[j];
    }
    const mag = parseFloat(row.mag);
    // Removed strict magnitude filter to allow loading up to the requested limit (e.g. 120k)
    // if (isNaN(mag) || mag >= 6.5) continue; 
    if (isNaN(mag)) continue;
    const ra = parseFloat(row.ra);
    const dec = parseFloat(row.dec);
    const dist = parseFloat(row.dist);
    let pos = null;
    if (!isNaN(ra) && !isNaN(dec) && !isNaN(dist)) {
      pos = toCartesian(ra, dec, dist);
    }
    let x = pos?.x ?? parseFloat(row.x);
    let y = pos?.y ?? parseFloat(row.y);
    let z = pos?.z ?? parseFloat(row.z);
    if ([x, y, z].some(v => isNaN(v))) continue;
    const absmag = parseFloat(row.absmag);
    const pmra = parseFloat(row.pmra);
    const pmdec = parseFloat(row.pmdec);
    stars.push({
      id: row.id || row.hip || row.hyg || String(i),
      proper: row.proper || row.name || row.properName || '',
      ra: !isNaN(ra) ? ra : null,
      dec: !isNaN(dec) ? dec : null,
      dist: !isNaN(dist) ? dist : null,
      mag,
      absmag: !isNaN(absmag) ? absmag : null,
      ci: row.ci === '' ? null : parseFloat(row.ci),
      spectralType: spectralClass(row.ci),
      properMotion: {
        ra: !isNaN(pmra) ? pmra : null,
        dec: !isNaN(pmdec) ? pmdec : null,
      },
      x,
      y,
      z,
      threeX: x * SCALE,
      threeY: z * SCALE,
      threeZ: -y * SCALE,
      color: bvToColor(row.ci),
      size: computeSize(mag, row.ci, row.absmag),
    });
  }
  return stars;
}

globalThis.onmessage = (event) => {
  const { text, limit } = event.data || {};
  try {
    const stars = parseCSV(text, limit || 9000);
    globalThis.postMessage({ stars });
  } catch (error) {
    globalThis.postMessage({ error: error.message || 'Parser error' });
  }
};
