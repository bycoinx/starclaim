import { requestHygWorkerParse } from "./hygWorkerRequest";

function createHygWorker() {
  return new Worker(new URL("./hygParser.worker.js", import.meta.url), { type: "module" });
}

export function parseHygCsvWithWorker(text, options = {}) {
  return requestHygWorkerParse(text, {
    ...options,
    workerFactory: options.workerFactory || createHygWorker,
  });
}
