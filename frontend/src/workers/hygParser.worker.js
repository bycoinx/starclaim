/* eslint-env worker */
/* global globalThis */
import { parseHygCsv } from "./hygParserCore";
import {
  HYG_WORKER_MESSAGE,
  HYG_WORKER_PROTOCOL_VERSION,
  createHygWorkerError,
} from "./hygWorkerProtocol";

globalThis.onmessage = (event) => {
  const message = event.data;
  if (
    message?.version !== HYG_WORKER_PROTOCOL_VERSION
    || message?.type !== HYG_WORKER_MESSAGE.PARSE
    || !message.requestId
  ) return;

  try {
    const result = parseHygCsv(message.payload?.text, message.payload?.limit);
    globalThis.postMessage({
      version: HYG_WORKER_PROTOCOL_VERSION,
      type: HYG_WORKER_MESSAGE.RESULT,
      requestId: message.requestId,
      payload: result,
    });
  } catch (error) {
    globalThis.postMessage({
      version: HYG_WORKER_PROTOCOL_VERSION,
      type: HYG_WORKER_MESSAGE.ERROR,
      requestId: message.requestId,
      error: createHygWorkerError(error),
    });
  }
};
