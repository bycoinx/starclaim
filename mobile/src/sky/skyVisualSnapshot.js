import { normalizeRaDelta } from '../utils/astronomy';
import {
  DEEP_SPACE_ATMOSPHERE_SPEC,
  MILKY_WAY_DENSITY_SPEC,
  NEBULA_BACKGROUND_SPEC,
  getMilkyWayWidthScale,
} from './skyVisualQuality';

function fixed(value) {
  return Number(value || 0).toFixed(2);
}

function projectStar(star, { width, height, virtualCenter, zoom }) {
  const raDegrees = Number.isFinite(star?.raDegrees) ? star.raDegrees : (Number(star?.ra || 0) * 15);
  const decDegrees = Number.isFinite(star?.decDegrees) ? star.decDegrees : Number(star?.dec || 0);
  const longitudeDiff = normalizeRaDelta(raDegrees - virtualCenter.ra);
  const latitudeDiff = decDegrees - virtualCenter.dec;
  const field = 90 / Math.max(0.1, zoom);
  const scale = width / field;
  const x = width / 2 + longitudeDiff * scale * Math.cos((virtualCenter.dec * Math.PI) / 180);
  const y = height / 2 - latitudeDiff * scale;
  return { x, y };
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildSkyVisualSnapshotSvg({
  id,
  renderPlan,
  viewport,
  virtualCenter,
  zoom,
  nightVision = false,
}) {
  const width = viewport.width;
  const height = viewport.height;
  const projection = { width, height, virtualCenter, zoom };
  const widthScale = getMilkyWayWidthScale(viewport.qualityLevel);
  const stars = [...(renderPlan.renderedStars || [])]
    .map((star) => ({ star, point: projectStar(star, projection) }))
    .filter(({ point }) => point.x >= -20 && point.x <= width + 20 && point.y >= -20 && point.y <= height + 20)
    .sort((a, b) => String(a.star.id).localeCompare(String(b.star.id)));

  const atmosphere = nightVision ? '' : DEEP_SPACE_ATMOSPHERE_SPEC.gradients.map((gradient, index) => (
    `<radialGradient id="${id}-deep-${index}" cx="${fixed(gradient.center.x * 100)}%" cy="${fixed(gradient.center.y * 100)}%" r="${fixed(gradient.radiusScale * 100)}%">`
    + `<stop offset="0%" stop-color="${escapeXml(gradient.colors[0])}" stop-opacity="${gradient.opacity}"/>`
    + `<stop offset="100%" stop-color="rgba(0,0,0,0)" stop-opacity="0"/>`
    + '</radialGradient>'
  )).join('');

  const nebula = NEBULA_BACKGROUND_SPEC.gradients.map((gradient, index) => (
    `<radialGradient id="${id}-nebula-${index}" cx="${fixed((25 + index * 25))}%" cy="${fixed(32 + index * 14)}%" r="${fixed(gradient.radiusScale * 100)}%">`
    + `<stop offset="0%" stop-color="${escapeXml(gradient.colors[0])}" stop-opacity="${NEBULA_BACKGROUND_SPEC.opacity}"/>`
    + '<stop offset="100%" stop-color="rgba(0,0,0,0)" stop-opacity="0"/>'
    + '</radialGradient>'
  )).join('');

  const defs = `<defs>${atmosphere}${nebula}</defs>`;
  const background = nightVision
    ? '<rect width="100%" height="100%" fill="#090101"/>'
    : '<rect width="100%" height="100%" fill="#02050d"/>';
  const deepLayers = nightVision ? '' : DEEP_SPACE_ATMOSPHERE_SPEC.gradients
    .map((_, index) => `<rect width="100%" height="100%" fill="url(#${id}-deep-${index})"/>`)
    .join('');
  const nebulaLayers = renderPlan.enabledLayers?.nebula
    ? NEBULA_BACKGROUND_SPEC.gradients
      .map((_, index) => `<rect width="100%" height="100%" fill="url(#${id}-nebula-${index})"/>`)
      .join('')
    : '';
  const milkyWayLayers = renderPlan.enabledLayers?.milkyWay
    ? MILKY_WAY_DENSITY_SPEC.bands
      .map((band, index) => (
        `<path d="M ${fixed(width * -0.1)} ${fixed(height * (0.68 - index * 0.025))} C ${fixed(width * 0.2)} ${fixed(height * 0.42)}, ${fixed(width * 0.68)} ${fixed(height * 0.78)}, ${fixed(width * 1.1)} ${fixed(height * 0.36)}" `
        + `fill="none" stroke="${band.color}" stroke-width="${fixed(band.width * widthScale)}" stroke-linecap="round" opacity="${band.opacity * MILKY_WAY_DENSITY_SPEC.opacity}"/>`
      ))
      .join('')
    : '';
  const starNodes = stars.map(({ star, point }) => (
    `<circle cx="${fixed(point.x)}" cy="${fixed(point.y)}" r="${fixed(Math.max(0.5, star.radius || 1))}" fill="${escapeXml(star.color || '#EAF0FF')}" opacity="0.92"/>`
  )).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(id)}">`,
    defs,
    background,
    deepLayers,
    nebulaLayers,
    milkyWayLayers,
    starNodes,
    '</svg>',
  ].join('');
}
