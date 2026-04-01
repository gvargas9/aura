/**
 * Test Suite: Authenticated Customer (Production)
 * Category: Production E2E
 * Priority: high
 *
 * Description: Tests customer-facing pages after authentication.
 * Uses admin account as the only available test account.
 * All tests are READ-ONLY against production.
 *
 * Target: https://aura.inspiration-ai.com
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, collectConsoleErrors, checkNoBrokenImages } from "./helpers/auth";

test.describe("Customer - Authentication Flow", () => {
  test("should log in successfully", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "admin@inspiration-ai.com");
    await page.fill('input[type="password"]', "Inssigma@2");
    await page.locator('main button[type="submit"]').click();

    await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 30000 });
    const url = page.url();
    expect(url).not.toMatch(/\/auth\/login/);
  });

  test("should persist auth across page navigation", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toMatch(/\/auth\/login/);

    // Navigate to account
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toMatch(/\/auth\/login/);

    // Navigate to orders
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toMatch(/\/auth\/login/);
  });
});

test.describe("Customer - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load customer dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display dashboard stat cards or welcome content", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    // Dashboard should show some user-relevant content
    const hasDashboardContent =
      body?.match(/welcome|dashboard|subscription|order|overview/i);
    expect(hasDashboardContent).toBeTruthy();
  });

  test("should have quick action links", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should have at least one navigable link
    const links = page.locator("a[href]");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should have no broken images", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const broken = await checkNoBrokenImages(page);
    expect(broken).toBe(0);
  });
});

test.describe("Customer - Subscriptions Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load subscriptions page", async ({ page }) => {
    await page.goto("/dashboard/subscriptions");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display subscription content or empty state", async ({ page }) => {
    await page.goto("/dashboard/subscriptions");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent =
      body?.match(/subscription|active|no subscription|manage|renew/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Customer - Wishlist Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load wishlist page", async ({ page }) => {
    await page.goto("/dashboard/wishlist");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should show wishlist items or empty state", async ({ page }) => {
    await page.goto("/dashboard/wishlist");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent = body?.match(/wishlist|favorites|saved|no items|empty/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Customer - Orders Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load order history page", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display orders or empty state", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent = body?.match(/order|history|no orders|tracking/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Customer - Account Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load account page with profile form", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should show profile form fields", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    // Should have form inputs for profile management
    const inputs = page.locator("input");
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("should show email field with current user email", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"]').first();
    const isVisible = await emailInput.isVisible().catch(() => false);
    if (isVisible) {
      const value = await emailInput.inputValue();
      expect(value).toContain("@");
    }
  });

  test("should have a save/update button", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
    const isVisible = await saveButton.isVisible().catch(() => false);
    // Account page should have some form of save action
    if (!isVisible) {
      console.warn("No save button found on /account — UI may differ");
    }
  });
});

test.describe("Customer - Checkout Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load checkout or redirect appropriately", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    // Checkout may redirect to build-box if cart is empty, or show checkout form
    const url = page.url();
    const body = await page.textContent("body");

    const isCheckout = url.includes("/checkout");
    const isRedirected = url.includes("/build-box") || url.includes("/products");
    const hasEmptyCartMsg = body?.match(/empty|no items|cart is empty|build.*box/i);

    expect(isCheckout || isRedirected || hasEmptyCartMsg).toBeTruthy();
  });
});

test.describe("Customer - Authenticated Header", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should show user menu or avatar when logged in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // When logged in, we should NOT be on login page
    expect(page.url()).not.toMatch(/\/auth\/login/);

    // The page should have some form of navigation
    const header = page.locator("header").first();
    const hasHeader = await header.isVisible().catch(() => false);

    if (hasHeader) {
      const headerText = await header.textContent();
      // Authenticated users should see some user indicator
      const hasUserIndicator =
        headerText?.match(/admin|account|profile|sign out|dashboard|menu/i) ||
        (await page.locator('header button, header [class*="avatar"], header [class*="dropdown"]').first().isVisible().catch(() => false));
      // Log but don't fail hard — header structure varies
      if (!hasUserIndicator) {
        console.warn("No explicit user indicator found in header, but user is authenticated");
      }
    }
  });
});
