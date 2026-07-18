import { requestHygWorkerParse } from "./hygWorkerRequest";
import { HYG_WORKER_MESSAGE, HYG_WORKER_PROTOCOL_VERSION } from "./hygWorkerProtocol";

class FakeWorker {
  constructor(respond) {
    this.respond = respond;
    this.terminated = false;
  }

  postMessage(message) {
    this.respond?.(this, message);
  }

  terminate() {
    this.terminated = true;
  }
}

describe("HYG worker client", () => {
  test("accepts only a correlated protocol result and terminates the worker", async () => {
    let worker;
    const result = await requestHygWorkerParse("csv", {
      workerFactory: () => {
        worker = new FakeWorker((instance, request) => {
          instance.onmessage({ data: {
            version: HYG_WORKER_PROTOCOL_VERSION,
            type: HYG_WORKER_MESSAGE.RESULT,
            requestId: request.requestId,
            payload: { stars: [{ id: "1" }], stats: { parsedRows: 1 } },
          } });
        });
        return worker;
      },
    });
    expect(result.stars).toEqual([{ id: "1" }]);
    expect(worker.terminated).toBe(true);
  });

  test("aborts an active worker and rejects with AbortError", async () => {
    const controller = new AbortController();
    let worker;
    const promise = requestHygWorkerParse("csv", {
      signal: controller.signal,
      workerFactory: () => {
        worker = new FakeWorker();
        return worker;
      },
    });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminated).toBe(true);
  });

  test("terminates a worker that exceeds the parse deadline", async () => {
    vi.useFakeTimers();
    let worker;
    const promise = requestHygWorkerParse("csv", {
      timeoutMs: 25,
      workerFactory: () => {
        worker = new FakeWorker();
        return worker;
      },
    });
    vi.advanceTimersByTime(25);
    await expect(promise).rejects.toThrow("timed out after 25ms");
    expect(worker.terminated).toBe(true);
    vi.useRealTimers();
  });
});
