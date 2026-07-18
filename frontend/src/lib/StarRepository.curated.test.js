import { afterEach, describe, expect, test, vi } from "vitest";

import { StarRegistry } from "./StarRegistry";
import { StarRepository, getBundledCuratedRelease } from "./StarRepository";


describe("curated web release", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    StarRepository.curatedCache = [];
    StarRepository.curatedLoadPromise = null;
  });

  test("contains the pilot and first eligible expansion batch without review holds", () => {
    const release = getBundledCuratedRelease();
    const starIds = new Set(release.stars.map((star) => star.canonical_id));
    const quoteIds = new Set(release.pricing.map((quote) => quote.canonical_id));

    expect(release.releaseId).toBe("pilot-v1+expansion-1-v1");
    expect(release.stars).toHaveLength(186);
    expect(release.pricing).toHaveLength(186);
    expect(starIds).toEqual(quoteIds);
    expect(release.stars.every((star) => star.curation.sellable)).toBe(true);
    expect(release.stars.some((star) => ["CVn", "Cae"].includes(star.constellation.iau_code))).toBe(false);
  });

  test("does not fall back to the 53-row commercial catalog when curated endpoints fail", async () => {
    vi.spyOn(StarRegistry, "fetchCuratedStars").mockRejectedValue(new Error("catalog unavailable"));
    vi.spyOn(StarRegistry, "fetchCuratedPricing").mockRejectedValue(new Error("pricing unavailable"));
    vi.spyOn(StarRegistry, "fetchStars").mockResolvedValue(Array.from({ length: 53 }, (_, index) => ({
      star_id: `legacy-${index}`,
    })));
    vi.spyOn(StarRegistry, "fetchMyStars").mockResolvedValue([]);

    const stars = await StarRepository.loadCuratedCatalog(true);

    expect(stars).toHaveLength(186);
    expect(stars.every((star) => star.canonicalId?.startsWith("hip:"))).toBe(true);
  });
});
