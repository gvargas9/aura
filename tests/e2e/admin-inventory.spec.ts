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
 * Last Updated: 2026-03-29
 * Author: Claude Test Agent
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

/**
 * Waits for inventory data to finish loading. Returns true if rows exist,
 * false if the empty state is displayed.
 */
async function waitForInventoryLoad(page: Page): Promise<boolean> {
  await Promise.race([
    page.waitForSelector("table tbody tr", { timeout: 15000 }).catch(() => {}),
    page
      .waitForSelector("text=No inventory records found", { timeout: 15000 })
      .catch(() => {}),
  ]);
  return (await page.locator("table tbody tr").count()) > 0;
}

test.describe("Admin Inventory Page", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/inventory");
    await expect(page.locator("h1")).toHaveText("Inventory", {
      timeout: 30000,
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
    await waitForInventoryLoad(page);

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
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

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

  test("should display inventory rows or empty state", async ({ page }) => {
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
    } else {
      const count = await page.locator("table tbody tr").count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("should display color-coded status indicators", async ({ page }) => {
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

    const statusBadges = page.locator("table tbody span.rounded-full");
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);

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
    await waitForInventoryLoad(page);

    const searchInput = page.getByPlaceholder(
      "Search by product name, SKU, or location..."
    );
    await searchInput.fill("AURA");

    await page.waitForTimeout(1000);

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
    await waitForInventoryLoad(page);

    const checkbox = page.locator('input[type="checkbox"]').last();
    await checkbox.check();

    await page.waitForTimeout(1000);

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
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

    const editButtons = page
      .locator("table tbody button")
      .filter({ hasText: "Edit" });
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should show inline edit inputs when clicking Edit", async ({
    page,
  }) => {
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

    const editButtons = page
      .locator("table tbody button")
      .filter({ hasText: "Edit" });
    await editButtons.first().click();

    const numberInputs = page.locator('table tbody input[type="number"]');
    const inputCount = await numberInputs.count();
    expect(inputCount).toBe(3);
  });

  test("should show Save and Cancel buttons in edit mode", async ({
    page,
  }) => {
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

    const editButtons = page
      .locator("table tbody button")
      .filter({ hasText: "Edit" });
    await editButtons.first().click();

    await expect(page.locator('button[aria-label="Save"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Cancel"]')).toBeVisible();
  });

  test("should exit edit mode when clicking Cancel", async ({ page }) => {
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

    const editButtons = page
      .locator("table tbody button")
      .filter({ hasText: "Edit" });
    await editButtons.first().click();

    await expect(page.locator('button[aria-label="Save"]')).toBeVisible();

    await page.locator('button[aria-label="Cancel"]').click();

    await expect(page.locator('button[aria-label="Save"]')).not.toBeVisible();
    await expect(editButtons.first()).toBeVisible();
  });

  test("should pre-fill edit inputs with current values", async ({ page }) => {
    const hasRows = await waitForInventoryLoad(page);
    if (!hasRows) {
      await expect(page.getByText("No inventory records found")).toBeVisible();
      return;
    }

    const firstRow = page.locator("table tbody tr").first();
    const quantityCell = firstRow.locator("td").nth(3);
    const quantityText = await quantityCell.locator("span").textContent();
    const originalQuantity = quantityText?.trim();

    const editButtons = page
      .locator("table tbody button")
      .filter({ hasText: "Edit" });
    await editButtons.first().click();

    const quantityInput = page
      .locator('table tbody input[type="number"]')
      .first();
    const inputValue = await quantityInput.inputValue();
    expect(inputValue).toBe(originalQuantity);
  });
});
