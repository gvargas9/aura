/**
 * Test Suite: Admin Orders Management
 * Category: e2e
 * Priority: high
 *
 * Description: Tests for the admin orders page including orders table,
 * status filtering, order expansion, status updates, and tracking input.
 *
 * Prerequisites: Admin user must exist. Seed data with orders.
 * Test Data: aura_orders table with seed orders.
 *
 * Last Updated: 2026-03-27
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Orders Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders");
    await expect(page.locator("h1")).toHaveText("Orders", { timeout: 15000 });
  });

  test("should load orders page with header and description", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveText("Orders");
    await expect(
      page.getByText("Manage and track all customer orders")
    ).toBeVisible();
  });

  test("should display orders table with correct columns", async ({
    page,
  }) => {
    // Wait for table or empty state
    const hasTable = await page
      .locator("table")
      .isVisible({ timeout: 15000 })
      .catch(() => false);
    const hasEmpty = await page
      .getByText("No orders found")
      .isVisible()
      .catch(() => false);

    if (hasTable) {
      await expect(
        page.getByRole("columnheader", { name: "Order" })
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Customer" })
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Status" })
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Total" })
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Items" })
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Date" })
      ).toBeVisible();
    } else {
      expect(hasEmpty).toBeTruthy();
    }
  });

  test("should have search input for order number", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by order number...");
    await expect(searchInput).toBeVisible();
  });

  test("should have status filter dropdown", async ({ page }) => {
    const statusSelect = page.locator('select[aria-label="Filter by status"]');
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toHaveValue("");
  });

  test("should have all status options in the filter", async ({ page }) => {
    const statusSelect = page.locator('select[aria-label="Filter by status"]');

    const options = statusSelect.locator("option");
    const optionTexts: string[] = [];
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      optionTexts.push(text?.trim() || "");
    }

    expect(optionTexts).toContain("All Statuses");
    expect(optionTexts).toContain("Pending");
    expect(optionTexts).toContain("Processing");
    expect(optionTexts).toContain("Shipped");
    expect(optionTexts).toContain("Delivered");
    expect(optionTexts).toContain("Cancelled");
  });

  test("should filter orders by status when selecting from dropdown", async ({
    page,
  }) => {
    const statusSelect = page.locator('select[aria-label="Filter by status"]');
    await statusSelect.selectOption("pending");

    // Wait for filter to apply
    await page.waitForTimeout(1500);

    // Either orders with pending status show, or no orders found
    const hasTable = await page.locator("table tbody tr").isVisible().catch(() => false);
    const hasEmpty = await page.getByText("No orders found").isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();

    if (hasTable) {
      // All visible status badges should say "pending"
      const badges = page.locator("table tbody span.rounded-full");
      const count = await badges.count();
      for (let i = 0; i < count; i++) {
        await expect(badges.nth(i)).toHaveText("pending");
      }
    }
  });

  test("should expand order detail when clicking on an order row", async ({
    page,
  }) => {
    // Wait for table data
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database to test expansion");
      return;
    }

    // Click the first order row
    await page.locator("table tbody tr").first().click();

    // The expanded detail should be visible with "Order Items", "Shipping Address", "Update Order"
    await expect(page.getByText("Order Items")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Shipping Address")).toBeVisible();
    await expect(page.getByText("Update Order")).toBeVisible();
  });

  test("should show status dropdown in expanded order detail", async ({
    page,
  }) => {
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database");
      return;
    }

    await page.locator("table tbody tr").first().click();

    // Wait for expansion
    await expect(page.getByText("Update Order")).toBeVisible({ timeout: 5000 });

    // Status dropdown in the detail section
    const statusDropdown = page.locator('select[aria-label="Order status"]');
    await expect(statusDropdown).toBeVisible();
  });

  test("should show tracking number input in expanded order detail", async ({
    page,
  }) => {
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database");
      return;
    }

    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Update Order")).toBeVisible({ timeout: 5000 });

    // Tracking number input
    const trackingInput = page.getByPlaceholder("Enter tracking number");
    await expect(trackingInput).toBeVisible();
  });

  test("should show internal notes textarea in expanded order detail", async ({
    page,
  }) => {
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database");
      return;
    }

    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Update Order")).toBeVisible({ timeout: 5000 });

    const notesTextarea = page.getByPlaceholder("Add internal notes...");
    await expect(notesTextarea).toBeVisible();
  });

  test("should show Save Changes button in expanded order detail", async ({
    page,
  }) => {
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database");
      return;
    }

    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Update Order")).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: /Save Changes/i })
    ).toBeVisible();
  });

  test("should show order financial breakdown in expanded detail", async ({
    page,
  }) => {
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database");
      return;
    }

    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Order Items")).toBeVisible({ timeout: 5000 });

    // Should show Subtotal and Total in the breakdown
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.locator("td").getByText("Total").last()).toBeVisible();
  });

  test("should collapse expanded order when clicking the same row again", async ({
    page,
  }) => {
    const hasTable = await page
      .locator("table tbody tr")
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasTable) {
      test.skip(true, "No orders in the database");
      return;
    }

    // Expand
    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Order Items")).toBeVisible({ timeout: 5000 });

    // Collapse by clicking same row
    await page.locator("table tbody tr").first().click();
    await expect(page.getByText("Order Items")).not.toBeVisible({ timeout: 5000 });
  });
});
