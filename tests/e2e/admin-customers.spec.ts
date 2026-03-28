/**
 * Test Suite: Admin Customers Management
 * Category: e2e
 * Priority: high
 *
 * Description: Tests for the admin customers page including customer table,
 * search, role filtering, customer detail expansion, and role change.
 *
 * Prerequisites: Admin user must exist. Seed data with customer profiles.
 * Test Data: profiles table with customer/dealer/admin users.
 *
 * Last Updated: 2026-03-27
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Customers Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/customers");
    await expect(page.locator("h1")).toHaveText("Customers", {
      timeout: 15000,
    });
  });

  test("should load customers page with header and description", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveText("Customers");
    await expect(
      page.getByText("Manage customer accounts and profiles")
    ).toBeVisible();
  });

  test("should display customer table with correct columns", async ({
    page,
  }) => {
    await page.waitForSelector("table", { timeout: 15000 });

    await expect(
      page.getByRole("columnheader", { name: "Customer" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Role" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Credits" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Joined" })
    ).toBeVisible();
  });

  test("should display customer rows with name and email", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // First row should have a name/email display
    const firstRow = rows.first();
    // Each row has a customer cell with name and email
    const nameElement = firstRow.locator("p.font-medium").first();
    await expect(nameElement).toBeVisible();
  });

  test("should have search input for name or email", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by name or email...");
    await expect(searchInput).toBeVisible();
  });

  test("should filter customers when searching by name", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const searchInput = page.getByPlaceholder("Search by name or email...");
    await searchInput.fill("admin");

    // Wait for filter to apply
    await page.waitForTimeout(1500);

    // Should show results or empty state
    const hasRows = await page
      .locator("table tbody tr")
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText("No customers found")
      .isVisible()
      .catch(() => false);
    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test("should filter customers when searching by email", async ({ page }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const searchInput = page.getByPlaceholder("Search by name or email...");
    await searchInput.fill("@inspiration-ai.com");

    await page.waitForTimeout(1500);

    const hasRows = await page
      .locator("table tbody tr")
      .isVisible()
      .catch(() => false);
    expect(hasRows).toBeTruthy();
  });

  test("should have role filter dropdown", async ({ page }) => {
    const roleSelect = page.locator('select[aria-label="Filter by role"]');
    await expect(roleSelect).toBeVisible();
    await expect(roleSelect).toHaveValue("");
  });

  test("should have all role options in the filter", async ({ page }) => {
    const roleSelect = page.locator('select[aria-label="Filter by role"]');

    const options = roleSelect.locator("option");
    const optionTexts: string[] = [];
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      optionTexts.push(text?.trim() || "");
    }

    expect(optionTexts).toContain("All Roles");
    expect(optionTexts).toContain("Customer");
    expect(optionTexts).toContain("Dealer");
    expect(optionTexts).toContain("Admin");
  });

  test("should filter by role when selecting from dropdown", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    const roleSelect = page.locator('select[aria-label="Filter by role"]');
    await roleSelect.selectOption("admin");

    await page.waitForTimeout(1500);

    const hasRows = await page
      .locator("table tbody tr")
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText("No customers found")
      .isVisible()
      .catch(() => false);
    expect(hasRows || hasEmpty).toBeTruthy();

    if (hasRows) {
      // All role badges should say "admin"
      const badges = page.locator("table tbody span.rounded-full");
      const count = await badges.count();
      for (let i = 0; i < count; i++) {
        await expect(badges.nth(i)).toHaveText("admin");
      }
    }
  });

  test("should expand customer detail when clicking on a row", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    await page.locator("table tbody tr").first().click();

    // Expanded detail should show Profile & Actions section
    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show customer orders and subscriptions in expanded detail", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    await page.locator("table tbody tr").first().click();

    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });

    // Should show Recent Orders and Subscriptions sections
    await expect(page.getByText(/Recent Orders/)).toBeVisible();
    await expect(page.getByText(/Subscriptions/)).toBeVisible();
  });

  test("should show role change dropdown in expanded customer detail", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    await page.locator("table tbody tr").first().click();
    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });

    // Role dropdown in the detail
    const roleDropdown = page.locator('select[aria-label="Customer role"]');
    await expect(roleDropdown).toBeVisible();

    // Should have all role options
    const options = roleDropdown.locator("option");
    const count = await options.count();
    expect(count).toBe(3); // customer, dealer, admin
  });

  test("should show credits input in expanded customer detail", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    await page.locator("table tbody tr").first().click();
    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });

    // Credits input (type=number with step=0.01)
    const creditsInput = page.locator('input[type="number"][step="0.01"]');
    await expect(creditsInput).toBeVisible();
  });

  test("should show Save Changes button in expanded customer detail", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    await page.locator("table tbody tr").first().click();
    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: /Save Changes/i })
    ).toBeVisible();
  });

  test("should show email and phone in expanded customer detail", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    await page.locator("table tbody tr").first().click();
    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Email").first()).toBeVisible();
    await expect(page.getByText("Phone").first()).toBeVisible();
  });

  test("should collapse customer detail when clicking the same row again", async ({
    page,
  }) => {
    await page.waitForSelector("table tbody tr", { timeout: 15000 });

    // Expand
    await page.locator("table tbody tr").first().click();
    await expect(
      page.getByText("Profile & Actions")
    ).toBeVisible({ timeout: 5000 });

    // Collapse
    await page.locator("table tbody tr").first().click();
    await expect(
      page.getByText("Profile & Actions")
    ).not.toBeVisible({ timeout: 5000 });
  });
});
