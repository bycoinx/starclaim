import { StarRegistry } from "./StarRegistry";
import { StarRepository } from "./StarRepository";

describe("StarRepository pipeline", () => {
  beforeEach(() => {
    StarRepository.cache = [];
    StarRepository.initialized = false;
    StarRepository.loadPromise = null;
  });

  afterEach(() => vi.restoreAllMocks());

  test("deduplicates concurrent full catalog loads", async () => {
    let resolveFetch;
    const fetchStars = vi.spyOn(StarRegistry, "fetchStars").mockImplementation(() => (
      new Promise((resolve) => { resolveFetch = resolve; })
    ));
    const first = StarRepository.loadAll(true);
    const second = StarRepository.loadAll(true);
    expect(fetchStars).toHaveBeenCalledTimes(1);
    resolveFetch([{ star_id: "sirius", code: "SIRIUS", name: "Sirius", magnitude: -1.46 }]);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual(secondResult);
    expect(firstResult).toHaveLength(1);
    expect(StarRepository.loadPromise).toBeNull();
  });

  test("removes duplicate normalized identities without mutating input", () => {
    const raw = [
      { star_id: "same", code: "A", name: "First" },
      { star_id: "same", code: "B", name: "Duplicate" },
      { star_id: "unique", code: "C", name: "Unique" },
    ];
    const normalized = StarRepository.normalize(raw);
    expect(normalized.map((star) => star.starId)).toEqual(["same", "unique"]);
    expect(raw).toHaveLength(3);
  });
});
