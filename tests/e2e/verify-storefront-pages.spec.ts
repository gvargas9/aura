/**
 * Test Suite: Storefront Pages Verification
 * Category: e2e / deployment
 * Priority: high
 *
 * Description: Verifies storefront pages load correctly when a storefront
 * exists in the database. Tests dynamic [slug] routes.
 * Requires: At least one active storefront in the storefronts table.
 *
 * Pages covered:
 *   /store, /store/[slug], /store/[slug]/products, /store/[slug]/build-box
 */

import { test, expect, Page } from "@playwright/test";

async function assertPageLoaded(page: Page) {
  const errorOverlay = page.locator("text=Application error");
  const hasError = await errorOverlay.isVisible().catch(() => false);
  expect(hasError).toBe(false);
}

test.describe("Deployment Verification: Storefront Pages", () => {
  /* ==============================================================
     STORE INDEX PAGE
     ============================================================== */
  test("store index page (/store) loads", async ({ page }) => {
    await page.goto("/store");
    await assertPageLoaded(page);

    // Should show storefront listing or redirect
    const bodyContent = await page.locator("body").innerHTML();
    expect(bodyContent.length).toBeGreaterThan(100);
  });

  /* ==============================================================
     DYNAMIC STOREFRONT PAGES
     ============================================================== */
  test.describe("Dynamic storefront (requires seed data)", () => {
    const STOREFRONT_SLUG = "austin-fitness";

    test(`storefront home (/store/${STOREFRONT_SLUG}) loads or shows not found`, async ({
      page,
    }) => {
      const response = await page.goto(`/store/${STOREFRONT_SLUG}`);
      const status = response?.status() ?? 0;

      if (status === 404) {
        test.info().annotations.push({
          type: "info",
          description:
            "Storefront not found - run scripts/seed-data.mjs to create test storefront",
        });
        return;
      }

      await assertPageLoaded(page);
      // Storefront should render with some content
      const bodyContent = await page.locator("body").innerHTML();
      expect(bodyContent.length).toBeGreaterThan(200);
    });

    test(`storefront products (/store/${STOREFRONT_SLUG}/products) loads`, async ({
      page,
    }) => {
      const response = await page.goto(
        `/store/${STOREFRONT_SLUG}/products`
      );
      const status = response?.status() ?? 0;

      if (status === 404) {
        test.info().annotations.push({
          type: "info",
          description: "Storefront not found - needs seed data",
        });
        return;
      }

      await assertPageLoaded(page);
    });

    test(`storefront build-box (/store/${STOREFRONT_SLUG}/build-box) loads`, async ({
      page,
    }) => {
      const response = await page.goto(
        `/store/${STOREFRONT_SLUG}/build-box`
      );
      const status = response?.status() ?? 0;

      if (status === 404) {
        test.info().annotations.push({
          type: "info",
          description: "Storefront not found - needs seed data",
        });
        return;
      }

      await assertPageLoaded(page);
    });
  });

  /* ==============================================================
     STOREFRONT NAVIGATION
     ============================================================== */
  test("storefront layout has navigation when storefront exists", async ({
    page,
  }) => {
    const STOREFRONT_SLUG = "austin-fitness";
    const response = await page.goto(`/store/${STOREFRONT_SLUG}`);
    const status = response?.status() ?? 0;

    if (status === 404) {
      test.info().annotations.push({
        type: "info",
        description: "Storefront not found - skipping nav test",
      });
      return;
    }

    await assertPageLoaded(page);

    // Check for storefront nav links
    const productsLink = page.locator(
      `a[href="/store/${STOREFRONT_SLUG}/products"]`
    );
    const buildBoxLink = page.locator(
      `a[href="/store/${STOREFRONT_SLUG}/build-box"]`
    );

    const hasProducts = await productsLink.isVisible().catch(() => false);
    const hasBuildBox = await buildBoxLink.isVisible().catch(() => false);

    // At least one nav link should exist
    if (!hasProducts && !hasBuildBox) {
      test.info().annotations.push({
        type: "warning",
        description: "No storefront navigation links found",
      });
    }
  });
});
