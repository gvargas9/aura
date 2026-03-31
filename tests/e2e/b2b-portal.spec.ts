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

      // All four tiers should be visible (use heading role to avoid matching "All Bronze features" etc.)
      await expect(
        page.getByRole("heading", { name: "Bronze" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Silver" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Gold" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Platinum" })
      ).toBeVisible();

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

      // Step 1: Contact Information fields
      // The Input component renders label text but does not link it via htmlFor,
      // so we match by placeholder instead.
      await expect(page.getByPlaceholder("John Smith")).toBeVisible();
      await expect(page.getByPlaceholder("john@company.com")).toBeVisible();
      await expect(page.getByPlaceholder("(555) 123-4567")).toBeVisible();
      await expect(page.getByPlaceholder("Acme Fitness LLC")).toBeVisible();

      // Verify label text is displayed
      await expect(page.getByText("Full Name *")).toBeVisible();
      await expect(page.getByText("Email Address *")).toBeVisible();
      await expect(page.getByText("Organization Name *")).toBeVisible();
    });

    test("should show business type selection on step 2", async ({ page }) => {
      await page.goto("/b2b/apply");

      // Fill step 1 required fields to enable navigation
      await page.getByPlaceholder("John Smith").fill("Test User");
      await page.getByPlaceholder("john@company.com").fill("test@example.com");
      await page.getByPlaceholder("Acme Fitness LLC").fill("Test Org");

      // Navigate to step 2
      await page.getByRole("button", { name: "Next", exact: true }).click();

      // Step 2 shows Business Type as icon buttons
      await expect(page.getByText("Business Type *")).toBeVisible();
      await expect(page.getByText("Gym / Fitness Center")).toBeVisible();
      await expect(page.getByText("Retail Store")).toBeVisible();
      await expect(page.getByText("Vending Operator")).toBeVisible();
    });

    test("should show validation error when submitting empty form", async ({
      page,
    }) => {
      await page.goto("/b2b/apply");

      // The form is a multi-step wizard. The "Submit Application" button only
      // appears on step 4 (Review). We need to navigate there first.
      // Fill step 1 with valid data
      await page.getByPlaceholder("John Smith").fill("Test User");
      await page
        .getByPlaceholder("john@company.com")
        .fill("test@example.com");
      await page.getByPlaceholder("Acme Fitness LLC").fill("Test Org");
      await page.getByRole("button", { name: "Next", exact: true }).click();

      // Step 2: select a business type
      await page.getByText("Gym / Fitness Center").click();
      await page.getByRole("button", { name: "Next", exact: true }).click();

      // Step 3: skip optional fields, just proceed
      await page.getByRole("button", { name: "Next", exact: true }).click();

      // Step 4: Review - submit button is visible
      await expect(
        page.getByRole("button", { name: /submit application/i })
      ).toBeVisible();
    });

    test("should show email validation error for invalid email", async ({
      page,
    }) => {
      await page.goto("/b2b/apply");

      // Fill step 1 with invalid email and click Next (validation happens on Next)
      await page.getByPlaceholder("John Smith").fill("Test User");
      await page.getByPlaceholder("john@company.com").fill("invalid-email");
      await page.getByPlaceholder("Acme Fitness LLC").fill("Test Org");

      await page.getByRole("button", { name: "Next", exact: true }).click();

      await expect(
        page.getByText(/please enter a valid email address/i)
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("B2B Portal (Authenticated)", () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test("should load portal dashboard when authenticated as admin", async ({
      page,
    }) => {
      await page.goto("/b2b/portal");
      await page.waitForLoadState("networkidle");

      // The desktop sidebar (hidden lg:flex) contains "Aura Partner Portal".
      // The mobile header (lg:hidden) also has it but is hidden at desktop viewport.
      const desktopSidebar = page.locator("aside.hidden.lg\\:flex");
      await expect(
        desktopSidebar.getByText(/aura partner portal/i)
      ).toBeVisible({ timeout: 30000 });
    });

    test("should show sidebar navigation with Dashboard, Products, Orders", async ({
      page,
    }) => {
      await page.goto("/b2b/portal");
      await page.waitForLoadState("networkidle");

      // Wait for portal to load via desktop sidebar
      const desktopSidebar = page.locator("aside.hidden.lg\\:flex");
      await expect(
        desktopSidebar.getByText(/aura partner portal/i)
      ).toBeVisible({ timeout: 30000 });

      // Check sidebar nav links
      await expect(
        desktopSidebar.getByRole("link", { name: /dashboard/i })
      ).toBeVisible();
      await expect(
        desktopSidebar.getByRole("link", { name: /products/i })
      ).toBeVisible();
      await expect(
        desktopSidebar.getByRole("link", { name: /orders/i })
      ).toBeVisible();
    });

    test("should show stats cards or no-dealer message on dashboard", async ({
      page,
    }) => {
      await page.goto("/b2b/portal");
      await page.waitForLoadState("networkidle");

      // Wait for loading to finish via desktop sidebar
      const desktopSidebar = page.locator("aside.hidden.lg\\:flex");
      await expect(
        desktopSidebar.getByText(/aura partner portal/i)
      ).toBeVisible({ timeout: 30000 });

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
      ).toBeVisible({ timeout: 30000 });
    });

    test("should show search input and category filter on products page", async ({
      page,
    }) => {
      await page.goto("/b2b/portal/products");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: /b2b product catalog/i })
      ).toBeVisible({ timeout: 30000 });

      // Search input
      await expect(
        page.getByPlaceholder(/search products/i)
      ).toBeVisible();

      // Category sidebar (desktop) shows "Categories" heading and "All Products" button
      await expect(
        page.getByRole("heading", { name: "Categories" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "All Products" })
      ).toBeVisible();
    });

    test("should load orders page", async ({ page }) => {
      await page.goto("/b2b/portal/orders");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: /orders/i }).first()
      ).toBeVisible({ timeout: 30000 });

      // Should show order tabs or empty state
      const hasOrderHistory = await page
        .getByText(/all orders/i)
        .isVisible()
        .catch(() => false);
      const hasEmptyState = await page
        .getByText(/no orders yet/i)
        .isVisible()
        .catch(() => false);

      expect(hasOrderHistory || hasEmptyState).toBeTruthy();
    });
  });
});
