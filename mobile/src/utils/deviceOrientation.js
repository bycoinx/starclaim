import { normalizeAngle } from './astronomy';

export const SCREEN_ORIENTATION = Object.freeze({
  UNKNOWN: 0,
  PORTRAIT_UP: 1,
  PORTRAIT_DOWN: 2,
  LANDSCAPE_LEFT: 3,
  LANDSCAPE_RIGHT: 4,
});

export function getScreenHeadingOffset(orientation) {
  switch (orientation) {
    case SCREEN_ORIENTATION.PORTRAIT_DOWN:
      return 180;
    case SCREEN_ORIENTATION.LANDSCAPE_LEFT:
      return 90;
    case SCREEN_ORIENTATION.LANDSCAPE_RIGHT:
      return -90;
    default:
      return 0;
  }
}

export function adjustHeadingForScreen(rawHeading, orientation) {
  return normalizeAngle(rawHeading + getScreenHeadingOffset(orientation));
}

export function getScreenTilt(betaDegrees, gammaDegrees, orientation) {
  let tilt;
  switch (orientation) {
    case SCREEN_ORIENTATION.PORTRAIT_DOWN:
      tilt = -betaDegrees - 90;
      break;
    case SCREEN_ORIENTATION.LANDSCAPE_LEFT:
      tilt = gammaDegrees - 90;
      break;
    case SCREEN_ORIENTATION.LANDSCAPE_RIGHT:
      tilt = -gammaDegrees - 90;
      break;
    default:
      tilt = betaDegrees - 90;
  }
  return Math.max(-90, Math.min(90, tilt));
}
