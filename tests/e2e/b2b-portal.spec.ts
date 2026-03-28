/**
 * Test Suite: B2B Dealer Portal
 * Category: e2e
 * Priority: high
 *
 * Description: Tests the B2B landing page, dealer application form, and authenticated
 * portal pages including dashboard, products, and orders.
 * Prerequisites: Running dev server at localhost:3000, admin user seeded in Supabase.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("B2B Dealer Portal", () => {
  test.describe("B2B Landing Page", () => {
    test("should load with hero section and dealer tier info", async ({
      page,
    }) => {
      await page.goto("/b2b");

      // Hero section
      await expect(
        page.getByRole("heading", { name: /grow your business with aura/i })
      ).toBeVisible();
      await expect(page.getByText("B2B Partner Program")).toBeVisible();
      await expect(
        page.getByRole("link", { name: /apply to become a dealer/i })
      ).toBeVisible();

      // Dealer tiers section
      await expect(
        page.getByRole("heading", { name: /dealer tiers/i })
      ).toBeVisible();

      // All four tiers should be visible
      await expect(page.getByText("Bronze")).toBeVisible();
      await expect(page.getByText("Silver")).toBeVisible();
      await expect(page.getByText("Gold")).toBeVisible();
      await expect(page.getByText("Platinum")).toBeVisible();

      // Gold tier should be marked as most popular
      await expect(page.getByText("Most Popular")).toBeVisible();
    });

    test("should display benefits section", async ({ page }) => {
      await page.goto("/b2b");

      await expect(
        page.getByRole("heading", { name: /why partner with aura/i })
      ).toBeVisible();
      await expect(
        page.getByText("Competitive Wholesale Pricing")
      ).toBeVisible();
      await expect(page.getByText("Virtual Distribution")).toBeVisible();
      await expect(page.getByText("Real-Time Analytics")).toBeVisible();
    });

    test("should display use cases section", async ({ page }) => {
      await page.goto("/b2b");

      await expect(
        page.getByRole("heading", { name: /perfect for/i })
      ).toBeVisible();
      await expect(page.getByText("Gyms & Fitness Centers")).toBeVisible();
      await expect(
        page.getByText("Outdoor & Camping Retailers")
      ).toBeVisible();
    });
  });

  test.describe("B2B Application Page", () => {
    test("should load with application form fields", async ({ page }) => {
      await page.goto("/b2b/apply");

      await expect(
        page.getByRole("heading", { name: /apply to become a dealer/i })
      ).toBeVisible();

      // Contact Information fields
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/phone number/i)).toBeVisible();

      // Business Information fields
      await expect(page.getByLabel(/organization name/i)).toBeVisible();
      await expect(page.getByLabel(/business type/i)).toBeVisible();

      // Message textarea
      await expect(
        page.getByPlaceholder(/describe your business/i)
      ).toBeVisible();

      // Submit button
      await expect(
        page.getByRole("button", { name: /submit application/i })
      ).toBeVisible();
    });

    test("should show business type dropdown with options", async ({
      page,
    }) => {
      await page.goto("/b2b/apply");

      const select = page.getByLabel(/business type/i);
      await expect(select).toBeVisible();

      // Verify some dropdown options exist
      await expect(select.locator("option")).toHaveCount(11); // 1 placeholder + 10 types
    });

    test("should show validation error when submitting empty form", async ({
      page,
    }) => {
      await page.goto("/b2b/apply");

      await page.getByRole("button", { name: /submit application/i }).click();

      // The client-side validation triggers an error message
      await expect(
        page.getByText(/please fill in all required fields/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test("should show email validation error for invalid email", async ({
      page,
    }) => {
      await page.goto("/b2b/apply");

      // Fill required fields but with invalid email
      await page.getByLabel(/full name/i).fill("Test User");
      await page.getByLabel(/email address/i).fill("invalid-email");
      await page.getByLabel(/organization name/i).fill("Test Org");
      await page.getByLabel(/business type/i).selectOption("gym");

      await page.getByRole("button", { name: /submit application/i }).click();

      await expect(
        page.getByText(/please enter a valid email address/i)
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("B2B Portal (Authenticated)", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test("should load portal dashboard when authenticated as admin", async ({
      page,
    }) => {
      await page.goto("/b2b/portal");
      await page.waitForLoadState("networkidle");

      // The portal layout should be visible - check for sidebar or portal branding
      await expect(
        page.getByText(/aura partner portal/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("should show sidebar navigation with Dashboard, Products, Orders", async ({
      page,
    }) => {
      await page.goto("/b2b/portal");
      await page.waitForLoadState("networkidle");

      // Wait for portal to load
      await expect(
        page.getByText(/aura partner portal/i).first()
      ).toBeVisible({ timeout: 15000 });

      // Check sidebar nav links (desktop sidebar)
      const sidebar = page.locator("aside").first();
      await expect(
        sidebar.getByRole("link", { name: /dashboard/i })
      ).toBeVisible();
      await expect(
        sidebar.getByRole("link", { name: /products/i })
      ).toBeVisible();
      await expect(
        sidebar.getByRole("link", { name: /orders/i })
      ).toBeVisible();
    });

    test("should show stats cards or no-dealer message on dashboard", async ({
      page,
    }) => {
      await page.goto("/b2b/portal");
      await page.waitForLoadState("networkidle");

      // Wait for loading to finish
      await expect(
        page.getByText(/aura partner portal/i).first()
      ).toBeVisible({ timeout: 15000 });

      // The admin may or may not have a dealer record.
      // If dealer exists: stats cards are shown
      // If no dealer: "No Dealer Account Found" message
      const hasDealerAccount = await page
        .getByText(/total earned/i)
        .isVisible()
        .catch(() => false);
      const hasNoDealerMessage = await page
        .getByText(/no dealer account found/i)
        .isVisible()
        .catch(() => false);

      expect(hasDealerAccount || hasNoDealerMessage).toBeTruthy();
    });

    test("should load products page with catalog heading", async ({
      page,
    }) => {
      await page.goto("/b2b/portal/products");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: /b2b product catalog/i })
      ).toBeVisible({ timeout: 15000 });
    });

    test("should show search input and category filter on products page", async ({
      page,
    }) => {
      await page.goto("/b2b/portal/products");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: /b2b product catalog/i })
      ).toBeVisible({ timeout: 15000 });

      // Search input
      await expect(
        page.getByPlaceholder(/search products/i)
      ).toBeVisible();

      // Category filter dropdown
      await expect(page.getByLabel(/filter by category/i)).toBeVisible();
    });

    test("should load orders page", async ({ page }) => {
      await page.goto("/b2b/portal/orders");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: /orders/i }).first()
      ).toBeVisible({ timeout: 15000 });

      // Should show order history section
      await expect(page.getByText(/order history/i)).toBeVisible();
    });
  });
});
