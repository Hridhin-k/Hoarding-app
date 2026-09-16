import { expect, test } from "@playwright/test";

test("public marketplace and marketing pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /the board is the core asset/i })).toBeVisible();
  await page.goto("/market");
  await expect(page.getByRole("heading", { name: /find outdoor inventory/i })).toBeVisible();
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
  const firstBoard = page.locator('a[href^="/market/"]').first();
  if (await firstBoard.count()) {
    await firstBoard.click();
    await expect(page.getByText(/floor rate/i)).toHaveCount(0);
    await expect(page.getByText(/tenant/i)).toHaveCount(0);
  }
});
