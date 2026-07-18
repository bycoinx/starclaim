const { test, expect } = require("@playwright/test");

const STAR_FIXTURE = {
  star_id: "e2e-sirius",
  code: "SIRIUS-E2E",
  name: "Sirius",
  constellation: "Canis Major",
  tier: "legendary",
  price: 2999,
  spect: "A1V",
  distance: 8.6,
  magnitude: -1.46,
  ra: 101.2875,
  dec: -16.7161,
  claimed: false,
};

const READY_STATES = ["running", "low-quality", "safe-2d"];
const QUALITY_PROFILES = ["low", "medium", "high"];

async function mockCatalogApi(page) {
  await page.route("**/api/stars**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/count")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 1 }) });
    }
    if (pathname.endsWith("/constellations")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(["Canis Major"]) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([STAR_FIXTURE]) });
  });
}

async function waitForCosmosReady(page) {
  const engine = page.getByTestId("cosmos-engine");
  await expect(engine).toBeVisible();
  await expect.poll(async () => READY_STATES.includes(
    await engine.getAttribute("data-renderer-state")
  ), {
    message: "Cosmos renderer should leave initialization and recovery states",
    timeout: 20_000,
  }).toBe(true);
  const state = await engine.getAttribute("data-renderer-state");
  await expect.poll(async () => QUALITY_PROFILES.includes(
    await engine.getAttribute("data-quality-profile")
  ), {
    message: "Cosmos should publish a central performance profile",
  }).toBe(true);
  return { engine, state };
}

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page);
});

test("catalog selection survives Stars to Cosmos and back navigation", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/stars");
  const siriusCard = page.locator('[data-testid="catalog-star-card"][data-star-id="e2e-sirius"]');
  await expect(siriusCard).toBeVisible();
  await siriusCard.click();
  await page.getByTestId("open-cosmos").click();

  await expect(page).toHaveURL(/\/cosmos$/);
  await waitForCosmosReady(page);
  await expect(page.getByTestId("cosmos-selection")).toContainText("Sirius");
  await expect(page.locator('main[data-testid="cosmos-engine"] canvas')).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/stars$/);
  await expect(siriusCard).toBeVisible();
  await page.getByTestId("open-cosmos").click();
  await waitForCosmosReady(page);
  await expect(page.getByTestId("cosmos-selection")).toContainText("Sirius");
  const unexpectedErrors = pageErrors.filter(
    (message) => message !== "Error creating WebGL context."
  );
  expect(unexpectedErrors).toEqual([]);
});

test("Cosmos meets renderer-ready and JavaScript transfer budgets", async ({ page }) => {
  const startedAt = Date.now();
  await page.goto("/cosmos");
  await waitForCosmosReady(page);
  const readyMs = Date.now() - startedAt;

  const metrics = await page.evaluate(() => {
    const scripts = performance.getEntriesByType("resource")
      .filter((entry) => new URL(entry.name).pathname.endsWith(".js"));
    return {
      scriptCount: scripts.length,
      javascriptBytes: scripts.reduce(
        (total, entry) => total + (entry.transferSize || entry.encodedBodySize || 0),
        0
      ),
    };
  });

  expect(readyMs).toBeLessThan(20_000);
  expect(metrics.scriptCount).toBeGreaterThan(0);
  expect(metrics.javascriptBytes).toBeLessThan(1_500_000);
  await expect(page.locator('main[data-testid="cosmos-engine"] canvas')).toHaveCount(1);
});
