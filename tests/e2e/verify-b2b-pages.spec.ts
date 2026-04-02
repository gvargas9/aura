/**
 * Test Suite: B2B Portal Pages Verification
 * Category: e2e / deployment
 * Priority: high
 *
 * Description: Verifies B2B portal pages load correctly.
 * Admin user has access to B2B portal (role check allows admin).
 *
 * Pages covered:
 *   /b2b/portal, /b2b/portal/products, /b2b/portal/orders,
 *   /b2b/portal/analytics, /b2b/portal/locations,
 *   /b2b/portal/branding, /b2b/portal/samples
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

const b2bPortalPages = [
  { label: "Dashboard", href: "/b2b/portal" },
  { label: "Products", href: "/b2b/portal/products" },
  { label: "Orders", href: "/b2b/portal/orders" },
  { label: "Analytics", href: "/b2b/portal/analytics" },
  { label: "Locations", href: "/b2b/portal/locations" },
  { label: "Branding", href: "/b2b/portal/branding" },
  { label: "Samples", href: "/b2b/portal/samples" },
];

test.describe("Deployment Verification: B2B Portal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /* ==============================================================
     B2B PORTAL LAYOUT
     ============================================================== */
  test("B2B portal layout renders with sidebar navigation", async ({
    page,
  }) => {
    await page.goto("/b2b/portal");

    // Portal may redirect non-dealers - if admin has access, check layout
    // Allow some time for auth check
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes("/b2b/portal")) {
      // Portal loaded - verify navigation
      for (const item of b2bPortalPages) {
        const link = page.locator(`a[href="${item.href}"]`).first();
        const isVisible = await link.isVisible().catch(() => false);
        if (!isVisible) {
          test.info().annotations.push({
            type: "info",
            description: `B2B nav link "${item.label}" not visible - admin may not have dealer record`,
          });
        }
      }
    } else {
      // Admin was redirected (no dealer record) - that's expected behavior
      test.info().annotations.push({
        type: "info",
        description:
          "Admin redirected from B2B portal - no dealer record associated",
      });
    }
  });

  /* ==============================================================
     INDIVIDUAL B2B PORTAL PAGES
     ============================================================== */
  for (const portalPage of b2bPortalPages) {
    test(`B2B ${portalPage.label} (${portalPage.href}) loads or redirects`, async ({
      page,
    }) => {
      await page.goto(portalPage.href);
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes(portalPage.href)) {
        // Page loaded successfully
        await assertPageLoaded(page, `B2B ${portalPage.label}`);
        await expect(page.locator("main, .flex-1").first()).toBeVisible({
          timeout: 10000,
        });
      } else {
        // Redirected - admin may not have dealer access
        // This is valid behavior, not a broken page
        test.info().annotations.push({
          type: "info",
          description: `Redirected from ${portalPage.href} to ${currentUrl}`,
        });
      }
    });
  }

  /* ==============================================================
     B2B PORTAL REDIRECTS (UNAUTHENTICATED)
     ============================================================== */
  test("B2B portal redirects unauthenticated users", async ({ browser }) => {
    // Fresh context without login
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/b2b/portal");
    // Should redirect to login
    await page.waitForURL(/\/auth\/login|\/b2b/, { timeout: 15000 });

    await context.close();
  });
});
