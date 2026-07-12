export const CELESTIAL_FRAME = 'ICRS';
export const CELESTIAL_EPOCH = 'J2000.0';
export const PARSEC_TO_LIGHT_YEARS = 3.26156;
export const WORLD_UNITS_PER_PARSEC = 0.15;
export const DEFAULT_DISTANCE_PARSEC = 100;
export const DEFAULT_VIEW_ZOOM = 1.2;
export const DEFAULT_CAMERA_DISTANCE = 68;
export const MIN_CAMERA_DISTANCE = 10;
export const MAX_CAMERA_DISTANCE = 260;

const CAMERA_ZOOM_PRODUCT = DEFAULT_VIEW_ZOOM * DEFAULT_CAMERA_DISTANCE;
function degreesToRadians(degrees) {
  'worklet';
  return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

export function normalizeDegrees(degrees) {
  'worklet';
  let value = Number(degrees) || 0;
  while (value < 0) value += 360;
  while (value >= 360) value -= 360;
  return value;
}

export function normalizeDegreeDelta(degrees) {
  'worklet';
  let value = Number(degrees) || 0;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

export function clampDeclinationDegrees(degrees) {
  'worklet';
  return Math.max(-90, Math.min(90, Number(degrees) || 0));
}

export function raHoursToDegrees(hours) {
  'worklet';
  return normalizeDegrees((Number(hours) || 0) * 15);
}

export function raDegreesToHours(degrees) {
  'worklet';
  return normalizeDegrees(degrees) / 15;
}

export function getCanonicalStarCoordinates(star, fallbackDistance = DEFAULT_DISTANCE_PARSEC) {
  const raDegrees = Number.isFinite(star?.raDegrees)
    ? normalizeDegrees(star.raDegrees)
    : raHoursToDegrees(star?.raHours ?? star?.ra);
  const decDegrees = clampDeclinationDegrees(star?.decDegrees ?? star?.dec);
  const rawDistance = star?.distanceParsec ?? star?.dist ?? star?.distance;
  const distanceParsec = Number.isFinite(rawDistance) && rawDistance > 0
    ? rawDistance
    : fallbackDistance;
  return {
    frame: CELESTIAL_FRAME,
    epoch: CELESTIAL_EPOCH,
    raHours: raDegreesToHours(raDegrees),
    raDegrees,
    decDegrees,
    distanceParsec,
  };
}

export function equatorialToCartesianParsec({ raHours, raDegrees, decDegrees, distanceParsec }) {
  const resolvedRa = Number.isFinite(raDegrees) ? normalizeDegrees(raDegrees) : raHoursToDegrees(raHours);
  const resolvedDec = clampDeclinationDegrees(decDegrees);
  const distance = Number.isFinite(distanceParsec) && distanceParsec > 0
    ? distanceParsec
    : DEFAULT_DISTANCE_PARSEC;
  const raRadians = degreesToRadians(resolvedRa);
  const decRadians = degreesToRadians(resolvedDec);
  const cosDec = Math.cos(decRadians);
  const x = distance * cosDec * Math.cos(raRadians);
  const y = distance * Math.sin(decRadians);
  const z = -distance * cosDec * Math.sin(raRadians);
  return {
    x: Math.abs(x) < 1e-12 ? 0 : x,
    y: Math.abs(y) < 1e-12 ? 0 : y,
    z: Math.abs(z) < 1e-12 ? 0 : z,
  };
}

export function cartesianParsecToEquatorial({ x, y, z }) {
  const distanceParsec = Math.hypot(x, y, z);
  if (!distanceParsec) return { raHours: 0, raDegrees: 0, decDegrees: 0, distanceParsec: 0 };
  const raDegrees = normalizeDegrees(radiansToDegrees(Math.atan2(-z, x)));
  return {
    raHours: raDegreesToHours(raDegrees),
    raDegrees,
    decDegrees: radiansToDegrees(Math.asin(y / distanceParsec)),
    distanceParsec,
  };
}

export function starToCartesianParsec(star) {
  return equatorialToCartesianParsec(getCanonicalStarCoordinates(star));
}

export function starToWorldCartesian(star, scale = WORLD_UNITS_PER_PARSEC) {
  const position = starToCartesianParsec(star);
  return { x: position.x * scale, y: position.y * scale, z: position.z * scale };
}

export function projectEquatorialToScreen({
  raHours,
  raDegrees,
  decDegrees,
  centerRaDegrees,
  centerDecDegrees,
  width,
  height,
  zoom,
}) {
  'worklet';
  const longitude = Number.isFinite(raDegrees) ? raDegrees : raHoursToDegrees(raHours);
  const raDelta = normalizeDegreeDelta(longitude - centerRaDegrees);
  const decDelta = clampDeclinationDegrees(decDegrees) - centerDecDegrees;
  const fieldDegrees = 90 / Math.max(0.1, zoom);
  const scale = width / fieldDegrees;
  return {
    x: width / 2 + raDelta * scale * Math.cos(degreesToRadians(centerDecDegrees)),
    y: height / 2 - decDelta * scale,
    fieldDegrees,
  };
}

export function zoomToCameraDistance(zoom) {
  const safeZoom = Math.max(0.1, Number(zoom) || DEFAULT_VIEW_ZOOM);
  return Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, CAMERA_ZOOM_PRODUCT / safeZoom));
}

export function cameraDistanceToZoom(distance) {
  const safeDistance = Math.max(
    MIN_CAMERA_DISTANCE,
    Math.min(MAX_CAMERA_DISTANCE, Number(distance) || DEFAULT_CAMERA_DISTANCE)
  );
  return CAMERA_ZOOM_PRODUCT / safeDistance;
}
