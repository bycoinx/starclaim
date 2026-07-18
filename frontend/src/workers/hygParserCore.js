import {
  CELESTIAL_EPOCH,
  CELESTIAL_FRAME,
  WORLD_UNITS_PER_PARSEC,
  equatorialToCartesianParsec,
  raHoursToDegrees,
} from "../engine/celestialCoordinates";
import { normalizeHygLimit } from "./hygWorkerProtocol";

export function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuote = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuote && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuote = !inQuote;
      }
    } else if (character === "," && !inQuote) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  if (inQuote) throw new Error("Unclosed quoted CSV field.");
  values.push(current);
  return values;
}

export function bvToColor(bv) {
  if (!Number.isFinite(Number(bv))) return "#ffffff";
  const value = Number(bv);
  if (value < -0.3) return "#9bb0ff";
  if (value < 0) return "#aabfff";
  if (value < 0.3) return "#cad7ff";
  if (value < 0.5) return "#f8f7ff";
  if (value < 0.8) return "#fff4ea";
  if (value < 1.2) return "#ffd2a1";
  if (value < 1.5) return "#ffcc6f";
  return "#ff6b35";
}

export function spectralClass(ci) {
  if (!Number.isFinite(Number(ci))) return "Unknown";
  const value = Number(ci);
  if (value < -0.3) return "O";
  if (value < 0) return "B";
  if (value < 0.3) return "A";
  if (value < 0.5) return "F";
  if (value < 0.8) return "G";
  if (value < 1.2) return "K";
  return "M";
}

function computeLuminosity(absoluteMagnitude) {
  const value = Number(absoluteMagnitude);
  return Number.isFinite(value) ? Math.pow(10, -0.4 * (value - 4.83)) : null;
}

export function computeSize(magnitude, ci, absoluteMagnitude) {
  const value = Number(magnitude);
  if (!Number.isFinite(value)) return 0.5;
  let size = Math.max(0.2, Math.pow(10, (6.5 - value) * 0.16));
  const luminosity = computeLuminosity(absoluteMagnitude);
  if (luminosity !== null) size *= Math.min(3.5, 1 + Math.pow(luminosity, 0.2));
  const colorIndex = Number(ci);
  if (Number.isFinite(colorIndex)) {
    if (colorIndex > 0.8) size *= 1.2;
    else if (colorIndex < -0.2) size *= 1.05;
  }
  return Math.max(0.22, Math.min(5.5, size));
}

function finiteOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseRow(row, rowIndex) {
  const magnitude = finiteOrNull(row.mag);
  if (magnitude === null) return null;
  const raHours = finiteOrNull(row.ra);
  const decDegrees = finiteOrNull(row.dec);
  const distanceParsec = finiteOrNull(row.dist);
  let position = null;
  if (raHours !== null && decDegrees !== null && distanceParsec !== null && distanceParsec > 0) {
    position = equatorialToCartesianParsec({ raHours, decDegrees, distanceParsec });
  }
  const x = position?.x ?? finiteOrNull(row.x);
  const y = position?.y ?? finiteOrNull(row.y);
  const z = position?.z ?? finiteOrNull(row.z);
  if ([x, y, z].some((value) => value === null)) return null;
  const ci = finiteOrNull(row.ci);
  const absoluteMagnitude = finiteOrNull(row.absmag);
  const id = String(row.id || row.hip || row.hyg || rowIndex).trim();
  if (!id) return null;

  return {
    id,
    proper: row.proper || row.name || row.properName || "",
    ra: raHours,
    raHours,
    raDegrees: raHours !== null ? raHoursToDegrees(raHours) : null,
    dec: decDegrees,
    decDegrees,
    dist: distanceParsec,
    distanceParsec,
    frame: CELESTIAL_FRAME,
    epoch: CELESTIAL_EPOCH,
    mag: magnitude,
    absmag: absoluteMagnitude,
    ci,
    spectralType: spectralClass(ci),
    properMotion: { ra: finiteOrNull(row.pmra), dec: finiteOrNull(row.pmdec) },
    x,
    y,
    z,
    threeX: x * WORLD_UNITS_PER_PARSEC,
    threeY: y * WORLD_UNITS_PER_PARSEC,
    threeZ: z * WORLD_UNITS_PER_PARSEC,
    color: bvToColor(ci),
    size: computeSize(magnitude, ci, absoluteMagnitude),
  };
}

export function parseHygCsv(text, limit) {
  if (typeof text !== "string" || !text.trim()) throw new Error("HYG CSV payload is empty.");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().replace(/^"|"$/g, ""));
  const hasMagnitude = headers.includes("mag");
  const hasSphericalPosition = ["ra", "dec", "dist"].every((header) => headers.includes(header));
  const hasCartesianPosition = ["x", "y", "z"].every((header) => headers.includes(header));
  if (!hasMagnitude || (!hasSphericalPosition && !hasCartesianPosition)) {
    throw new Error("HYG CSV is missing required headers.");
  }
  const normalizedLimit = normalizeHygLimit(limit);
  const stars = [];
  const seenIds = new Set();
  let skippedRows = 0;
  let duplicateRows = 0;

  for (let index = 1; index < lines.length && stars.length < normalizedLimit; index += 1) {
    try {
      const values = parseCsvLine(lines[index]);
      const row = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
      const star = parseRow(row, index);
      if (!star) {
        skippedRows += 1;
      } else if (seenIds.has(star.id)) {
        duplicateRows += 1;
      } else {
        seenIds.add(star.id);
        stars.push(star);
      }
    } catch {
      skippedRows += 1;
    }
  }

  return {
    stars,
    stats: {
      totalRows: Math.max(0, lines.length - 1),
      parsedRows: stars.length,
      skippedRows,
      duplicateRows,
      limit: normalizedLimit,
      truncated: stars.length >= normalizedLimit && lines.length - 1 > stars.length,
    },
  };
}
