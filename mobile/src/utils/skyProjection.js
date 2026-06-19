const degreesToRadians = (degrees) => {
  'worklet';
  return degrees * Math.PI / 180;
};

export function normalizeSkyLongitudeDelta(delta) {
  'worklet';
  let value = Number(delta) || 0;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

export function equatorialToHorizontalPoint(raHours, decDegrees, latitudeDegrees, lstDegrees) {
  'worklet';
  const hourAngle = degreesToRadians(normalizeSkyLongitudeDelta(lstDegrees - raHours * 15));
  const declination = degreesToRadians(decDegrees);
  const latitude = degreesToRadians(latitudeDegrees);
  const sinAltitude = (
    Math.sin(declination) * Math.sin(latitude)
    + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle)
  );
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  let azimuth = Math.atan2(
    -Math.sin(hourAngle) * Math.cos(declination),
    Math.sin(declination) * Math.cos(latitude)
      - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle),
  ) * 180 / Math.PI;
  while (azimuth < 0) azimuth += 360;
  while (azimuth >= 360) azimuth -= 360;
  return { longitude: azimuth, latitude: altitude * 180 / Math.PI, skyAltitude: altitude * 180 / Math.PI };
}

export function projectSkyDegrees(longitude, latitude, centerLongitude, centerLatitude, width, height, zoom) {
  'worklet';
  const longitudeDiff = normalizeSkyLongitudeDelta(longitude - centerLongitude);
  const field = 90 / Math.max(0.1, zoom);
  const scale = width / field;
  return {
    x: width / 2 + longitudeDiff * scale * Math.cos(degreesToRadians(centerLatitude)),
    y: height / 2 - (latitude - centerLatitude) * scale,
  };
}

function projectAngularSegment(first, second, centerLongitude, centerLatitude, width, height, zoom) {
  'worklet';
  let firstDelta = normalizeSkyLongitudeDelta(first.longitude - centerLongitude);
  let secondDelta = firstDelta + normalizeSkyLongitudeDelta(second.longitude - first.longitude);
  const midpoint = (firstDelta + secondDelta) / 2;
  if (midpoint > 180) {
    firstDelta -= 360;
    secondDelta -= 360;
  } else if (midpoint < -180) {
    firstDelta += 360;
    secondDelta += 360;
  }
  const field = 90 / Math.max(0.1, zoom);
  const scale = width / field;
  const cosine = Math.cos(degreesToRadians(centerLatitude));
  return {
    p1: {
      x: width / 2 + firstDelta * scale * cosine,
      y: height / 2 - (first.latitude - centerLatitude) * scale,
      skyAltitude: first.skyAltitude,
    },
    p2: {
      x: width / 2 + secondDelta * scale * cosine,
      y: height / 2 - (second.latitude - centerLatitude) * scale,
      skyAltitude: second.skyAltitude,
    },
  };
}

export function projectSkySegment(
  first,
  second,
  centerLongitude,
  centerLatitude,
  width,
  height,
  zoom,
  coordinateMode = 'equatorial',
  observerLatitude = 0,
  lstDegrees = 0,
) {
  'worklet';
  const firstAngular = coordinateMode === 'horizontal'
    ? equatorialToHorizontalPoint(first.ra, first.dec, observerLatitude, lstDegrees)
    : { longitude: first.ra * 15, latitude: first.dec, skyAltitude: null };
  const secondAngular = coordinateMode === 'horizontal'
    ? equatorialToHorizontalPoint(second.ra, second.dec, observerLatitude, lstDegrees)
    : { longitude: second.ra * 15, latitude: second.dec, skyAltitude: null };
  return projectAngularSegment(
    firstAngular,
    secondAngular,
    centerLongitude,
    centerLatitude,
    width,
    height,
    zoom,
  );
}

export function segmentIntersectsViewport(p1, p2, width, height, padding = 0) {
  'worklet';
  if (![p1.x, p1.y, p2.x, p2.y].every(Number.isFinite)) return false;
  const left = -padding;
  const right = width + padding;
  const top = -padding;
  const bottom = height + padding;
  let t0 = 0;
  let t1 = 1;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const edges = [
    [-dx, p1.x - left],
    [dx, right - p1.x],
    [-dy, p1.y - top],
    [dy, bottom - p1.y],
  ];
  for (let index = 0; index < edges.length; index += 1) {
    const [direction, distance] = edges[index];
    if (direction === 0 && distance < 0) return false;
    if (direction === 0) continue;
    const ratio = distance / direction;
    if (direction < 0) t0 = Math.max(t0, ratio);
    else t1 = Math.min(t1, ratio);
    if (t0 > t1) return false;
  }
  return true;
}

export function isSkySegmentVisible(
  segment,
  width,
  height,
  padding,
  coordinateMode,
  minimumAltitude,
  requireBothAbove = false,
) {
  'worklet';
  if (coordinateMode === 'horizontal') {
    const firstAbove = segment.p1.skyAltitude >= minimumAltitude;
    const secondAbove = segment.p2.skyAltitude >= minimumAltitude;
    if (requireBothAbove ? !(firstAbove && secondAbove) : !(firstAbove || secondAbove)) return false;
  }
  return segmentIntersectsViewport(segment.p1, segment.p2, width, height, padding);
}
