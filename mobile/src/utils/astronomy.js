const deg2rad = (deg) => deg * Math.PI / 180;

export function normalizeAngle(angle) {
  let value = angle;
  while (value < 0) value += 360;
  while (value >= 360) value -= 360;
  return value;
}

export function normalizeRaDelta(delta) {
  let value = delta;
  if (value > 180) value -= 360;
  if (value < -180) value += 360;
  return value;
}

export function projectRaDec(star, centerRa, centerDec, width, height, zoom) {
  const raDiff = normalizeRaDelta(star.ra - centerRa);
  const decDiff = star.dec - centerDec;
  const field = 90 / Math.max(0.8, zoom);
  const scale = width / field;
  const x = width / 2 + raDiff * scale * Math.cos(deg2rad(centerDec));
  const y = height / 2 - decDiff * scale;
  return { x, y };
}

export function radiusForMag(mag, spect) {
  const m = parseFloat(mag);
  if (Number.isNaN(m)) return 2;
  const brightness = Math.max(0, 6.5 - m);
  let radius = Math.min(8, Math.max(1.2, 1.2 + Math.sqrt(brightness) * 1.6));
  const spectral = (spect || '').trim().toUpperCase();
  if (spectral.startsWith('O') || spectral.startsWith('B')) radius *= 1.1;
  if (spectral.startsWith('K')) radius *= 1.05;
  if (spectral.startsWith('M')) radius *= 0.9;
  return Math.min(9, Math.max(1.1, radius));
}

export function colorForSpectrum(spect) {
  const type = (spect || '').trim().toUpperCase();
  if (type.startsWith('O') || type.startsWith('B')) return '#D8E8FF';
  if (type.startsWith('A')) return '#FFFFFF';
  if (type.startsWith('F') || type.startsWith('G')) return '#FFF4CC';
  if (type.startsWith('K')) return '#FFCC88';
  if (type.startsWith('M')) return '#FF8A7C';
  return '#FFFFFF';
}
