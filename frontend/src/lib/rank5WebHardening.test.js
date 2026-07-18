import {
  buildMobileStarDeepLink,
  buildMobileVaultDeepLink,
  buildStarTarget,
} from "./StarLinks";
import { resolveApiBase } from "./api";

describe("Rank 5 web connection hardening", () => {
  test("hosted and custom domains force relative api rewrites", () => {
    expect(resolveApiBase({ hostname: "preview-starclaim.vercel.app", backendUrl: "https://bad.example/api" })).toBe("/api");
    expect(resolveApiBase({ hostname: "starclaimx.com", backendUrl: "https://bad.example/api" })).toBe("/api");
    expect(resolveApiBase({ hostname: "www.starclaimx.com", backendUrl: "https://bad.example/api" })).toBe("/api");
  });

  test("local development can use an explicit backend url", () => {
    expect(resolveApiBase({ hostname: "localhost", backendUrl: "http://127.0.0.1:8000/api" })).toBe("http://127.0.0.1:8000/api");
    expect(resolveApiBase({ hostname: "localhost", backendUrl: "" })).toBe("/api");
  });

  test("optional stars count endpoint failure returns null", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();
    vi.doMock("./api", () => ({
      api: { get: vi.fn().mockRejectedValueOnce(new Error("404")) },
    }));
    const { StarRegistry } = await import("./StarRegistry");
    await expect(StarRegistry.countStars({ limit: 10 })).resolves.toBeNull();
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("Stars count endpoint unavailable"),
      expect.any(Error),
    );
    warning.mockRestore();
    vi.doUnmock("./api");
  });

  test("deep link payload preserves StarTarget identity", () => {
    const star = {
      starId: "star-1",
      code: "SIRIUS-A",
      hip: 32349,
      hd: 48915,
      name: "Sirius",
      constellation: "Canis Major",
      ra: "06h 45m",
      dec: "-16d 43m",
    };

    expect(buildStarTarget(star)).toMatchObject({
      starId: "star-1",
      code: "SIRIUS-A",
      hip: 32349,
      hd: 48915,
      name: "Sirius",
    });
    expect(buildMobileStarDeepLink(star)).toBe("starcalimx://star/SIRIUS-A");
    expect(buildMobileVaultDeepLink(star)).toBe("starcalimx://vault/item/star-1");
  });
});
