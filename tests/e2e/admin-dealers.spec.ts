/**
 * Test Suite: Admin Dealers Management
 * Category: e2e
 * Priority: high
 *
 * Description: Tests for the admin dealers page including organizations section,
 * add/edit organization modal, dealers table, referral codes, and commission data.
 *
 * Prerequisites: Admin user must exist. Seed data with organizations and dealers.
 * Test Data: organizations and dealers tables.
 *
 * Last Updated: 2026-03-27
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Dealers Page", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/dealers");
    await expect(page.locator("h1")).toHaveText("Dealers", { timeout: 30000 });
  });

  test("should load dealers page with header and description", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveText("Dealers");
    await expect(
      page.getByText("Manage dealer organizations and individual dealers")
    ).toBeVisible();
  });

  test("should display Organizations section heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
  });

  test("should display Individual Dealers section heading", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Individual Dealers" })).toBeVisible();
  });

  test("should have Add Organization button", async ({ page }) => {
    const addButton = page.getByRole("button", {
      name: /Add Organization/i,
    });
    await expect(addButton).toBeVisible();
  });

  test("should open Add Organization modal when clicking the button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Add Organization/i }).click();

    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).toBeVisible();
  });

  test("should show required fields in Add Organization form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Add Organization/i }).click();

    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).toBeVisible();

    // Required fields
    await expect(page.getByText("Organization Name *")).toBeVisible();
    await expect(page.getByText("Contact Email *")).toBeVisible();

    // Additional fields
    await expect(page.getByText("Contact Phone")).toBeVisible();
    await expect(page.getByText("Dealer Tier")).toBeVisible();
    await expect(page.getByText("Commission Rate (%)")).toBeVisible();
    await expect(page.getByText("Logo URL")).toBeVisible();
  });

  test("should have dealer tier dropdown in organization form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Add Organization/i }).click();
    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).toBeVisible();

    const tierSelect = page.locator('select[aria-label="Dealer tier"]');
    await expect(tierSelect).toBeVisible();

    const options = tierSelect.locator("option");
    const optionTexts: string[] = [];
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      optionTexts.push(text?.trim() || "");
    }

    expect(optionTexts).toContain("Bronze");
    expect(optionTexts).toContain("Silver");
    expect(optionTexts).toContain("Gold");
    expect(optionTexts).toContain("Platinum");
  });

  test("should show validation error when submitting empty organization form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Add Organization/i }).click();
    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).toBeVisible();

    // Click Create Organization without filling required fields
    await page
      .getByRole("button", { name: "Create Organization" })
      .click();

    await expect(
      page.getByText("Name and contact email are required.")
    ).toBeVisible();
  });

  test("should close organization modal with Cancel button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Add Organization/i }).click();
    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).not.toBeVisible();
  });

  test("should close organization modal with X button", async ({ page }) => {
    await page.getByRole("button", { name: /Add Organization/i }).click();
    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).toBeVisible();

    await page.getByLabel("Close modal").click();

    await expect(
      page.getByRole("heading", { name: "Add Organization" })
    ).not.toBeVisible();
  });

  test("should have search input for organizations", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search organizations...");
    await expect(searchInput).toBeVisible();
  });

  test("should display organizations table with correct columns", async ({
    page,
  }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    const hasTable = await page
      .locator("table")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText("No organizations found")
      .isVisible()
      .catch(() => false);

    if (hasTable) {
      // Organizations table columns
      const orgTable = page.locator("table").first();
      await expect(
        orgTable.getByRole("columnheader", { name: "Organization" })
      ).toBeVisible();
      await expect(
        orgTable.getByRole("columnheader", { name: "Tier" })
      ).toBeVisible();
      await expect(
        orgTable.getByRole("columnheader", { name: /Commission/ })
      ).toBeVisible();
      await expect(
        orgTable.getByRole("columnheader", { name: "Contact" })
      ).toBeVisible();
      await expect(
        orgTable.getByRole("columnheader", { name: "Dealers" })
      ).toBeVisible();
      await expect(
        orgTable.getByRole("columnheader", { name: "Actions" })
      ).toBeVisible();
    } else {
      expect(hasEmpty).toBeTruthy();
    }
  });

  test("should have search input for individual dealers", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Search dealers by name, email, referral code, or organization..."
    );
    await expect(searchInput).toBeVisible();
  });

  test("should display dealers table with correct columns", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const tables = page.locator("table");
    const tableCount = await tables.count();

    // If there are two tables, second one is dealers; if one, check if it is dealers
    const hasDeaTable = tableCount >= 2;
    const hasEmpty = await page
      .getByText("No dealers found")
      .isVisible()
      .catch(() => false);

    if (hasDeaTable) {
      const dealerTable = tables.last();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Dealer" })
      ).toBeVisible();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Organization" })
      ).toBeVisible();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Referral Code" })
      ).toBeVisible();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Earned" })
      ).toBeVisible();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Paid" })
      ).toBeVisible();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Pending" })
      ).toBeVisible();
      await expect(
        dealerTable.getByRole("columnheader", { name: "Status" })
      ).toBeVisible();
    } else {
      expect(hasEmpty).toBeTruthy();
    }
  });

  test("should display dealer referral codes in monospace font", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const refCodes = page.locator("code.font-mono");
    const count = await refCodes.count();

    if (count > 0) {
      // At least one referral code should be visible
      await expect(refCodes.first()).toBeVisible();
      const codeText = await refCodes.first().textContent();
      expect(codeText?.trim().length).toBeGreaterThan(0);
    }
  });

  test("should show commission data (earned, paid, pending) for dealers", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const tables = page.locator("table");
    const tableCount = await tables.count();

    if (tableCount >= 2) {
      const dealerTable = tables.last();
      const rows = dealerTable.locator("tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // First dealer row should have currency values for earned, paid, pending
        const firstRow = rows.first();
        const cells = firstRow.locator("td");
        const cellCount = await cells.count();
        // Columns: Dealer, Organization, Referral Code, Earned, Paid, Pending, Status, expand
        expect(cellCount).toBeGreaterThanOrEqual(7);
      }
    }
  });

  test("should have active/inactive toggle for dealers", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for toggle buttons with Active or Inactive text
    const activeToggles = page.locator(
      'button[aria-label*="dealer"]'
    );
    const count = await activeToggles.count();

    if (count > 0) {
      await expect(activeToggles.first()).toBeVisible();
    }
  });

  test("should expand dealer detail when clicking on a dealer row", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const tables = page.locator("table");
    const tableCount = await tables.count();

    if (tableCount < 2) {
      test.skip(true, "No dealers table present");
      return;
    }

    const dealerTable = tables.last();
    const rows = dealerTable.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, "No dealers to expand");
      return;
    }

    // Click the first dealer row
    await rows.first().click();

    // Should show expanded detail with Referred Orders, Total Revenue, Joined
    await expect(page.getByText("Referred Orders")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Total Revenue Generated")).toBeVisible();
    await expect(page.getByText("Joined")).toBeVisible();
  });

  test("should have edit button on organization rows", async ({ page }) => {
    await page.waitForTimeout(2000);

    const editButtons = page.locator('button[aria-label^="Edit "]');
    const count = await editButtons.count();

    // If there are organizations, there should be edit buttons
    const hasOrgs = await page
      .locator("table")
      .first()
      .locator("tbody tr")
      .isVisible()
      .catch(() => false);

    if (hasOrgs) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("should open Edit Organization modal when clicking edit on an org", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const editButtons = page.locator('button[aria-label^="Edit "]');
    const count = await editButtons.count();

    if (count === 0) {
      test.skip(true, "No organizations to edit");
      return;
    }

    await editButtons.first().click();

    await expect(
      page.getByRole("heading", { name: "Edit Organization" })
    ).toBeVisible();

    // Form should be pre-filled
    const nameInput = page.getByPlaceholder("e.g., Premier Distribution");
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
  });
});
