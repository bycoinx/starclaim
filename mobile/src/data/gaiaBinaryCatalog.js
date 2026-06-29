import { createCanonicalStar } from './canonicalStar';

const HEADER_BYTES = 16;
const RECORD_BYTES = 40;
const MAGIC = 'SCB1';

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function readGaiaSourceId(view, offset) {
  const low = view.getUint32(offset, true);
  const high = view.getUint32(offset + 4, true);
  if (typeof BigInt === 'function') {
    return ((BigInt(high) << 32n) | BigInt(low)).toString();
  }
  return String(high * 4294967296 + low);
}

export function parseGaiaBinaryTile(buffer, names = {}) {
  const view = new DataView(buffer);
  if (view.byteLength < HEADER_BYTES) throw new Error('Gaia tile header is truncated');
  const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
  const version = view.getUint16(4, true);
  const recordBytes = view.getUint16(6, true);
  const count = view.getUint32(8, true);
  if (magic !== MAGIC || version !== 1 || recordBytes !== RECORD_BYTES) {
    throw new Error('Gaia tile format is unsupported');
  }
  if (view.byteLength !== HEADER_BYTES + count * recordBytes) {
    throw new Error('Gaia tile length does not match its header');
  }

  const stars = new Array(count);
  for (let index = 0; index < count; index += 1) {
    const offset = HEADER_BYTES + index * recordBytes;
    const gaiaSourceId = readGaiaSourceId(view, offset);
    const hip = view.getUint32(offset + 8, true);
    const hd = view.getUint32(offset + 12, true);
    const metadata = names[gaiaSourceId] || {};
    const raDegrees = view.getFloat32(offset + 16, true);
    const decDegrees = view.getFloat32(offset + 20, true);
    const parallaxMas = finiteOrNull(view.getFloat32(offset + 24, true));
    const magnitude = view.getFloat32(offset + 28, true);
    const colorIndex = finiteOrNull(view.getFloat32(offset + 32, true));
    const distanceParsec = finiteOrNull(view.getFloat32(offset + 36, true));
    stars[index] = createCanonicalStar({
      id: gaiaSourceId,
      gaiaSourceId,
      hip: hip || '',
      hd: hd || '',
      properName: metadata.properName || '',
      raDegrees,
      decDegrees,
      parallaxMas,
      distanceParsec,
      magnitude,
      colorIndex,
      spectralType: metadata.spectralType || '',
      constellation: metadata.constellation || '',
      epoch: 'J2016.0',
    }, {
      source: 'gaia-dr3',
      sourceId: gaiaSourceId,
      sourceCatalogVersion: 'Gaia DR3',
    });
  }
  return stars;
}

export function getVisibleGaiaSectorIds(centerRaDegrees, centerDecDegrees, horizontalFovDegrees, verticalFovDegrees) {
  const raCount = 24;
  const decCount = 18;
  const raRadius = Math.ceil(Math.max(0, horizontalFovDegrees) / 30) + 1;
  const decRadius = Math.ceil(Math.max(0, verticalFovDegrees) / 20) + 1;
  const centerRa = Math.floor((((centerRaDegrees % 360) + 360) % 360) / 15);
  const centerDec = Math.min(17, Math.max(0, Math.floor((centerDecDegrees + 90) / 10)));
  const ids = [];
  for (let raOffset = -raRadius; raOffset <= raRadius; raOffset += 1) {
    const raIndex = (centerRa + raOffset + raCount) % raCount;
    for (let decOffset = -decRadius; decOffset <= decRadius; decOffset += 1) {
      const decIndex = centerDec + decOffset;
      if (decIndex >= 0 && decIndex < decCount) ids.push(`r${raIndex}-d${decIndex}`);
    }
  }
  return [...new Set(ids)];
}
