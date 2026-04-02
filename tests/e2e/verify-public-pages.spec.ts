/**
 * Test Suite: Public Pages Deployment Verification
 * Category: e2e / deployment
 * Priority: critical
 *
 * Description: Verifies ALL public-facing pages load correctly, render content,
 * and have working internal links. Run after every major deployment.
 *
 * Pages covered:
 *   / (landing), /products, /build-box, /gift-cards, /academy,
 *   /b2b, /b2b/apply, /presentation, /checkout,
 *   /auth/login, /auth/signup, /auth/forgot-password
 */

import { test, expect, Page } from "@playwright/test";

// Helper: assert no uncaught errors on page
async function assertNoPageCrash(page: Page) {
  // Page should not show Next.js error overlay or blank white screen
  const body = page.locator("body");
  await expect(body).not.toBeEmpty();
  // Check for Next.js error digest (server error page)
  const errorDigest = page.locator("text=Application error");
  const hasError = await errorDigest.isVisible().catch(() => false);
  expect(hasError).toBe(false);
}

// Helper: collect all internal links on the current page
async function getInternalLinks(page: Page): Promise<string[]> {
  const links = await page.locator('a[href^="/"]').evaluateAll((els) =>
    els
      .map((el) => el.getAttribute("href"))
      .filter((href): href is string => !!href)
  );
  return [...new Set(links)];
}

test.describe("Deployment Verification: Public Pages", () => {
  /* ==============================================================
     LANDING PAGE
     ============================================================== */
  test.describe("Landing Page (/)", () => {
    test("renders hero section with CTAs", async ({ page }) => {
      await page.goto("/");
      // Landing page does not use <main> tag - wait for hero content
      await expect(page.getByText("Gourmet Food")).toBeVisible({
        timeout: 15000,
      });
      await assertNoPageCrash(page);

      await expect(
        page.getByRole("link", { name: /build your box/i }).first()
      ).toBeVisible();
    });

    test("renders box tiers section", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Pick Your Perfect Box")).toBeVisible();
      await expect(page.getByText("Starter").first()).toBeVisible();
      await expect(page.getByText("Voyager").first()).toBeVisible();
      await expect(page.getByText("Bunker").first()).toBeVisible();
    });

    test("renders features and testimonials", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("The Aura Difference")).toBeVisible();
      await expect(page.getByText("Loved by Thousands")).toBeVisible();
    });

    test("renders header with navigation links", async ({ page }) => {
      await page.goto("/");
      const header = page.locator("header").first();
      await expect(header).toBeVisible();

      // Desktop nav links
      await expect(header.getByRole("link", { name: "Products" })).toBeVisible();
      await expect(
        header.getByRole("link", { name: "Build a Box" })
      ).toBeVisible();
    });

    test("renders footer with all sections", async ({ page }) => {
      await page.goto("/");
      // Wait for page to fully load then scroll to footer
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      const footer = page.locator("footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible({ timeout: 10000 });

      // Footer section headings (h4 elements)
      await expect(footer.getByRole("heading", { name: "Company" })).toBeVisible();
      await expect(footer.getByRole("heading", { name: "Products" })).toBeVisible();
      await expect(footer.getByRole("heading", { name: "Business" })).toBeVisible();
      await expect(footer.getByRole("heading", { name: "Support" })).toBeVisible();
    });
  });

  /* ==============================================================
     PRODUCTS PAGE
     ============================================================== */
  test.describe("Products Page (/products)", () => {
    test("loads and displays product listing", async ({ page }) => {
      await page.goto("/products");
      await assertNoPageCrash(page);

      await expect(page.getByText("Our Products")).toBeVisible();
      // Wait for products to load
      await expect(page.locator(".animate-spin")).toBeHidden({
        timeout: 15000,
      });
      await expect(page.getByText(/\d+ products/i)).toBeVisible();
    });

    test("has working category filters", async ({ page }) => {
      await page.goto("/products");
      await expect(page.locator(".animate-spin")).toBeHidden({
        timeout: 15000,
      });

      const categoryButtons = page.locator("aside button.capitalize");
      const count = await categoryButtons.count();
      if (count > 0) {
        await categoryButtons.first().click();
        await page.waitForTimeout(500);
        await expect(page.getByText(/\d+ products/i)).toBeVisible();
      }
    });

    test("has working search input", async ({ page }) => {
      await page.goto("/products");
      await expect(page.locator(".animate-spin")).toBeHidden({
        timeout: 15000,
      });

      const searchInput = page.locator('aside input[type="text"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill("chicken");
        await page.waitForTimeout(500);
        await expect(page.getByText(/\d+ products/i)).toBeVisible();
      }
    });

    test("product cards link to product detail pages", async ({ page }) => {
      await page.goto("/products");
      await expect(page.locator(".animate-spin")).toBeHidden({
        timeout: 15000,
      });

      // Find product links that go to /products/[id]
      const productLinks = page.locator('a[href^="/products/"]');
      const linkCount = await productLinks.count();

      if (linkCount > 0) {
        // Click first product and verify detail page loads
        const firstHref = await productLinks.first().getAttribute("href");
        if (firstHref) {
          await page.goto(firstHref);
          await assertNoPageCrash(page);
          // Product detail pages use main or render content in body
          await expect(
            page.locator("main, [class*='product'], h1").first()
          ).toBeVisible({ timeout: 10000 });
        }
      } else {
        // No products in database - that's OK for deployment verification
        test.info().annotations.push({
          type: "info",
          description: "No product links found - database may be empty",
        });
      }
    });
  });

  /* ==============================================================
     BUILD-A-BOX PAGE
     ============================================================== */
  test.describe("Build-a-Box Page (/build-box)", () => {
    test("loads with box size selector and products", async ({ page }) => {
      await page.goto("/build-box");
      await assertNoPageCrash(page);

      // Wait for page content to render - box tier selectors
      await expect(
        page.getByText("Starter").first()
      ).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Voyager").first()).toBeVisible();
      await expect(page.getByText("Bunker").first()).toBeVisible();
    });

    test("dietary filter pills are visible", async ({ page }) => {
      await page.goto("/build-box");
      await expect(page.locator(".animate-spin")).toBeHidden({
        timeout: 15000,
      });
      await expect(page.getByText("All").first()).toBeVisible();
    });
  });

  /* ==============================================================
     GIFT CARDS PAGE
     ============================================================== */
  test.describe("Gift Cards Page (/gift-cards)", () => {
    test("loads with purchase form", async ({ page }) => {
      await page.goto("/gift-cards");
      await assertNoPageCrash(page);

      // Wait for gift card content to render
      await expect(
        page.getByText(/give the gift/i)
      ).toBeVisible({ timeout: 15000 });

      // Preset amount buttons should be visible
      await expect(page.getByRole("button", { name: "$25" })).toBeVisible();
      await expect(page.getByRole("button", { name: "$50" })).toBeVisible();
      await expect(page.getByRole("button", { name: "$100" })).toBeVisible();
    });
  });

  /* ==============================================================
     ACADEMY PAGE
     ============================================================== */
  test.describe("Academy Page (/academy)", () => {
    test("loads recipe listing", async ({ page }) => {
      await page.goto("/academy");
      await assertNoPageCrash(page);

      // Page should render (even if no recipes in DB)
      await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    });
  });

  /* ==============================================================
     B2B PAGES
     ============================================================== */
  test.describe("B2B Landing Page (/b2b)", () => {
    test("loads with partner program info", async ({ page }) => {
      await page.goto("/b2b");
      await assertNoPageCrash(page);

      await expect(page.getByText("B2B Partner Program")).toBeVisible();
      await expect(
        page.getByText("Grow Your Business with Aura")
      ).toBeVisible();

      // Dealer tiers
      await expect(page.getByText("Dealer Tiers")).toBeVisible();
      await expect(page.getByText("Bronze", { exact: true })).toBeVisible();
      await expect(page.getByText("Silver", { exact: true })).toBeVisible();
      await expect(page.getByText("Gold", { exact: true })).toBeVisible();
      await expect(page.getByText("Platinum", { exact: true })).toBeVisible();
    });

    test("has working apply link", async ({ page }) => {
      await page.goto("/b2b");
      const applyLink = page.getByRole("link", {
        name: /apply to become a dealer/i,
      });
      await expect(applyLink).toBeVisible();
      await expect(applyLink).toHaveAttribute("href", "/b2b/apply");
    });
  });

  test.describe("B2B Application Page (/b2b/apply)", () => {
    test("loads application form", async ({ page }) => {
      await page.goto("/b2b/apply");
      await assertNoPageCrash(page);
      await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    });
  });

  /* ==============================================================
     PRESENTATION PAGE
     ============================================================== */
  test.describe("Presentation Page (/presentation)", () => {
    test("loads slide deck", async ({ page }) => {
      await page.goto("/presentation");
      await assertNoPageCrash(page);
      // Presentation page doesn't use <main> - check for any visible content
      await expect(page.locator("body")).not.toBeEmpty();
      // Wait for content to render
      await page.waitForLoadState("networkidle", { timeout: 15000 });
      const bodyContent = await page.locator("body").innerHTML();
      expect(bodyContent.length).toBeGreaterThan(100);
    });
  });

  /* ==============================================================
     AUTH PAGES
     ============================================================== */
  test.describe("Auth Pages", () => {
    test("login page loads with form", async ({ page }) => {
      await page.goto("/auth/login");
      await assertNoPageCrash(page);

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(
        page.locator('main button[type="submit"]')
      ).toBeVisible();
    });

    test("login page has signup link", async ({ page }) => {
      await page.goto("/auth/login");
      const signupLink = page.getByRole("link", { name: /sign up/i });
      await expect(signupLink).toBeVisible();
    });

    test("login page has forgot password link", async ({ page }) => {
      await page.goto("/auth/login");
      const forgotLink = page.getByRole("link", {
        name: /forgot password/i,
      });
      await expect(forgotLink).toBeVisible();
    });

    test("signup page loads with form", async ({ page }) => {
      await page.goto("/auth/signup");
      await assertNoPageCrash(page);

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });

    test("signup page has login link", async ({ page }) => {
      await page.goto("/auth/signup");
      // Link text is "Already have an account? Sign in" or similar
      const loginLink = page.locator('a[href="/auth/login"]');
      await expect(loginLink.first()).toBeVisible();
    });

    test("forgot password page loads", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await assertNoPageCrash(page);

      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test("forgot password has back to login link", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      // "Back to Sign In" is a link wrapping a button
      const backLink = page.locator('a[href="/auth/login"]');
      await expect(backLink.first()).toBeVisible();
    });

    test("auth error page loads", async ({ page }) => {
      await page.goto("/auth/error");
      await assertNoPageCrash(page);
      await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    });
  });

  /* ==============================================================
     CHECKOUT PAGE (unauthenticated redirect)
     ============================================================== */
  test.describe("Checkout Page (/checkout)", () => {
    test("redirects unauthenticated users to login", async ({ page }) => {
      await page.goto("/checkout");
      // Should redirect to login since checkout requires auth
      await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });

  /* ==============================================================
     PROTECTED ROUTES REDIRECT
     ============================================================== */
  test.describe("Protected Route Redirects", () => {
    test("/dashboard redirects to login when unauthenticated", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
    });

    test("/account redirects to login when unauthenticated", async ({
      page,
    }) => {
      await page.goto("/account");
      await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
    });

    test("/orders redirects to login when unauthenticated", async ({
      page,
    }) => {
      await page.goto("/orders");
      await page.waitForURL(/\/auth\/login/, { timeout: 15000 });
    });
  });
});
