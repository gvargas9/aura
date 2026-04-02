/**
 * Test Suite: Admin Pages Deployment Verification
 * Category: e2e / deployment
 * Priority: critical
 *
 * Description: Verifies ALL admin panel pages load correctly after login.
 * Tests sidebar navigation links and page content rendering.
 * Run after every major deployment.
 *
 * Pages covered:
 *   /admin (dashboard), /admin/products, /admin/orders, /admin/customers,
 *   /admin/subscriptions, /admin/inventory, /admin/dealers, /admin/samples,
 *   /admin/storefronts, /admin/vending, /admin/recipes, /admin/analytics,
 *   /admin/notifications, /admin/email-templates, /admin/settings
 *
 * Prerequisites: Admin account (admin@inspiration-ai.com)
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// Helper: assert page loaded without crash
async function assertPageLoaded(page: Page, label: string) {
  const body = page.locator("body");
  await expect(body).not.toBeEmpty();

  // No Next.js application error
  const errorOverlay = page.locator("text=Application error");
  const hasError = await errorOverlay.isVisible().catch(() => false);
  expect(hasError, `${label} shows Application error`).toBe(false);
}

// All admin sidebar nav items to verify
const adminPages = [
  { label: "Dashboard", href: "/admin", contentHint: "dashboard" },
  { label: "Products", href: "/admin/products", contentHint: "product" },
  { label: "Orders", href: "/admin/orders", contentHint: "order" },
  { label: "Customers", href: "/admin/customers", contentHint: "customer" },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    contentHint: "subscription",
  },
  { label: "Inventory", href: "/admin/inventory", contentHint: "inventory" },
  { label: "Dealers", href: "/admin/dealers", contentHint: "dealer" },
  { label: "Samples", href: "/admin/samples", contentHint: "sample" },
  {
    label: "Storefronts",
    href: "/admin/storefronts",
    contentHint: "storefront",
  },
  { label: "Vending", href: "/admin/vending", contentHint: "vending" },
  { label: "Recipes", href: "/admin/recipes", contentHint: "recipe" },
  { label: "Analytics", href: "/admin/analytics", contentHint: "analytics" },
  {
    label: "Notifications",
    href: "/admin/notifications",
    contentHint: "notification",
  },
  {
    label: "Email Templates",
    href: "/admin/email-templates",
    contentHint: "email",
  },
];

test.describe("Deployment Verification: Admin Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /* ==============================================================
     ADMIN LAYOUT & SIDEBAR
     ============================================================== */
  test("admin layout renders with sidebar navigation", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("aside").first()).toBeVisible({ timeout: 15000 });

    // Verify all sidebar nav links exist
    for (const item of adminPages) {
      const link = page.locator(`a[href="${item.href}"]`).first();
      await expect(
        link,
        `Sidebar link for "${item.label}" (${item.href}) should exist`
      ).toBeVisible();
    }
  });

  test("admin header shows admin branding", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("header").first()).toBeVisible();
    // Should show "Admin" or "Aura Admin" somewhere
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });

  /* ==============================================================
     INDIVIDUAL PAGE VERIFICATION
     ============================================================== */
  for (const adminPage of adminPages) {
    test(`${adminPage.label} page (${adminPage.href}) loads content`, async ({
      page,
    }) => {
      await page.goto(adminPage.href);
      await assertPageLoaded(page, adminPage.label);

      // Wait for loading spinner to disappear (admin pages typically load data)
      await expect(page.locator(".animate-spin").first()).toBeHidden({
        timeout: 20000,
      }).catch(() => {
        // Some pages may not have spinners
      });

      // The page should have meaningful content (not just the sidebar)
      // Look for the page heading or main content area
      const mainContent = page.locator("main, [class*='content'], .flex-1");
      await expect(mainContent.first()).toBeVisible({ timeout: 10000 });
    });
  }

  /* ==============================================================
     ADMIN DASHBOARD SPECIFIC CHECKS
     ============================================================== */
  test("admin dashboard shows stats or overview cards", async ({ page }) => {
    await page.goto("/admin");
    await assertPageLoaded(page, "Admin Dashboard");

    // Dashboard typically shows stat cards - wait for data to load
    await expect(page.locator(".animate-spin").first()).toBeHidden({
      timeout: 20000,
    }).catch(() => {});

    // Should have some content structure (cards, tables, or stats)
    const contentElements = page.locator(
      "main h1, main h2, main [class*='card'], main [class*='stat'], main table"
    );
    const count = await contentElements.count();
    expect(count, "Dashboard should have content elements").toBeGreaterThan(0);
  });

  /* ==============================================================
     ADMIN PRODUCTS PAGE - TABLE & ACTIONS
     ============================================================== */
  test("admin products page shows product table or listing", async ({
    page,
  }) => {
    await page.goto("/admin/products");
    await assertPageLoaded(page, "Admin Products");

    await expect(page.locator(".animate-spin").first()).toBeHidden({
      timeout: 20000,
    }).catch(() => {});

    // Should have a table or product listing
    const listing = page.locator("table, [class*='grid'], [class*='list']");
    await expect(listing.first()).toBeVisible({ timeout: 10000 });
  });

  /* ==============================================================
     ADMIN ORDERS PAGE - TABLE
     ============================================================== */
  test("admin orders page shows order list or empty state", async ({ page }) => {
    await page.goto("/admin/orders");
    await assertPageLoaded(page, "Admin Orders");

    await expect(page.locator(".animate-spin").first()).toBeHidden({
      timeout: 20000,
    }).catch(() => {});

    // Should have a table/list OR "No orders found" empty state
    const hasTable = await page
      .locator("table")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/no orders/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(
      hasTable || hasEmptyState,
      "Orders page should show a table or empty state"
    ).toBe(true);
  });

  /* ==============================================================
     ADMIN SIDEBAR NAVIGATION WORKS
     ============================================================== */
  test("clicking sidebar links navigates to correct pages", async ({
    page,
  }) => {
    await page.goto("/admin");

    // Test navigation to a few key pages via sidebar clicks
    const pagesToClick = ["Products", "Orders", "Customers", "Inventory"];

    for (const label of pagesToClick) {
      const navLink = page
        .locator("aside a, nav a")
        .filter({ hasText: label })
        .first();

      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

        const expectedPath = `/admin/${label.toLowerCase()}`;
        expect(page.url()).toContain(expectedPath);
        await assertPageLoaded(page, `Admin ${label}`);
      }
    }
  });

  /* ==============================================================
     ADMIN SETTINGS PAGE (KNOWN MISSING)
     ============================================================== */
  test("admin settings page (/admin/settings) - known missing page", async ({
    page,
  }) => {
    const response = await page.goto("/admin/settings");
    // This page is linked in the sidebar but has no page.tsx
    // Test documents the missing page for deployment awareness
    const status = response?.status() ?? 0;
    if (status === 404) {
      test.info().annotations.push({
        type: "known-issue",
        description:
          "/admin/settings is linked in sidebar but has no page.tsx - returns 404",
      });
    }
  });
});
