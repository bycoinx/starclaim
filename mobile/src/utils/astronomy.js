const deg2rad = (deg) => deg * Math.PI / 180;

export function raHoursToDegrees(hours) {
  return normalizeAngle((Number(hours) || 0) * 15);
}

export function raDegreesToHours(degrees) {
  return normalizeAngle(Number(degrees) || 0) / 15;
}

export function clampDeclination(degrees) {
  return Math.max(-90, Math.min(90, Number(degrees) || 0));
}

export function getStarRaHours(star) {
  if (Number.isFinite(star?.raHours)) return star.raHours;
  if (Number.isFinite(star?.ra)) return star.ra;
  if (Number.isFinite(star?.raDegrees)) return raDegreesToHours(star.raDegrees);
  return 0;
}

export function getStarRaDegrees(star) {
  if (Number.isFinite(star?.raDegrees)) return normalizeAngle(star.raDegrees);
  return raHoursToDegrees(getStarRaHours(star));
}

export function getStarDecDegrees(star) {
  if (Number.isFinite(star?.decDegrees)) return clampDeclination(star.decDegrees);
  return clampDeclination(star?.dec);
}

export function normalizeAngle(angle) {
  let value = Number(angle) || 0;
  while (value < 0) value += 360;
  while (value >= 360) value -= 360;
  return value;
}

export function normalizeRaDelta(delta) {
  let value = Number(delta) || 0;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
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

export function getJulianDate(date = new Date()) {
  return date.getTime() / 86400000 + 2440587.5;
}

export function getGreenwichSiderealTime(date = new Date()) {
  const daysSinceJ2000 = getJulianDate(date) - 2451545;
  return normalizeAngle(280.46061837 + 360.98564736629 * daysSinceJ2000);
}

export function getLocalSiderealTime(longitudeDegrees, date = new Date()) {
  return normalizeAngle(getGreenwichSiderealTime(date) + Number(longitudeDegrees || 0));
}

export function raDecToAltAz(raHours, decDegrees, latitudeDegrees, lstDegrees) {
  const hourAngle = deg2rad(normalizeRaDelta(
    Number(lstDegrees || 0) - raHoursToDegrees(raHours),
  ));
  const declination = deg2rad(clampDeclination(decDegrees));
  const latitude = deg2rad(clampDeclination(latitudeDegrees));

  const sinAltitude = (
    Math.sin(declination) * Math.sin(latitude)
    + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle)
  );
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  const azimuth = Math.atan2(
    -Math.sin(hourAngle) * Math.cos(declination),
    Math.sin(declination) * Math.cos(latitude)
      - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle),
  );

  return {
    az: normalizeAngle(azimuth * 180 / Math.PI),
    alt: altitude * 180 / Math.PI,
  };
}

export function raDecToAzAlt(raHours, decDegrees, lstDegrees, latitudeDegrees = 0) {
  return raDecToAltAz(raHours, decDegrees, latitudeDegrees, lstDegrees);
}

export function getApproximateLST(longitudeDegrees = 0, date = new Date()) {
  return getLocalSiderealTime(longitudeDegrees, date);
}

export function getStarDistanceParsec(star) {
  if (Number.isFinite(star?.distanceParsec)) return star.distanceParsec;
  if (Number.isFinite(star?.dist)) return star.dist;
  if (Number.isFinite(star?.distance)) return star.distance;
  return 100; // Default distance if unknown
}

/**
 * Converts RA/Dec/Distance to Cartesian coordinates (Y-up for Three.js).
 * Formula:
 * x = d * cos(dec) * cos(ra)
 * y = d * sin(dec)
 * z = -d * cos(dec) * sin(ra)
 *
 * @param {number} raHours - RA in decimal hours
 * @param {number} decDegrees - Dec in decimal degrees
 * @param {number} distParsec - Distance in parsecs
 * @returns {{x: number, y: number, z: number}}
 */
export function raDecDistToXYZ(raHours, decDegrees, distParsec = 100) {
  const raRad = deg2rad(raHours * 15);
  const decRad = deg2rad(decDegrees);
  const cosDec = Math.cos(decRad);

  return {
    x: distParsec * cosDec * Math.cos(raRad),
    y: distParsec * Math.sin(decRad),
    z: -distParsec * cosDec * Math.sin(raRad),
  };
}

/**
 * Gets 3D Cartesian coordinates for a star object.
 * @param {Object} star - Star record
 * @returns {{x: number, y: number, z: number}}
 */
export function getStarXYZ(star) {
  const ra = getStarRaHours(star);
  const dec = getStarDecDegrees(star);
  const dist = getStarDistanceParsec(star);
  return raDecDistToXYZ(ra, dec, dist);
}

/**
 * Calculates Euclidean distance between two 3D points.
 */
export function getDistance3D(p1, p2) {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}
