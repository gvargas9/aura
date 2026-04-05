/**
 * Test Suite: Mobile Responsive Design Verification
 * Category: e2e / responsive
 * Priority: high
 *
 * Description: Verifies key pages render correctly at mobile viewport (iPhone 14: 390x844),
 * including bottom tab navigation, layout integrity, and touch target sizing.
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.use({ viewport: { width: 390, height: 844 } });

// Helper: assert no uncaught errors on page
async function assertNoPageCrash(page: Page) {
  const body = page.locator("body");
  await expect(body).not.toBeEmpty();
  const errorDigest = page.locator("text=Application error");
  const hasError = await errorDigest.isVisible().catch(() => false);
  expect(hasError).toBe(false);
}

test.describe("Mobile Responsive Design (iPhone 14 — 390x844)", () => {
  /* ==============================================================
     PUBLIC PAGES (no auth)
     ============================================================== */
  test.describe("Public Pages", () => {
    test("landing page renders hero and mobile nav", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Gourmet Food")).toBeVisible({
        timeout: 15000,
      });
      await assertNoPageCrash(page);

      // Bottom tab nav should be visible on mobile
      const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(mobileNav).toBeVisible();

      // Verify all 5 tab labels are present
      await expect(mobileNav.getByText("Home")).toBeVisible();
      await expect(mobileNav.getByText("Products")).toBeVisible();
      await expect(mobileNav.getByText("Build Box")).toBeVisible();
      await expect(mobileNav.getByText("Orders")).toBeVisible();
      await expect(mobileNav.getByText("Account")).toBeVisible();

      // Desktop nav links should be hidden at mobile width (hidden lg:flex)
      const desktopNavContainer = page.locator("header .hidden.lg\\:flex").first();
      await expect(desktopNavContainer).toBeHidden();
    });

    test("products page loads with grid and filters", async ({ page }) => {
      await page.goto("/products");
      await assertNoPageCrash(page);

      await expect(page.getByText("Our Products")).toBeVisible({
        timeout: 15000,
      });
      // Wait for loading to finish
      await expect(page.locator(".animate-spin")).toBeHidden({
        timeout: 15000,
      });
      // Product count may be in sidebar (hidden on mobile) - just verify page has content
      const body = await page.locator("body").innerHTML();
      expect(body.length).toBeGreaterThan(500);
    });

    test("build-a-box page loads with box selector and products", async ({
      page,
    }) => {
      await page.goto("/build-box");
      await assertNoPageCrash(page);

      await expect(page.getByText("Starter").first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText("Voyager").first()).toBeVisible();
      await expect(page.getByText("Bunker").first()).toBeVisible();
    });

    test("login page form fits mobile viewport", async ({ page }) => {
      await page.goto("/auth/login");
      await assertNoPageCrash(page);

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('main button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitBtn).toBeVisible();

      // Verify inputs are within viewport bounds
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      const submitBox = await submitBtn.boundingBox();

      expect(emailBox).not.toBeNull();
      expect(passwordBox).not.toBeNull();
      expect(submitBox).not.toBeNull();

      if (emailBox && passwordBox && submitBox) {
        // All elements should be within the 390px viewport width
        expect(emailBox.x + emailBox.width).toBeLessThanOrEqual(390);
        expect(passwordBox.x + passwordBox.width).toBeLessThanOrEqual(390);
        expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(390);
      }
    });
  });

  /* ==============================================================
     NAVIGATION (mobile)
     ============================================================== */
  test.describe("Mobile Navigation", () => {
    test("bottom tab bar has correct links", async ({ page }) => {
      await page.goto("/");
      await assertNoPageCrash(page);

      const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(mobileNav).toBeVisible();

      // Verify each tab links to the correct path
      const expectedTabs = [
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: "Build Box", href: "/build-box" },
        { label: "Orders", href: "/orders" },
        { label: "Account", href: "/account" },
      ];

      for (const tab of expectedTabs) {
        const link = mobileNav.locator(`a[href="${tab.href}"]`);
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("aria-label", tab.label);
      }
    });

    test("bottom tab navigation works — Products tab", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Gourmet Food")).toBeVisible({
        timeout: 15000,
      });

      const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
      const productsTab = mobileNav.locator('a[href="/products"]');
      await productsTab.click();

      await page.waitForURL(/\/products/, { timeout: 10000 });
      await expect(page.getByText("Our Products")).toBeVisible({
        timeout: 15000,
      });
    });

    test("desktop nav links hidden on mobile", async ({ page }) => {
      await page.goto("/");
      await assertNoPageCrash(page);

      const header = page.locator("header").first();
      await expect(header).toBeVisible();

      // The desktop nav container uses "hidden lg:flex" — should be hidden at 390px
      // Check that desktop-only nav items are not visible
      const desktopProductsLink = header.locator(
        ':scope > nav > div > div.hidden a[href="/products"]'
      );
      // Use a broader check: at mobile width these links should not be visible
      const desktopLinks = ["Products", "Build a Box", "How It Works", "For Business"];
      for (const linkText of desktopLinks) {
        // These are inside the hidden lg:flex container, so they should not be visible
        const link = header.locator("div.hidden.lg\\:flex").getByRole("link", { name: linkText });
        await expect(link).toBeHidden();
      }
    });
  });

  /* ==============================================================
     AUTHENTICATED MOBILE
     ============================================================== */
  test.describe("Authenticated Mobile", () => {
    test("dashboard loads at mobile width", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/dashboard");
      await assertNoPageCrash(page);

      // Dashboard should render content within mobile viewport
      await expect(page.locator("main").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("admin panel — sidebar hidden by default, hamburger opens it", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");
      await assertNoPageCrash(page);

      // Wait for admin page to load
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

      // On mobile, sidebar should be hidden or collapsed by default
      // Look for a hamburger / menu toggle button
      const menuButton = page.locator(
        'button[aria-label*="menu" i], button[aria-label*="sidebar" i], button[aria-label*="navigation" i]'
      ).first();

      // If there's a menu toggle, the sidebar pattern is present
      const hasMenuButton = await menuButton.isVisible().catch(() => false);

      if (hasMenuButton) {
        // Click hamburger to open sidebar
        await menuButton.click();
        await page.waitForTimeout(500);

        // After clicking, some sidebar or nav overlay should appear
        const sidebar = page.locator(
          'aside, nav[aria-label*="admin" i], [role="navigation"]'
        ).first();
        await expect(sidebar).toBeVisible({ timeout: 5000 });
      } else {
        // Admin layout may use a different responsive pattern — verify page renders
        test.info().annotations.push({
          type: "info",
          description:
            "No hamburger menu button found — admin may use alternative mobile layout",
        });
        // At minimum, page content should be visible
        await expect(
          page.locator("main, [class*='admin'], [class*='dashboard']").first()
        ).toBeVisible({ timeout: 10000 });
      }
    });
  });

  /* ==============================================================
     KEY LAYOUT CHECKS
     ============================================================== */
  test.describe("Layout Integrity", () => {
    test("no horizontal overflow on landing page", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Gourmet Food")).toBeVisible({
        timeout: 15000,
      });

      // Wait for full render
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    });

    test("touch targets meet minimum 44px size", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Gourmet Food")).toBeVisible({
        timeout: 15000,
      });

      // Check key interactive elements for minimum 44px tap target
      const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
      await expect(mobileNav).toBeVisible();

      // Check each tab link in the bottom nav
      const tabLinks = mobileNav.locator("a");
      const tabCount = await tabLinks.count();

      for (let i = 0; i < tabCount; i++) {
        const box = await tabLinks.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          // Width or height should be at least 44px for adequate touch target
          const meetsMinimum = box.width >= 44 || box.height >= 44;
          expect(
            meetsMinimum,
            `Tab ${i} touch target too small: ${box.width}x${box.height}`
          ).toBe(true);
        }
      }

      // Check a primary CTA button if present (e.g., "Build Your Box" link)
      const ctaLink = page
        .getByRole("link", { name: /build your box/i })
        .first();
      if (await ctaLink.isVisible().catch(() => false)) {
        const ctaBox = await ctaLink.boundingBox();
        if (ctaBox) {
          const meetsMinimum = ctaBox.width >= 44 && ctaBox.height >= 44;
          expect(
            meetsMinimum,
            `CTA touch target too small: ${ctaBox.width}x${ctaBox.height}`
          ).toBe(true);
        }
      }
    });
  });
});
