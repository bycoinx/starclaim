import {
  altAzToRaDec,
  getLocalSiderealTime,
  getStarDecDegrees,
  getStarRaHours,
  normalizeAngle,
  raDecToAltAz,
} from '../utils/astronomy';
import { adjustHeadingForScreen, getScreenTilt } from '../utils/deviceOrientation';

export const SENSOR_SMOOTHING_ALPHA = 0.12;
export const SENSOR_RENDER_INTERVAL_MS = 80;
export const SENSOR_HUD_INTERVAL_MS = 1000;
export const SENSOR_VIEW_TILT_SCALE = 0.6;
export const SENSOR_HEADING_EPSILON = 0.6;
export const SENSOR_TILT_EPSILON = 0.45;
export const SENSOR_MAX_HEADING_DEGREES_PER_SECOND = 55;
export const SENSOR_MAX_TILT_DEGREES_PER_SECOND = 34;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createObserverFromLocation(position) {
  if (!position?.coords) return null;
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export function getSiderealTimeForObserver(observer, date = new Date()) {
  if (!observer) return 0;
  return getLocalSiderealTime(observer.longitude, date);
}

export function getHorizontalPositionForObject(object, observer, date = new Date()) {
  if (!object || !observer) return null;
  return raDecToAltAz(
    getStarRaHours(object),
    getStarDecDegrees(object),
    observer.latitude,
    getSiderealTimeForObserver(observer, date),
  );
}

export function getEquatorialViewportCenter({
  coordinateMode,
  observer,
  centerRa,
  centerDec,
  siderealTime,
}) {
  if (coordinateMode === 'horizontal' && observer) {
    return altAzToRaDec(centerRa, centerDec, observer.latitude, siderealTime);
  }
  return { raDegrees: centerRa, dec: centerDec };
}

export function smoothHeading(previousHeading, rawHeading, screenOrientation, alpha = SENSOR_SMOOTHING_ALPHA) {
  const adjustedHeading = adjustHeadingForScreen(rawHeading, screenOrientation);
  let diff = adjustedHeading - previousHeading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return normalizeAngle(previousHeading + diff * alpha);
}

export function smoothTilt(
  previousTilt,
  betaDegrees,
  gammaDegrees,
  screenOrientation,
  alpha = SENSOR_SMOOTHING_ALPHA,
) {
  const nextTilt = getScreenTilt(betaDegrees, gammaDegrees, screenOrientation);
  return previousTilt + (nextTilt - previousTilt) * alpha;
}

export function getSensorCanvasTarget(heading, tilt) {
  return {
    ra: normalizeAngle(heading),
    dec: clamp(tilt * SENSOR_VIEW_TILT_SCALE, -90, 90),
  };
}

export function limitSensorCanvasTarget(previousTarget, nextTarget, elapsedMs, {
  maxHeadingDegreesPerSecond = SENSOR_MAX_HEADING_DEGREES_PER_SECOND,
  maxTiltDegreesPerSecond = SENSOR_MAX_TILT_DEGREES_PER_SECOND,
} = {}) {
  if (!previousTarget || !nextTarget) return nextTarget;
  // Clamp elapsed time to prevent long GC/network stalls from producing huge camera jumps.
  const elapsedSeconds = clamp(elapsedMs / 1000, 0.016, 0.18);
  const maxHeadingStep = maxHeadingDegreesPerSecond * elapsedSeconds;
  const maxTiltStep = maxTiltDegreesPerSecond * elapsedSeconds;
  const headingDelta = normalizeAngle(nextTarget.ra - previousTarget.ra + 180) - 180;
  const tiltDelta = nextTarget.dec - previousTarget.dec;

  return {
    ra: normalizeAngle(previousTarget.ra + clamp(headingDelta, -maxHeadingStep, maxHeadingStep)),
    dec: clamp(previousTarget.dec + clamp(tiltDelta, -maxTiltStep, maxTiltStep), -90, 90),
  };
}

export function shouldCommitSensorView({
  previousTarget,
  nextTarget,
  lastCommitAt,
  nowMs,
  intervalMs = SENSOR_RENDER_INTERVAL_MS,
}) {
  if (!previousTarget) return true;
  if (nowMs - lastCommitAt < intervalMs) return false;

  const headingDelta = Math.abs(normalizeAngle(nextTarget.ra - previousTarget.ra + 180) - 180);
  const tiltDelta = Math.abs(nextTarget.dec - previousTarget.dec);

  return headingDelta >= SENSOR_HEADING_EPSILON || tiltDelta >= SENSOR_TILT_EPSILON;
}
