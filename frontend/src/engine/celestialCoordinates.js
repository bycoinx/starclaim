export const CELESTIAL_FRAME = "ICRS";
export const CELESTIAL_EPOCH = "J2000.0";
export const PARSEC_TO_LIGHT_YEARS = 3.26156;
export const WORLD_UNITS_PER_PARSEC = 0.15;
export const DEFAULT_DISTANCE_PARSEC = 100;
export const DEFAULT_VIEW_ZOOM = 1.2;
export const DEFAULT_CAMERA_DISTANCE = 68;
export const MIN_CAMERA_DISTANCE = 10;
export const MAX_CAMERA_DISTANCE = 260;

const CAMERA_ZOOM_PRODUCT = DEFAULT_VIEW_ZOOM * DEFAULT_CAMERA_DISTANCE;
const degreesToRadians = (degrees) => degrees * Math.PI / 180;
const radiansToDegrees = (radians) => radians * 180 / Math.PI;

export function normalizeDegrees(degrees) {
  let value = Number(degrees) || 0;
  while (value < 0) value += 360;
  while (value >= 360) value -= 360;
  return value;
}

export function clampDeclinationDegrees(degrees) {
  return Math.max(-90, Math.min(90, Number(degrees) || 0));
}

export function raHoursToDegrees(hours) {
  return normalizeDegrees((Number(hours) || 0) * 15);
}

export function raDegreesToHours(degrees) {
  return normalizeDegrees(degrees) / 15;
}

export function parseRightAscensionHours(value) {
  if (typeof value === "number") return value;
  const parts = String(value ?? "").match(/(\d+(?:\.\d+)?)h?\s*(\d*(?:\.\d+)?)m?\s*(\d*(?:\.\d+)?)s?/i);
  if (!parts) return 0;
  return (parseFloat(parts[1]) || 0)
    + (parseFloat(parts[2]) || 0) / 60
    + (parseFloat(parts[3]) || 0) / 3600;
}

export function parseDeclinationDegrees(value) {
  if (typeof value === "number") return clampDeclinationDegrees(value);
  const source = String(value ?? "").trim();
  const sign = source.startsWith("-") ? -1 : 1;
  const values = source.match(/[+-]?\d+(?:\.\d+)?/g) || [];
  const degrees = Math.abs(parseFloat(values[0]) || 0);
  const minutes = parseFloat(values[1]) || 0;
  const seconds = parseFloat(values[2]) || 0;
  return clampDeclinationDegrees(sign * (degrees + minutes / 60 + seconds / 3600));
}

function resolveRaDegrees(star) {
  if (Number.isFinite(star?.raDegrees)) return normalizeDegrees(star.raDegrees);
  if (Number.isFinite(star?.raHours)) return raHoursToDegrees(star.raHours);
  if (typeof star?.ra === "string") return raHoursToDegrees(parseRightAscensionHours(star.ra));
  if (Number.isFinite(star?.ra)) {
    const unit = star.raUnit || star.coordinateUnit;
    if (["degrees", "degree", "deg"].includes(unit)) return normalizeDegrees(star.ra);
    if (["hours", "hour"].includes(unit)) return raHoursToDegrees(star.ra);
    return star.ra > 24 ? normalizeDegrees(star.ra) : raHoursToDegrees(star.ra);
  }
  return 0;
}

export function getCanonicalStarCoordinates(star, fallbackDistance = DEFAULT_DISTANCE_PARSEC) {
  const raDegrees = resolveRaDegrees(star);
  const decDegrees = parseDeclinationDegrees(star?.decDegrees ?? star?.dec);
  const rawDistance = star?.distanceParsec ?? star?.dist
    ?? (Number.isFinite(star?.distanceLy) ? star.distanceLy / PARSEC_TO_LIGHT_YEARS : star?.distance);
  const distanceParsec = Number.isFinite(Number(rawDistance)) && Number(rawDistance) > 0
    ? Number(rawDistance)
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
  const distance = Number.isFinite(distanceParsec) && distanceParsec > 0 ? distanceParsec : DEFAULT_DISTANCE_PARSEC;
  const raRadians = degreesToRadians(resolvedRa);
  const decRadians = degreesToRadians(resolvedDec);
  const cosDec = Math.cos(decRadians);
  const clean = (value) => Math.abs(value) < 1e-12 ? 0 : value;
  return {
    x: clean(distance * cosDec * Math.cos(raRadians)),
    y: clean(distance * Math.sin(decRadians)),
    z: clean(-distance * cosDec * Math.sin(raRadians)),
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

export function zoomToCameraDistance(zoom) {
  const safeZoom = Math.max(0.1, Number(zoom) || DEFAULT_VIEW_ZOOM);
  return Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, CAMERA_ZOOM_PRODUCT / safeZoom));
}

export function cameraDistanceToZoom(distance) {
  const safeDistance = Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, Number(distance) || DEFAULT_CAMERA_DISTANCE));
  return CAMERA_ZOOM_PRODUCT / safeDistance;
}
