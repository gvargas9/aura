/**
 * Test Suite: Promo Codes & Gift Cards API
 * Category: e2e (API)
 * Priority: medium
 *
 * Description: Tests the /api/promo-codes and /api/gift-cards endpoints for
 * authentication protection. These are admin-only endpoints.
 * Prerequisites: Running dev server at localhost:3000.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("Promo Codes API", () => {
  test.describe("GET /api/promo-codes (Unauthenticated)", () => {
    test("should return 401 without authentication", async ({ request }) => {
      const response = await request.get("/api/promo-codes");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  test.describe("POST /api/promo-codes/validate (Unauthenticated)", () => {
    test("should return 401 without authentication", async ({ request }) => {
      const response = await request.post("/api/promo-codes/validate", {
        data: {
          code: "TESTCODE",
          cart_total: 100,
        },
      });
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  test.describe("GET /api/promo-codes (Authenticated as Admin)", () => {
    test("should return promo codes when authenticated as admin", async ({
      page,
    }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[type="email"]', "admin@inspiration-ai.com");
      await page.fill('input[type="password"]', "Inssigma@2");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 15000 });

      const response = await page.request.get("/api/promo-codes");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.items).toBeInstanceOf(Array);
      expect(typeof data.data.total).toBe("number");
      expect(data.data.page).toBe(1);
    });
  });
});

test.describe("Gift Cards API", () => {
  test.describe("GET /api/gift-cards (Unauthenticated)", () => {
    test("should return 401 without authentication", async ({ request }) => {
      const response = await request.get("/api/gift-cards");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  test.describe("GET /api/gift-cards (Authenticated as Admin)", () => {
    test("should return gift cards when authenticated as admin", async ({
      page,
    }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[type="email"]', "admin@inspiration-ai.com");
      await page.fill('input[type="password"]', "Inssigma@2");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 15000 });

      const response = await page.request.get("/api/gift-cards");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.items).toBeInstanceOf(Array);
      expect(typeof data.data.total).toBe("number");
      expect(data.data.page).toBe(1);
    });
  });
});
