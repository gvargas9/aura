/**
 * Test Suite: Vending Machine API
 * Category: e2e (API)
 * Priority: high
 *
 * Description: Tests the vending machine REST API endpoints for auth protection.
 * Since no vending machines exist in the test environment, we verify that all
 * endpoints correctly reject unauthenticated requests with 401.
 * Prerequisites: Running dev server at localhost:3000.
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("Vending Machine API", () => {
  test.describe("POST /api/vending/heartbeat", () => {
    test("should return 401 without X-Vending-API-Key header", async ({
      request,
    }) => {
      const response = await request.post("/api/vending/heartbeat", {
        data: { status: "online" },
      });
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });

  test.describe("POST /api/vending/transaction", () => {
    test("should return 401 without X-Vending-API-Key header", async ({
      request,
    }) => {
      const response = await request.post("/api/vending/transaction", {
        data: {
          slot_number: 1,
          payment_method: "card",
          amount: 5.99,
        },
      });
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });

  test.describe("GET /api/vending/inventory/:machineId", () => {
    test("should return 401 without X-Vending-API-Key header", async ({
      request,
    }) => {
      const response = await request.get("/api/vending/inventory/invalid-id");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });

  test.describe("POST /api/vending/restock", () => {
    test("should return 401 without X-Vending-API-Key header", async ({
      request,
    }) => {
      const response = await request.post("/api/vending/restock", {
        data: {
          slots: [{ slot_number: 1, quantity: 10 }],
        },
      });
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/missing.*api.*key/i);
    });
  });
});
