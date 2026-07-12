import {
  clampDeclinationDegrees,
  equatorialToCartesianParsec,
  getCanonicalStarCoordinates,
  normalizeDegreeDelta,
  normalizeDegrees,
  raDegreesToHours as canonicalRaDegreesToHours,
  raHoursToDegrees as canonicalRaHoursToDegrees,
  starToCartesianParsec,
} from '../engine/celestialCoordinates.js';

const deg2rad = (deg) => deg * Math.PI / 180;

export function raHoursToDegrees(hours) {
  return canonicalRaHoursToDegrees(hours);
}

export function raDegreesToHours(degrees) {
  return canonicalRaDegreesToHours(degrees);
}

export function clampDeclination(degrees) {
  return clampDeclinationDegrees(degrees);
}

export function getStarRaHours(star) {
  return getCanonicalStarCoordinates(star).raHours;
}

export function getStarRaDegrees(star) {
  return getCanonicalStarCoordinates(star).raDegrees;
}

export function getStarDecDegrees(star) {
  return getCanonicalStarCoordinates(star).decDegrees;
}

export function normalizeAngle(angle) {
  return normalizeDegrees(angle);
}

export function normalizeRaDelta(delta) {
  return normalizeDegreeDelta(delta);
}

export function projectRaDec(star, centerRa, centerDec, width, height, zoom) {
  const raDiff = normalizeRaDelta(getStarRaDegrees(star) - centerRa);
  const decDiff = getStarDecDegrees(star) - centerDec;
  const field = 90 / Math.max(0.8, zoom);
  const scale = width / field;
  const x = width / 2 + raDiff * scale * Math.cos(deg2rad(centerDec));
  const y = height / 2 - decDiff * scale;
  return { x, y };
}

export function radiusForMag(mag, spect) {
  const m = parseFloat(mag);
  if (Number.isNaN(m)) return 1;
  const brightness = Math.max(0, 6.7 - m);
  let radius = Math.min(3.4, Math.max(0.55, 0.55 + Math.pow(brightness, 0.72) * 0.55));
  const spectral = (spect || '').trim().toUpperCase();
  if (spectral.startsWith('O') || spectral.startsWith('B')) radius *= 1.05;
  if (spectral.startsWith('M')) radius *= 0.92;
  return Math.min(3.6, Math.max(0.5, radius));
}

export function colorForSpectrum(spect) {
  const type = (spect || '').trim().toUpperCase();
  if (type.startsWith('O')) return '#9DBBFF';
  if (type.startsWith('B')) return '#B9D3FF';
  if (type.startsWith('A')) return '#E8EEFF';
  if (type.startsWith('F')) return '#FFF7EA';
  if (type.startsWith('G')) return '#FFF0C2';
  if (type.startsWith('K')) return '#FFD09A';
  if (type.startsWith('M')) return '#FF9B82';
  return '#EAF0FF';
}

export function colorForStar(star) {
  const colorIndex = Number(star?.colorIndex ?? star?.bpRp);
  if (!Number.isFinite(colorIndex)) return colorForSpectrum(star?.spectralType ?? star?.spect);
  if (colorIndex < -0.2) return '#9DBBFF';
  if (colorIndex < 0.0) return '#B9D3FF';
  if (colorIndex < 0.3) return '#E8EEFF';
  if (colorIndex < 0.58) return '#FFF7EA';
  if (colorIndex < 0.9) return '#FFF0C2';
  if (colorIndex < 1.4) return '#FFD09A';
  return '#FF9B82';
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

export function altAzToRaDec(azDegrees, altDegrees, latitudeDegrees, lstDegrees) {
  const azimuth = deg2rad(normalizeAngle(azDegrees));
  const altitude = deg2rad(clampDeclination(altDegrees));
  const latitude = deg2rad(clampDeclination(latitudeDegrees));
  const sinDeclination = (
    Math.sin(altitude) * Math.sin(latitude)
    + Math.cos(altitude) * Math.cos(latitude) * Math.cos(azimuth)
  );
  const declination = Math.asin(Math.max(-1, Math.min(1, sinDeclination)));
  const hourAngle = Math.atan2(
    -Math.sin(azimuth) * Math.cos(altitude),
    Math.sin(altitude) * Math.cos(latitude)
      - Math.cos(altitude) * Math.sin(latitude) * Math.cos(azimuth),
  ) * 180 / Math.PI;
  const raDegrees = normalizeAngle(Number(lstDegrees || 0) - hourAngle);
  return { ra: raDegreesToHours(raDegrees), raDegrees, dec: declination * 180 / Math.PI };
}

export function getApproximateLST(longitudeDegrees = 0, date = new Date()) {
  return getLocalSiderealTime(longitudeDegrees, date);
}

export function getStarDistanceParsec(star) {
  return getCanonicalStarCoordinates(star).distanceParsec;
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
  return equatorialToCartesianParsec({ raHours, decDegrees, distanceParsec: distParsec });
}

/**
 * Gets 3D Cartesian coordinates for a star object.
 * @param {Object} star - Star record
 * @returns {{x: number, y: number, z: number}}
 */
export function getStarXYZ(star) {
  return starToCartesianParsec(star);
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
