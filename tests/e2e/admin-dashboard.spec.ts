/**
 * Test Suite: Admin Dashboard
 * Category: e2e
 * Priority: high
 *
 * Description: Tests for the admin dashboard page including stat cards,
 * recent orders, quick links, sidebar navigation, and access control.
 *
 * Prerequisites: Admin user (admin@inspiration-ai.com) must exist in the database.
 * Test Data: Seed data with orders, customers, subscriptions.
 *
 * Last Updated: 2026-03-27
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("should load the admin dashboard page", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Dashboard");
    await expect(
      page.getByText("Overview of your Aura platform performance")
    ).toBeVisible();
  });

  test("should display all four stat cards", async ({ page }) => {
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByText("Customers")).toBeVisible();
    await expect(page.getByText("Active Subscriptions")).toBeVisible();
  });

  test("should show stat card values as numbers or currency", async ({
    page,
  }) => {
    // Each stat card has a bold value - verify they render with numeric content
    const statCards = page.locator(".grid.grid-cols-2 > div");
    const cardCount = await statCards.count();
    expect(cardCount).toBe(4);

    // Total Revenue should display a dollar amount
    const revenueCard = statCards.nth(0);
    const revenueValue = revenueCard.locator("p.text-2xl");
    await expect(revenueValue).toBeVisible();
    const revenueText = await revenueValue.textContent();
    expect(revenueText).toMatch(/\$/);
  });

  test("should display recent orders section", async ({ page }) => {
    await expect(page.getByText("Recent Orders")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View All" }).or(
        page.getByRole("button", { name: "View All" })
      )
    ).toBeVisible();
  });

  test("should show recent orders table with correct columns", async ({
    page,
  }) => {
    const ordersSection = page.locator("table").last();
    // The table has Order, Status, Total columns
    await expect(page.getByRole("columnheader", { name: "Order" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Total" })).toBeVisible();
  });

  test("should display sidebar navigation with all links", async ({
    page,
  }) => {
    const sidebar = page.locator("aside nav");
    await expect(sidebar).toBeVisible();

    const expectedLinks = [
      "Dashboard",
      "Products",
      "Orders",
      "Customers",
      "Subscriptions",
      "Inventory",
      "Dealers",
      "Settings",
    ];

    for (const linkText of expectedLinks) {
      await expect(sidebar.getByText(linkText, { exact: true })).toBeVisible();
    }
  });

  test("should highlight Dashboard as active in sidebar", async ({ page }) => {
    const dashboardLink = page.locator('aside nav a[href="/admin"]');
    await expect(dashboardLink).toBeVisible();
    // Active link has the aura-primary color class
    await expect(dashboardLink).toHaveClass(/text-aura-primary/);
  });

  test("should show admin badge in header", async ({ page }) => {
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  });

  test("should show Aura logo link in header", async ({ page }) => {
    const logo = page.locator('header a[href="/admin"]').filter({ hasText: "Aura" });
    await expect(logo).toBeVisible();
  });

  test("should have View Store link in header", async ({ page }) => {
    await expect(page.getByText("View Store")).toBeVisible();
  });

  test("should navigate to products page via sidebar", async ({ page }) => {
    await page.locator('aside nav a[href="/admin/products"]').click();
    await page.waitForURL("**/admin/products");
    await expect(page.locator("h1")).toHaveText("Products");
  });

  test("should navigate to orders page via sidebar", async ({ page }) => {
    await page.locator('aside nav a[href="/admin/orders"]').click();
    await page.waitForURL("**/admin/orders");
    await expect(page.locator("h1")).toHaveText("Orders");
  });
});

test.describe("Admin Dashboard - Access Control", () => {
  test("should redirect non-authenticated users away from admin", async ({
    page,
  }) => {
    // Go directly to /admin without logging in
    await page.goto("/admin");
    // Should redirect to login page
    await page.waitForURL(/\/auth\/login|\/$/,{ timeout: 15000 });
    const url = page.url();
    expect(url).toMatch(/\/auth\/login|\/$/);
  });
});
