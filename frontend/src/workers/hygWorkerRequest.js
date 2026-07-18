import {
  HYG_WORKER_MESSAGE,
  createHygParseRequest,
  isValidHygWorkerResponse,
} from "./hygWorkerProtocol";

let requestSequence = 0;

function createAbortError(message = "HYG parse was aborted.") {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export function requestHygWorkerParse(text, {
  limit,
  signal,
  timeoutMs = 30000,
  workerFactory,
} = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    if (typeof workerFactory !== "function") {
      reject(new Error("HYG worker factory is unavailable."));
      return;
    }

    const requestId = `hyg-${Date.now()}-${++requestSequence}`;
    let worker;
    let settled = false;
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
    };
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const handleAbort = () => settle(reject, createAbortError());

    try {
      worker = workerFactory();
      worker.onmessage = ({ data }) => {
        if (data?.requestId !== requestId) return;
        if (!isValidHygWorkerResponse(data, requestId)) {
          settle(reject, new Error("Invalid HYG worker response."));
        } else if (data.type === HYG_WORKER_MESSAGE.ERROR) {
          const error = new Error(data.error?.message || "HYG worker parse failed.");
          error.name = data.error?.name || "Error";
          settle(reject, error);
        } else {
          settle(resolve, data.payload);
        }
      };
      worker.onerror = (event) => {
        settle(reject, event.error || new Error(event.message || "HYG worker failed."));
      };
      worker.onmessageerror = () => settle(reject, new Error("HYG worker message could not be decoded."));
      signal?.addEventListener("abort", handleAbort, { once: true });
      timeoutId = setTimeout(() => {
        settle(reject, new Error(`HYG worker timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      worker.postMessage(createHygParseRequest({ requestId, text, limit }));
    } catch (error) {
      settle(reject, error);
    }
  });
}
