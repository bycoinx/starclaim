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

export function radiusForMag(mag) {
  if (mag < 1) return 5;
  if (mag < 2) return 4;
  if (mag < 3) return 3;
  if (mag < 4) return 2;
  return 1;
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
