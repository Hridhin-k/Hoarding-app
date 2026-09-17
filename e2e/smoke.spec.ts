import { expect, test } from "@playwright/test";

test("public marketplace and marketing pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /operating system for outdoor advertising/i })).toBeVisible();
  await page.goto("/market");
  await expect(page.getByRole("heading", { name: /find a face/i })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("field, manage, and platform require authentication", async ({ page }) => {
  await page.goto("/field");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/manage");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/platform");
  await expect(page).toHaveURL(/\/login/);
});

test("marketplace board detail does not expose floor rate copy", async ({ page }) => {
  await page.goto("/market");
  const firstBoard = page.locator('main a[href^="/market/"]').first();
  if (await firstBoard.count()) {
    await firstBoard.click();
    await expect(page.getByText(/floor rate/i)).toHaveCount(0);
    await expect(page.getByText(/tenant_id/i)).toHaveCount(0);
  }
});

test("public and gated API routes respond correctly", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  const healthBody = (await health.json()) as { ok: boolean; envConfigured: boolean };
  expect(healthBody.ok).toBe(true);
  expect(healthBody.envConfigured).toBe(true);

  const cron = await request.get("/api/cron/operations");
  expect(cron.status()).toBe(401);

  const geocode = await request.get("/api/geocode?q=Kochi");
  expect(geocode.status()).toBe(401);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("/market");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("/market");
});

test("signed-in owner can geocode and reverse-geocode", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.locator("#email").fill("owner@horizonoutdoor.com");
  await page.locator("#password").fill("Password123!");
  await expect(page.locator("#email")).toHaveValue("owner@horizonoutdoor.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(manage|onboarding|platform)/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/manage/);

  const search = await page.request.get("/api/geocode?q=Edappally");
  expect(search.ok()).toBeTruthy();
  const results = (await search.json()) as Array<{ label?: string; lat?: number }>;
  expect(Array.isArray(results)).toBe(true);

  const reverse = await page.request.get("/api/geocode?lat=9.973&lng=76.277");
  expect(reverse.ok()).toBeTruthy();

  const shortQuery = await page.request.get("/api/geocode?q=ab");
  expect(shortQuery.ok()).toBeTruthy();
  expect(await shortQuery.json()).toEqual([]);
});
