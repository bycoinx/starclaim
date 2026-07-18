export const HYG_WORKER_PROTOCOL_VERSION = 1;
export const HYG_WORKER_MESSAGE = Object.freeze({
  PARSE: "hyg/parse",
  RESULT: "hyg/result",
  ERROR: "hyg/error",
});
export const DEFAULT_HYG_LIMIT = 9000;
export const MAX_HYG_LIMIT = 120000;

export function normalizeHygLimit(limit = DEFAULT_HYG_LIMIT) {
  const numeric = Number(limit);
  if (!Number.isFinite(numeric)) return DEFAULT_HYG_LIMIT;
  return Math.max(1, Math.min(MAX_HYG_LIMIT, Math.floor(numeric)));
}

export function createHygParseRequest({ requestId, text, limit }) {
  return {
    version: HYG_WORKER_PROTOCOL_VERSION,
    type: HYG_WORKER_MESSAGE.PARSE,
    requestId,
    payload: { text, limit: normalizeHygLimit(limit) },
  };
}

export function isValidHygWorkerResponse(message, requestId) {
  return Boolean(
    message
    && message.version === HYG_WORKER_PROTOCOL_VERSION
    && message.requestId === requestId
    && [HYG_WORKER_MESSAGE.RESULT, HYG_WORKER_MESSAGE.ERROR].includes(message.type)
  );
}

export function createHygWorkerError(error, stage = "parse") {
  return {
    stage,
    name: error?.name || "Error",
    message: error?.message || String(error || "HYG worker error"),
  };
}
