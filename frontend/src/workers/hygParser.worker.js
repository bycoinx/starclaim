/* eslint-env worker */
/* global globalThis */
const SCALE = 0.01;

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
  return Math.max(0.5, (6.5 - m) * 0.4);
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
    if (isNaN(mag) || mag >= 6.5) continue;
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
    stars.push({
      id: row.id || row.hip || row.hyg || String(i),
      proper: row.proper || row.name || row.properName || '',
      ra: !isNaN(ra) ? ra : null,
      dec: !isNaN(dec) ? dec : null,
      dist: !isNaN(dist) ? dist : null,
      mag,
      ci: row.ci === '' ? null : parseFloat(row.ci),
      x,
      y,
      z,
      threeX: x * SCALE,
      threeY: z * SCALE,
      threeZ: -y * SCALE,
      color: bvToColor(row.ci),
      size: computeSize(mag),
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
