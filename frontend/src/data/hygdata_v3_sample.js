import {
  WORLD_UNITS_PER_PARSEC,
  equatorialToCartesianParsec,
  getCanonicalStarCoordinates,
} from "../engine/celestialCoordinates";
import { bvToColor, computeSize } from "../workers/hygParserCore";
import { normalizeHygLimit } from "../workers/hygWorkerProtocol";
import { parseHygCsvWithWorker } from "../workers/hygWorkerClient";
import { webDiagnostics } from "../engine/diagnostics/webDiagnostics";

const HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/v3/hyg_v3.csv";
const MAX_HYG_CSV_BYTES = 64 * 1024 * 1024;

const FALLBACK = [
  { id: "SIRIUS", proper: "Sirius", ra: 101.2875, dec: -16.7161, dist: 2.637, mag: -1.46, ci: -0.03 },
  { id: "CANOPUS", proper: "Canopus", ra: 95.9879, dec: -52.6957, dist: 10.91, mag: -0.74, ci: 0.15 },
  { id: "VEGA", proper: "Vega", ra: 279.2347, dec: 38.7837, dist: 7.68, mag: 0.03, ci: 0 },
  { id: "ARCTURUS", proper: "Arcturus", ra: 213.9153, dec: 19.1824, dist: 11.26, mag: -0.05, ci: 1.23 },
];

function createAbortError(message = "HYG catalog load was aborted.") {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export function getFallbackHygStars() {
  return FALLBACK.map((star) => {
    const coordinates = getCanonicalStarCoordinates({
      raDegrees: star.ra,
      decDegrees: star.dec,
      distanceParsec: star.dist,
    });
    const { x, y, z } = equatorialToCartesianParsec(coordinates);
    return {
      ...star,
      raUnit: "degrees",
      ...coordinates,
      x,
      y,
      z,
      threeX: x * WORLD_UNITS_PER_PARSEC,
      threeY: y * WORLD_UNITS_PER_PARSEC,
      threeZ: z * WORLD_UNITS_PER_PARSEC,
      color: bvToColor(star.ci),
      size: computeSize(star.mag, star.ci, null),
      source: "embedded-fallback",
    };
  });
}

export async function loadHygStars({
  url = HYG_URL,
  limit = 120000,
  signal,
  fetchTimeoutMs = 20000,
  parseTimeoutMs = 30000,
  fetchImpl = typeof fetch === "function" ? fetch : null,
  workerFactory,
  onStatus,
} = {}) {
  const reportStatus = (status) => {
    webDiagnostics.recordCatalog(status, "hyg-worker");
    onStatus?.(status);
  };
  const controller = new AbortController();
  const handleExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", handleExternalAbort, { once: true });
  const fetchTimeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    if (signal?.aborted) throw createAbortError();
    if (!fetchImpl) throw new Error("Fetch is unavailable.");
    reportStatus({ stage: "fetching" });
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response?.ok) throw new Error(`HYG request failed with status ${response?.status || "unknown"}.`);
    const contentLength = Number(response.headers?.get?.("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_HYG_CSV_BYTES) {
      throw new Error("HYG response exceeds the maximum supported size.");
    }
    const text = await response.text();
    if (text.length > MAX_HYG_CSV_BYTES) throw new Error("HYG payload exceeds the maximum supported size.");
    clearTimeout(fetchTimeout);
    reportStatus({ stage: "parsing", bytes: text.length });
    const result = await parseHygCsvWithWorker(text, {
      limit: normalizeHygLimit(limit),
      signal: controller.signal,
      timeoutMs: parseTimeoutMs,
      workerFactory,
    });
    if (!result?.stars?.length) throw new Error("HYG worker produced an empty catalog.");
    reportStatus({ stage: "ready", source: "hyg", stats: result.stats, count: result.stars.length });
    return result.stars;
  } catch (error) {
    if (signal?.aborted) throw createAbortError();
    const stars = getFallbackHygStars();
    reportStatus({ stage: "fallback", source: "embedded", error, count: stars.length });
    return stars;
  } finally {
    clearTimeout(fetchTimeout);
    signal?.removeEventListener("abort", handleExternalAbort);
  }
}

export { parseHygCsvWithWorker };
export default loadHygStars;
