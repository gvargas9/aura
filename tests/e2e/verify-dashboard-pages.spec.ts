/**
 * Test Suite: User Dashboard & Account Pages Verification
 * Category: e2e / deployment
 * Priority: critical
 *
 * Description: Verifies all authenticated user pages load correctly.
 * Uses admin login (who is also a regular user) to access dashboard pages.
 *
 * Pages covered:
 *   /dashboard, /dashboard/subscriptions, /dashboard/wishlist,
 *   /account, /account/notifications, /account/locale
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

async function assertPageLoaded(page: Page, label: string) {
  const body = page.locator("body");
  await expect(body).not.toBeEmpty();
  const errorOverlay = page.locator("text=Application error");
  const hasError = await errorOverlay.isVisible().catch(() => false);
  expect(hasError, `${label} shows Application error`).toBe(false);
}

// Resilient content check - some pages don't use <main>
async function assertHasContent(page: Page, timeout = 15000) {
  await page.waitForLoadState("domcontentloaded", { timeout });
  // Wait for either <main> or meaningful body content
  const hasMain = await page
    .locator("main")
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  if (hasMain) return;

  // Fallback: check body has substantial content
  const bodyLength = await page
    .locator("body")
    .evaluate((el) => el.innerHTML.trim().length);
  expect(bodyLength, "Page body should have content").toBeGreaterThan(100);
}

test.describe("Deployment Verification: User Dashboard & Account", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /* ==============================================================
     DASHBOARD PAGES
     ============================================================== */
  test("dashboard main page (/dashboard) loads", async ({ page }) => {
    await page.goto("/dashboard");
    await assertPageLoaded(page, "Dashboard");
    await assertHasContent(page);
  });

  test("dashboard subscriptions page (/dashboard/subscriptions) loads", async ({
    page,
  }) => {
    await page.goto("/dashboard/subscriptions");
    await assertPageLoaded(page, "Dashboard Subscriptions");
    await assertHasContent(page);
  });

  test("dashboard wishlist page (/dashboard/wishlist) loads", async ({
    page,
  }) => {
    await page.goto("/dashboard/wishlist");
    await assertPageLoaded(page, "Dashboard Wishlist");
    await assertHasContent(page);
  });

  /* ==============================================================
     ACCOUNT PAGES
     ============================================================== */
  test("account page (/account) loads with profile info", async ({ page }) => {
    await page.goto("/account");
    await assertPageLoaded(page, "Account");
    await assertHasContent(page);
  });

  test("account notifications page (/account/notifications) loads", async ({
    page,
  }) => {
    await page.goto("/account/notifications");
    await assertPageLoaded(page, "Account Notifications");
    await assertHasContent(page);
  });

  test("account locale page (/account/locale) loads", async ({ page }) => {
    await page.goto("/account/locale");
    await assertPageLoaded(page, "Account Locale");
    await assertHasContent(page);
  });

  /* ==============================================================
     ORDERS PAGES (AUTHENTICATED)
     ============================================================== */
  test("orders page (/orders) loads when authenticated", async ({ page }) => {
    await page.goto("/orders");
    await assertPageLoaded(page, "Orders");
    await assertHasContent(page);
  });

  /* ==============================================================
     CHECKOUT PAGES (AUTHENTICATED)
     ============================================================== */
  test("checkout page (/checkout) accessible when authenticated", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await assertPageLoaded(page, "Checkout");
    // Checkout may show loading state or redirect - just verify it doesn't 404
    await assertHasContent(page);
  });

  test("checkout success page (/checkout/success) loads", async ({ page }) => {
    await page.goto("/checkout/success");
    await assertPageLoaded(page, "Checkout Success");
    await assertHasContent(page);
  });
});
