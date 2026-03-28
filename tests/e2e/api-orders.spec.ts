/**
 * Test Suite: Orders & Categories API
 * Category: e2e (API)
 * Priority: high
 *
 * Description: Tests the /api/orders endpoint (authenticated) and /api/categories
 * endpoint (public). Verifies auth protection and correct response shapes.
 * Prerequisites: Running dev server at localhost:3000, admin user seeded in Supabase.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("Orders API", () => {
  test.describe("GET /api/orders (Unauthenticated)", () => {
    test("should return 401 without authentication", async ({ request }) => {
      const response = await request.get("/api/orders");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/authentication required/i);
    });
  });

  test.describe("GET /api/orders (Authenticated)", () => {
    test("should return success with orders data when authenticated", async ({
      page,
    }) => {
      // Login first to establish session cookies
      await page.goto("/auth/login");
      await page.fill('input[type="email"]', "admin@inspiration-ai.com");
      await page.fill('input[type="password"]', "Inssigma@2");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 15000 });

      // Use page.request which carries session cookies
      const response = await page.request.get("/api/orders");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.items).toBeInstanceOf(Array);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(20);
      expect(typeof data.data.total).toBe("number");
      expect(typeof data.data.totalPages).toBe("number");
    });

    test("should support pagination parameters", async ({ page }) => {
      await page.goto("/auth/login");
      await page.fill('input[type="email"]', "admin@inspiration-ai.com");
      await page.fill('input[type="password"]', "Inssigma@2");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 15000 });

      const response = await page.request.get(
        "/api/orders?page=1&pageSize=5"
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(5);
      expect(data.data.items.length).toBeLessThanOrEqual(5);
    });
  });
});

test.describe("Categories API", () => {
  test.describe("GET /api/categories (Public)", () => {
    test("should return categories array without authentication", async ({
      request,
    }) => {
      const response = await request.get("/api/categories");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test("should return categories with expected fields", async ({
      request,
    }) => {
      const response = await request.get("/api/categories");
      const data = await response.json();

      const category = data.data[0];
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.slug).toBeDefined();
      expect(typeof category.is_active).toBe("boolean");
    });
  });
});
