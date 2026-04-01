/**
 * Test Suite: V1 Partner API
 * Category: e2e (API)
 * Priority: high
 *
 * Description: Tests the /api/v1 partner API endpoints for auth protection.
 * All endpoints require a valid X-API-Key header. We verify that requests
 * without an API key are rejected with 401.
 * Prerequisites: Running dev server at localhost:3000.
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("V1 Partner API", () => {
  test.describe("GET /api/v1/products", () => {
    test("should return 401 without X-API-Key header", async ({ request }) => {
      const response = await request.get("/api/v1/products");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });

  test.describe("POST /api/v1/orders", () => {
    test("should return 401 without X-API-Key header", async ({ request }) => {
      const response = await request.post("/api/v1/orders", {
        data: {
          storefront_slug: "test-store",
          items: [{ product_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
          customer_email: "test@example.com",
        },
      });
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });

  test.describe("GET /api/v1/storefront/:slug", () => {
    test("should return 401 without X-API-Key header", async ({ request }) => {
      const response = await request.get("/api/v1/storefront/nonexistent");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });
});
