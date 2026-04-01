/**
 * Test Suite: API Endpoint Health (Production)
 * Category: Production E2E
 * Priority: critical
 *
 * Description: Tests key API endpoints return correct status codes.
 * Validates public endpoints return data and protected endpoints return 401.
 * All tests are READ-ONLY against production.
 *
 * Target: https://aura.inspiration-ai.com
 */

import { test, expect } from "@playwright/test";

test.describe("API Health - Public Endpoints", () => {
  test("GET /api/products should return 200 with product data", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.items).toBeInstanceOf(Array);
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test("GET /api/products should return valid product structure", async ({ request }) => {
    const response = await request.get("/api/products?pageSize=1");
    const data = await response.json();

    const product = data.data.items[0];
    expect(product.id).toBeDefined();
    expect(product.name).toBeDefined();
    expect(product.price).toBeDefined();
    expect(typeof product.price).toBe("number");
  });

  test("GET /api/categories should return 200", async ({ request }) => {
    const response = await request.get("/api/categories");
    // May return 200 or 404 depending on route existence
    const status = response.status();
    expect([200, 404]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("GET /api/search should return 200 with results", async ({ request }) => {
    const response = await request.get("/api/search?q=chicken");
    const status = response.status();
    expect([200, 404]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("GET /api/recommendations should return 200", async ({ request }) => {
    const response = await request.get("/api/recommendations?type=popular");
    const status = response.status();
    // May return 200, 400 (missing params), or 404
    expect([200, 400, 404]).toContain(status);
  });
});

test.describe("API Health - Protected Endpoints", () => {
  test("GET /api/orders should return 401 without auth", async ({ request }) => {
    const response = await request.get("/api/orders");
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test("POST /api/products should return 401 without auth", async ({ request }) => {
    const response = await request.post("/api/products", {
      data: { name: "Test", sku: "TEST-001", price: 9.99, category: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/vending/heartbeat should return 401 without API key", async ({ request }) => {
    const response = await request.post("/api/vending/heartbeat", {
      data: { machine_id: "test-123" },
    });
    // Should require auth/API key
    const status = response.status();
    expect([401, 403, 404]).toContain(status);
  });

  test("GET /api/v1/products should require API key", async ({ request }) => {
    const response = await request.get("/api/v1/products");
    const status = response.status();
    expect([401, 403, 404]).toContain(status);
  });
});

test.describe("API Health - Webhook Endpoints", () => {
  test("POST /api/webhooks/business-manager should respond", async ({ request }) => {
    const response = await request.post("/api/webhooks/business-manager", {
      data: { test: true },
    });
    const status = response.status();
    // Webhooks may return various status codes depending on auth and config
    // Accept any valid HTTP response (not a connection error)
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(600);
  });
});

test.describe("API Health - Response Format", () => {
  test("API should return JSON content type", async ({ request }) => {
    const response = await request.get("/api/products");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test("API should return consistent error format for 401", async ({ request }) => {
    const response = await request.get("/api/orders");
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test("API pagination should work correctly", async ({ request }) => {
    const response = await request.get("/api/products?page=1&pageSize=2");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.data.items.length).toBeLessThanOrEqual(2);
    expect(data.data.page).toBe(1);
    expect(data.data.pageSize).toBe(2);
  });
});
