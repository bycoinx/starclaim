import { resolveCosmosCameraTarget } from "./Cosmos";

describe("Cosmos runtime bridge", () => {
  test("preserves an existing canonical renderer position", () => {
    expect(resolveCosmosCameraTarget({ x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2, z: 3 });
  });

  test("derives a shared world target from catalog coordinates", () => {
    const target = resolveCosmosCameraTarget({
      raDegrees: 0,
      decDegrees: 0,
      distanceParsec: 10,
    });
    expect(target).toEqual({ x: 1.5, y: 0, z: 0 });
  });

  test("keeps the neutral camera when no star is selected", () => {
    expect(resolveCosmosCameraTarget(null)).toBeNull();
  });
});
