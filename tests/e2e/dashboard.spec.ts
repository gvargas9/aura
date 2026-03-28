/**
 * Test Suite: User Dashboard
 * Category: e2e
 * Priority: high
 *
 * Description: Tests all authenticated dashboard pages including stats, orders, account, and subscriptions.
 * Prerequisites: Running dev server, admin user seeded in Supabase.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("User Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe("Dashboard Home (/dashboard)", () => {
    test("should show welcome message with user name", async ({ page }) => {
      await expect(page.getByText(/welcome back/i)).toBeVisible({
        timeout: 15000,
      });
    });

    test("should display stat cards for Total Orders, Active Subscriptions, and Credits", async ({
      page,
    }) => {
      // Wait for dashboard data to load
      await expect(page.getByText(/welcome back/i)).toBeVisible({
        timeout: 15000,
      });

      // Stat cards
      await expect(page.getByText("Total Orders")).toBeVisible();
      await expect(page.getByText("Active Subscriptions")).toBeVisible();
      await expect(page.getByText("Credits Balance")).toBeVisible();
    });

    test("should show quick action links", async ({ page }) => {
      await expect(page.getByText("Quick Actions")).toBeVisible({
        timeout: 15000,
      });

      // Quick action buttons
      await expect(
        page.getByRole("button", { name: /build a box/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /view orders/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /manage subscription/i })
      ).toBeVisible();
    });

    test("should show account section with email and role", async ({
      page,
    }) => {
      await expect(page.getByText("Quick Actions")).toBeVisible({
        timeout: 15000,
      });

      // Account info card
      const accountSection = page.locator("text=Account").first();
      await expect(accountSection).toBeVisible();

      // Email and role should be displayed
      await expect(page.getByText("admin@inspiration-ai.com")).toBeVisible();
      await expect(page.getByText(/Role/)).toBeVisible();
    });

    test("should show Active Subscriptions section", async ({ page }) => {
      await expect(page.getByText(/welcome back/i)).toBeVisible({
        timeout: 15000,
      });

      await expect(page.getByText("Active Subscriptions")).toBeVisible();
    });

    test("should show Recent Orders section", async ({ page }) => {
      await expect(page.getByText(/welcome back/i)).toBeVisible({
        timeout: 15000,
      });

      await expect(page.getByText("Recent Orders")).toBeVisible();
    });
  });

  test.describe("Orders Page (/orders)", () => {
    test("should load with the order history heading and filter bar", async ({
      page,
    }) => {
      await page.goto("/orders");

      await expect(page.getByText("Order History")).toBeVisible({
        timeout: 15000,
      });
      await expect(
        page.getByText("Track and manage all your Aura orders.")
      ).toBeVisible();

      // Filter buttons should be present
      await expect(
        page.getByRole("button", { name: "All Orders" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Pending" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Processing" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Shipped" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Delivered" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Cancelled" })
      ).toBeVisible();
    });

    test("should allow clicking status filter buttons", async ({ page }) => {
      await page.goto("/orders");

      await expect(page.getByText("Order History")).toBeVisible({
        timeout: 15000,
      });

      // Click through each filter button
      const filters = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "All Orders",
      ];

      for (const filterName of filters) {
        const button = page.getByRole("button", { name: filterName });
        await button.click();

        // The clicked button should have the active style (bg-aura-primary)
        await expect(button).toHaveClass(/bg-aura-primary/);
      }
    });
  });

  test.describe("Account Page (/account)", () => {
    test("should load with account settings heading and profile form", async ({
      page,
    }) => {
      await page.goto("/account");

      await expect(page.getByText("Account Settings")).toBeVisible({
        timeout: 15000,
      });
      await expect(
        page.getByText("Manage your personal information and preferences.")
      ).toBeVisible();

      // Profile Information section
      await expect(page.getByText("Profile Information")).toBeVisible();
    });

    test("should show editable fields for full name and phone", async ({
      page,
    }) => {
      await page.goto("/account");

      await expect(page.getByText("Profile Information")).toBeVisible({
        timeout: 15000,
      });

      // Full Name input
      const fullNameLabel = page.getByText("Full Name");
      await expect(fullNameLabel).toBeVisible();

      // Phone Number input
      const phoneLabel = page.getByText("Phone Number");
      await expect(phoneLabel).toBeVisible();

      // Avatar URL input
      const avatarLabel = page.getByText("Avatar URL");
      await expect(avatarLabel).toBeVisible();
    });

    test("should show read-only account details section", async ({ page }) => {
      await page.goto("/account");

      await expect(page.getByText("Account Details")).toBeVisible({
        timeout: 15000,
      });

      // Email should be displayed (read-only)
      await expect(page.getByText("Email Address")).toBeVisible();
      await expect(page.getByText("admin@inspiration-ai.com")).toBeVisible();

      // Role should be displayed
      await expect(page.getByText("Account Role")).toBeVisible();

      // Credits balance
      await expect(page.getByText("Credits Balance")).toBeVisible();
    });

    test("should show shipping address section", async ({ page }) => {
      await page.goto("/account");

      await expect(page.getByText("Shipping Address")).toBeVisible({
        timeout: 15000,
      });

      // Address fields
      await expect(page.getByText("Address Line 1")).toBeVisible();
      await expect(page.getByText("City")).toBeVisible();
      await expect(page.getByText("State")).toBeVisible();
      await expect(page.getByText("ZIP Code")).toBeVisible();
    });

    test("should have Save Changes and Cancel buttons", async ({ page }) => {
      await page.goto("/account");

      await expect(page.getByText("Account Settings")).toBeVisible({
        timeout: 15000,
      });

      await expect(
        page.getByRole("button", { name: /save changes/i })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /cancel/i })
      ).toBeVisible();
    });
  });

  test.describe("Subscriptions Page (/dashboard/subscriptions)", () => {
    test("should load the subscriptions page", async ({ page }) => {
      await page.goto("/dashboard/subscriptions");

      // Page should load without error - wait for content or empty state
      await page.waitForLoadState("networkidle", { timeout: 15000 });

      // The page should not show the login form (we are authenticated)
      await expect(page.locator('input[type="email"]')).not.toBeVisible({
        timeout: 5000,
      });
    });
  });
});
