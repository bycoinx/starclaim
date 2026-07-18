import { describe, expect, test } from "vitest";
import { buildCatalogCollections } from "./catalogCollections";

const stars = [
  { canonicalId: "hip:1", name: "A", constellation: "Ursa Major", iauCode: "UMa", asterisms: ["Big Dipper"], claimable: true },
  { canonicalId: "hip:2", name: "B", constellation: "Ursa Major", iauCode: "UMa", asterisms: ["Big Dipper"], isClaimed: true },
  { canonicalId: "hip:3", name: "C", constellation: "Lyra", iauCode: "Lyr", asterisms: ["Summer Triangle"], claimable: false },
];

describe("catalog collections", () => {
  test("separates viewer ownership from global claim state", () => {
    const result = buildCatalogCollections(stars, [{ canonicalId: "hip:1" }]);
    const uma = result.constellations.find((group) => group.iauCode === "UMa");
    expect(uma).toMatchObject({ total: 2, owned: 1, claimed: 1, available: 0, completionPercent: 50, isComplete: false });
  });

  test("builds descriptive asterism progress without duplicating products", () => {
    const result = buildCatalogCollections(stars, [{ canonicalId: "hip:1" }, { canonicalId: "hip:2" }]);
    const dipper = result.asterisms.find((group) => group.name === "Big Dipper");
    expect(dipper).toMatchObject({ total: 2, owned: 2, completionPercent: 100, isComplete: true });
    expect(new Set(dipper.stars.map((star) => star.canonicalId)).size).toBe(2);
  });
});
