export const NEBULA_BACKGROUND_SPEC = Object.freeze({
  opacity: 0.05,
  gradients: Object.freeze([
    Object.freeze({
      key: 'blue',
      radiusScale: 0.8,
      colors: Object.freeze(['rgba(30, 60, 120, 0.03)', 'rgba(10, 20, 40, 0.01)', 'rgba(0,0,0,0)']),
    }),
    Object.freeze({
      key: 'purple',
      radiusScale: 0.7,
      colors: Object.freeze(['rgba(60, 30, 80, 0.025)', 'rgba(20, 10, 30, 0.005)', 'rgba(0,0,0,0)']),
    }),
    Object.freeze({
      key: 'navy',
      radiusScale: 0.6,
      colors: Object.freeze(['rgba(10, 20, 60, 0.02)', 'rgba(5, 10, 20, 0.005)', 'rgba(0,0,0,0)']),
    }),
  ]),
});

export const MILKY_WAY_DENSITY_SPEC = Object.freeze({
  opacity: 0.12,
  qualityWidthScale: Object.freeze({
    low: 0.6,
    medium: 0.8,
    high: 1,
  }),
  bands: Object.freeze([
    Object.freeze({ color: '#1A1A2E', width: 80, opacity: 0.4 }),
    Object.freeze({ color: '#16213E', width: 60, opacity: 0.3 }),
    Object.freeze({ color: '#0F3460', width: 40, opacity: 0.2 }),
    Object.freeze({ color: '#533483', width: 120, opacity: 0.08 }),
    Object.freeze({ color: '#7209B7', width: 100, opacity: 0.05 }),
  ]),
});

export const DEEP_SPACE_ATMOSPHERE_SPEC = Object.freeze({
  gradients: Object.freeze([
    Object.freeze({
      key: 'blue-depth',
      opacity: 0.42,
      center: Object.freeze({ x: 0.18, y: 0.2 }),
      radiusScale: 0.78,
      colors: Object.freeze(['rgba(18,48,96,0.58)', 'rgba(5,11,28,0.12)', 'rgba(0,0,0,0)']),
    }),
    Object.freeze({
      key: 'violet-depth',
      opacity: 0.32,
      center: Object.freeze({ x: 0.82, y: 0.68 }),
      radiusScale: 0.68,
      colors: Object.freeze(['rgba(75,35,112,0.42)', 'rgba(9,14,38,0.1)', 'rgba(0,0,0,0)']),
    }),
  ]),
});

export const SKY_REFERENCE_VIEWPORTS = Object.freeze([
  Object.freeze({ id: 'compact-phone', width: 360, height: 740, pixelRatio: 3, qualityLevel: 'low' }),
  Object.freeze({ id: 'mid-phone', width: 390, height: 844, pixelRatio: 3, qualityLevel: 'medium' }),
  Object.freeze({ id: 'large-phone', width: 430, height: 932, pixelRatio: 3, qualityLevel: 'high' }),
]);

export function getMilkyWayWidthScale(qualityLevel) {
  return MILKY_WAY_DENSITY_SPEC.qualityWidthScale[qualityLevel]
    || MILKY_WAY_DENSITY_SPEC.qualityWidthScale.medium;
}
