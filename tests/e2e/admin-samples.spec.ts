/**
 * Test Suite: Admin Samples Page
 * Category: e2e (UI)
 * Priority: medium
 *
 * Description: Tests the admin samples management page at /admin/samples.
 * Verifies page loads, heading is present, allocation form elements exist,
 * and the sidebar navigation includes the Samples link.
 * Prerequisites: Running dev server at localhost:3000, admin user seeded.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Samples Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load /admin/samples with heading", async ({ page }) => {
    await page.goto("/admin/samples");

    await expect(
      page.getByRole("heading", { name: /samples/i })
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByText("Allocate and track product samples")
    ).toBeVisible();
  });

  test("should display summary stat cards", async ({ page }) => {
    await page.goto("/admin/samples");

    await expect(page.getByText("Total Allocations")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Total Samples")).toBeVisible();
    await expect(page.getByText("Distributed")).toBeVisible();
  });

  test("should show allocation form when clicking Allocate Samples button", async ({
    page,
  }) => {
    await page.goto("/admin/samples");

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: /samples/i })
    ).toBeVisible({ timeout: 15000 });

    // Click the Allocate Samples button
    await page.getByRole("button", { name: /allocate samples/i }).click();

    // Check form elements are visible
    await expect(page.getByText("New Sample Allocation")).toBeVisible();
    await expect(page.getByText("Product *")).toBeVisible();
    await expect(page.getByText("Dealer *")).toBeVisible();
    await expect(page.getByText("Quantity *")).toBeVisible();
  });

  test("should have Samples link in admin sidebar", async ({ page }) => {
    await page.goto("/admin/samples");

    // The sidebar should contain a Samples nav link
    const samplesLink = page.locator('a[href="/admin/samples"]');
    await expect(samplesLink).toBeVisible({ timeout: 15000 });
  });
});
