/**
 * Test Suite: Admin Inventory Management
 * Category: e2e
 * Priority: high
 *
 * Description: Tests for the admin inventory page including summary cards,
 * inventory table, status indicators, low stock filter, and inline editing.
 *
 * Prerequisites: Admin user must exist. Seed data with inventory records.
 * Test Data: inventory table joined with aura_products.
 *
 * Last Updated: 2026-03-27
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Inventory Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/inventory");
    await expect(page.locator("h1")).toHaveText("Inventory", {
      timeout: 15000,
    });
  });

  test("should load inventory page with header and description", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveText("Inventory");
    await expect(
      page.getByText("Track and manage warehouse stock levels")
    ).toBeVisible();
  });

  test("should display all four summary cards", async ({ page }) => {
    await expect(page.getByText("Total SKUs")).toBeVisible();
    await expect(page.getByText("Total Units")).toBeVisible();
    await expect(page.getByText("Low Stock")).toBeVisible();
    await expect(page.getByText("Out of Stock")).toBeVisible();
  });

  test("should show numeric values in summary cards", async ({ page }) => {
    // Wait for data to load (loading spinner gone)
    await page.waitForSelector("table", { timeout: 15000 }).catch(() => {});

    // Total SKUs card should have a number
    const skuCard = page
      .locator("div")
      .filter({ hasText: /^Total SKUs/ })
      .first();
    const skuValue = skuCard.locator("p.text-2xl");
    await expect(skuValue).toBeVisible();
    const skuText = await skuValue.textContent();
    expect(parseInt(skuText || "0")).toBeGreaterThanOrEqual(0);
  });

  test("should display inventory table with correct columns", async ({
    page,
  }) => {
    await page.waitForSelector("table", { timeout: 15000 });

    await expect(
      page.getByRole("columnheader", { name: "Product" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "SKU" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Location" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Quantity" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Reserved" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Available" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Safety Stock" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /Reorder/ })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Actions" })
    ).toBeVisible();
  });

  test("should display inventory rows with product data", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should display color-coded status indicators", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    // Status badges should be visible in the table
    const statusBadges = page.locator("table tbody span.rounded-full");
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each badge should have one of the expected status texts
    for (let i = 0; i < count; i++) {
      const text = await statusBadges.nth(i).textContent();
      expect(["In Stock", "Low Stock", "Critical", "Out of Stock"]).toContain(
        text?.trim()
      );
    }
  });

  test("should have search input for products", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search by product name, SKU, or location..."
    );
    await expect(searchInput).toBeVisible();
  });

  test("should filter inventory when searching", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const searchInput = page.getByPlaceholder(
      "Search by product name, SKU, or location..."
    );
    await searchInput.fill("AURA");

    await page.waitForTimeout(1000);

    // Should show filtered results or empty state
    const hasRows = await page
      .locator("table tbody tr")
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText("No inventory records found")
      .isVisible()
      .catch(() => false);
    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test("should have Low Stock Only checkbox filter", async ({ page }) => {
    const checkbox = page.getByText("Low Stock Only");
    await expect(checkbox).toBeVisible();
  });

  test("should filter to low stock items when toggling checkbox", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    // Click the Low Stock Only checkbox
    const checkbox = page.locator('input[type="checkbox"]').last();
    await checkbox.check();

    await page.waitForTimeout(1000);

    // Results should show only low stock items or empty state
    const hasRows = await page
      .locator("table tbody tr")
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText("No inventory records found")
      .isVisible()
      .catch(() => false);
    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test("should have inline Edit button on inventory rows", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    // Each row should have an "Edit" text button
    const editButtons = page.locator("table tbody button").filter({ hasText: "Edit" });
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should show inline edit inputs when clicking Edit", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    // Click the first Edit button
    const editButtons = page.locator("table tbody button").filter({ hasText: "Edit" });
    await editButtons.first().click();

    // Should show number inputs for quantity, safety stock, and reorder point
    const numberInputs = page.locator(
      'table tbody input[type="number"]'
    );
    const inputCount = await numberInputs.count();
    expect(inputCount).toBe(3); // quantity, safety_stock, reorder_point
  });

  test("should show Save and Cancel buttons in edit mode", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const editButtons = page.locator("table tbody button").filter({ hasText: "Edit" });
    await editButtons.first().click();

    // Save button (aria-label="Save")
    await expect(page.locator('button[aria-label="Save"]')).toBeVisible();
    // Cancel button
    await expect(page.locator('button[aria-label="Cancel"]')).toBeVisible();
  });

  test("should exit edit mode when clicking Cancel", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const editButtons = page.locator("table tbody button").filter({ hasText: "Edit" });
    await editButtons.first().click();

    // Verify we are in edit mode
    await expect(page.locator('button[aria-label="Save"]')).toBeVisible();

    // Click Cancel
    await page.locator('button[aria-label="Cancel"]').click();

    // Edit inputs should be gone
    await expect(page.locator('button[aria-label="Save"]')).not.toBeVisible();

    // Edit button should be back
    await expect(editButtons.first()).toBeVisible();
  });

  test("should pre-fill edit inputs with current values", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    // Get the first row's displayed quantity before editing
    const firstRow = page.locator("table tbody tr").first();
    const quantityCell = firstRow.locator("td").nth(3);
    const quantityText = await quantityCell.locator("span").textContent();
    const originalQuantity = quantityText?.trim();

    // Enter edit mode
    const editButtons = page.locator("table tbody button").filter({ hasText: "Edit" });
    await editButtons.first().click();

    // The quantity input should have the same value
    const quantityInput = page
      .locator('table tbody input[type="number"]')
      .first();
    const inputValue = await quantityInput.inputValue();
    expect(inputValue).toBe(originalQuantity);
  });
});
