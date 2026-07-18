jest.mock("../workers/hygWorkerClient", () => ({
  parseHygCsvWithWorker: jest.fn(),
}));

const { getFallbackHygStars, loadHygStars } = require("./hygdata_v3_sample");

describe("HYG catalog loader", () => {
  test("returns canonical embedded stars and reports fallback status", async () => {
    const onStatus = jest.fn();
    const stars = await loadHygStars({
      fetchImpl: jest.fn().mockRejectedValue(new Error("offline")),
      onStatus,
    });
    expect(stars).toHaveLength(4);
    expect(stars[0]).toEqual(expect.objectContaining({
      frame: "ICRS",
      epoch: "J2000.0",
      source: "embedded-fallback",
      threeX: expect.any(Number),
    }));
    expect(onStatus).toHaveBeenLastCalledWith(expect.objectContaining({ stage: "fallback" }));
    expect(getFallbackHygStars()).not.toBe(getFallbackHygStars());
  });

  test("propagates caller cancellation instead of disguising it as fallback", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(loadHygStars({ signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
  });
});
