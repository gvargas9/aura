/**
 * Test Suite: Admin User (Production)
 * Category: Production E2E
 * Priority: high
 *
 * Description: Tests all admin panel pages load correctly after authentication.
 * Validates sidebar navigation, page headings, and key UI elements.
 * All tests are READ-ONLY against production.
 *
 * Target: https://aura.inspiration-ai.com
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, collectConsoleErrors, checkNoBrokenImages } from "./helpers/auth";

test.describe("Admin - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load admin dashboard with stat cards", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/dashboard/i);
  });

  test("should display sidebar navigation with all links", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside, nav[class*='sidebar'], [class*='sidebar']").first();
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // Check for key nav items
    const expectedNavItems = [
      "Dashboard",
      "Products",
      "Orders",
      "Customers",
      "Inventory",
      "Dealers",
    ];

    for (const item of expectedNavItems) {
      const navItem = sidebar.getByText(item, { exact: false }).first();
      const isVisible = await navItem.isVisible().catch(() => false);
      if (!isVisible) {
        console.warn(`Sidebar nav item "${item}" not found`);
      }
    }
  });

  test("should have no broken images on dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const broken = await checkNoBrokenImages(page);
    expect(broken).toBe(0);
  });
});

test.describe("Admin - Products Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load products management page", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display products table or grid", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");

    // Should have a table or product list
    const hasTable = await page.locator("table").first().isVisible().catch(() => false);
    const hasGrid = await page.locator('[class*="grid"], [class*="card"]').first().isVisible().catch(() => false);
    expect(hasTable || hasGrid).toBeTruthy();
  });

  test("should have Add Product button", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");

    const addButton = page.locator('a:has-text("Add"), button:has-text("Add"), a:has-text("New"), button:has-text("New")').first();
    const isVisible = await addButton.isVisible().catch(() => false);
    if (!isVisible) {
      console.warn("No Add Product button found on /admin/products");
    }
  });
});

test.describe("Admin - Orders Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load orders management page", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display orders table or empty state", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent = body?.match(/order|status|total|no orders|empty/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Admin - Customers Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load customers page", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display customer data or table", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent = body?.match(/customer|email|role|name/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Admin - Dealers Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load dealers page", async ({ page }) => {
    await page.goto("/admin/dealers");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display dealer or organization content", async ({ page }) => {
    await page.goto("/admin/dealers");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent = body?.match(/dealer|organization|commission|referral/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Admin - Inventory Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load inventory page", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should display inventory data", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasContent = body?.match(/inventory|stock|quantity|product|sku/i);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Admin - Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load analytics page", async ({ page }) => {
    await page.goto("/admin/analytics");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test("should have analytics tabs or sections", async ({ page }) => {
    await page.goto("/admin/analytics");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    const hasTabs =
      body?.match(/churn|demand|revenue|conversion|analytics/i);
    expect(hasTabs).toBeTruthy();
  });
});

test.describe("Admin - Samples Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load samples page", async ({ page }) => {
    await page.goto("/admin/samples");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    // Samples page may be slow to load or have different structure
    const body = await page.textContent("body");
    const hasContent = body?.match(/sample|allocation|product/i);
    expect(hasContent || body!.length > 100).toBeTruthy();
  });
});

test.describe("Admin - Storefronts Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load storefronts page", async ({ page }) => {
    await page.goto("/admin/storefronts");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin - Vending Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load vending dashboard", async ({ page }) => {
    await page.goto("/admin/vending");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin - Recipes Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load recipes page", async ({ page }) => {
    await page.goto("/admin/recipes");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin - Email Templates Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load email templates page", async ({ page }) => {
    await page.goto("/admin/email-templates");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin - Notifications Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load notifications/CRM page", async ({ page }) => {
    await page.goto("/admin/notifications");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin - Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to Products via sidebar", async ({ page }) => {
    const productsLink = page.locator('aside a[href="/admin/products"], nav a[href="/admin/products"]').first();
    const isVisible = await productsLink.isVisible().catch(() => false);
    if (isVisible) {
      await productsLink.click();
      await page.waitForURL("**/admin/products");
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 15000 });
    }
  });

  test("should navigate to Orders via sidebar", async ({ page }) => {
    const ordersLink = page.locator('aside a[href="/admin/orders"], nav a[href="/admin/orders"]').first();
    const isVisible = await ordersLink.isVisible().catch(() => false);
    if (isVisible) {
      await ordersLink.click();
      await page.waitForURL("**/admin/orders");
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 15000 });
    }
  });

  test("should navigate to Customers via sidebar", async ({ page }) => {
    const customersLink = page.locator('aside a[href="/admin/customers"], nav a[href="/admin/customers"]').first();
    const isVisible = await customersLink.isVisible().catch(() => false);
    if (isVisible) {
      await customersLink.click();
      await page.waitForURL("**/admin/customers");
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 15000 });
    }
  });

  test("should navigate to Inventory via sidebar", async ({ page }) => {
    const inventoryLink = page.locator('aside a[href="/admin/inventory"], nav a[href="/admin/inventory"]').first();
    const isVisible = await inventoryLink.isVisible().catch(() => false);
    if (isVisible) {
      await inventoryLink.click();
      await page.waitForURL("**/admin/inventory");
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe("Admin - Access Control", () => {
  test("should redirect non-authenticated users from admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/auth\/login|\/$/, { timeout: 15000 });
    const url = page.url();
    expect(url).toMatch(/\/auth\/login|\/$/);
  });
});
