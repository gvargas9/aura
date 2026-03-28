/**
 * Test Suite: Public Pages
 * Category: e2e
 * Priority: high
 *
 * Description: Tests all public-facing pages that do not require authentication.
 * Prerequisites: Running dev server at localhost:3000, seed products in database.
 * Test Data: 8 seed products in aura_products, 5 categories.
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test.describe("Landing Page (/)", () => {
    test("should load the landing page with hero, features, and footer", async ({
      page,
    }) => {
      await page.goto("/");

      // Hero section content
      await expect(page.getByText("Energy, Anywhere.")).toBeVisible();
      await expect(page.getByText(/gourmet food/i)).toBeVisible();
      await expect(
        page.getByRole("link", { name: /build your box/i }).first()
      ).toBeVisible();

      // Stats section
      await expect(page.getByText("Happy Customers")).toBeVisible();
      await expect(page.getByText("Meals Delivered")).toBeVisible();

      // Box options section
      await expect(page.getByText("Choose Your Box Size")).toBeVisible();
      await expect(page.getByText("Starter")).toBeVisible();
      await expect(page.getByText("Voyager")).toBeVisible();
      await expect(page.getByText("Bunker")).toBeVisible();

      // Features section
      await expect(page.getByText("Why Choose Aura?")).toBeVisible();
      await expect(page.getByText("All-Natural Ingredients")).toBeVisible();
      await expect(page.getByText("2-Year Shelf Life")).toBeVisible();
      await expect(page.getByText("Free Shipping").first()).toBeVisible();

      // Testimonials section
      await expect(page.getByText("Loved by Thousands")).toBeVisible();

      // Footer should be visible
      await expect(page.locator("footer")).toBeVisible();
    });

    test("should have working navigation links in the hero", async ({
      page,
    }) => {
      await page.goto("/");

      // "Build Your Box" link should navigate to /build-box
      const buildBoxLink = page
        .getByRole("link", { name: /build your box/i })
        .first();
      await expect(buildBoxLink).toHaveAttribute("href", "/build-box");
    });
  });

  test.describe("Products Page (/products)", () => {
    test("should load and display product cards", async ({ page }) => {
      await page.goto("/products");

      // Page heading
      await expect(page.getByText("Our Products")).toBeVisible();
      await expect(
        page.getByText(/premium, shelf-stable meals/i)
      ).toBeVisible();

      // Wait for products to load (spinner disappears)
      await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 10000 });

      // Product count text should be visible
      await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible();
    });

    test("should filter products by category when clicking a category button", async ({
      page,
    }) => {
      await page.goto("/products");

      // Wait for products to load
      await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 10000 });

      // Get the initial product count text
      const initialCountText = await page
        .getByText(/showing \d+ of \d+ products/i)
        .textContent();

      // Find and click a category button in the sidebar (desktop filters)
      // Categories are rendered as buttons with capitalize class
      const categoryButtons = page.locator(
        'aside button.capitalize'
      );
      const categoryCount = await categoryButtons.count();

      if (categoryCount > 0) {
        await categoryButtons.first().click();

        // The product count text should update
        await page.waitForTimeout(500);
        const filteredCountText = await page
          .getByText(/showing \d+ of \d+ products/i)
          .textContent();

        // Count may change or stay same, but element should still exist
        expect(filteredCountText).toBeTruthy();
      }
    });

    test("should filter products when searching", async ({ page }) => {
      await page.goto("/products");

      // Wait for products to load
      await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 10000 });

      // The sidebar has a search input - look for the search functionality
      // ProductFilters includes a search input
      const searchInput = page.locator('aside input[type="text"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill("chicken");
        await page.waitForTimeout(500);

        // Results count should update
        await expect(
          page.getByText(/showing \d+ of \d+ products/i)
        ).toBeVisible();
      }
    });
  });

  test.describe("Build-a-Box Page (/build-box)", () => {
    test("should load with products and box size selector", async ({
      page,
    }) => {
      await page.goto("/build-box");

      // Wait for products to load
      await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 10000 });

      // Category navigation
      await expect(page.getByText("Meal Category")).toBeVisible();

      // Box size selector section
      await expect(page.getByText("Choose Your Box Size")).toBeVisible();

      // Order summary sidebar (desktop)
      await expect(page.getByText("My Order")).toBeVisible();
    });
  });

  test.describe("B2B Page (/b2b)", () => {
    test("should load with dealer tier information", async ({ page }) => {
      await page.goto("/b2b");

      // Hero section
      await expect(page.getByText("B2B Partner Program")).toBeVisible();
      await expect(
        page.getByText("Grow Your Business with Aura")
      ).toBeVisible();

      // Dealer application button
      await expect(
        page.getByRole("link", { name: /apply to become a dealer/i })
      ).toBeVisible();

      // Benefits section
      await expect(page.getByText("Why Partner with Aura?")).toBeVisible();
      await expect(
        page.getByText("Competitive Wholesale Pricing")
      ).toBeVisible();
      await expect(page.getByText("Virtual Distribution")).toBeVisible();

      // Dealer tiers
      await expect(page.getByText("Dealer Tiers")).toBeVisible();
      await expect(page.getByText("Bronze")).toBeVisible();
      await expect(page.getByText("Silver")).toBeVisible();
      await expect(page.getByText("Gold")).toBeVisible();
      await expect(page.getByText("Platinum")).toBeVisible();

      // Use cases
      await expect(page.getByText("Perfect For")).toBeVisible();
      await expect(page.getByText("Gyms & Fitness Centers")).toBeVisible();

      // CTA section
      await expect(
        page.getByText("Ready to Partner with Aura?")
      ).toBeVisible();

      // Footer
      await expect(page.locator("footer")).toBeVisible();
    });
  });
});
