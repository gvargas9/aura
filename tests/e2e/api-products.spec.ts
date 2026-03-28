/**
 * Test Suite: Products API
 * Category: e2e (API)
 * Priority: high
 *
 * Description: Tests the /api/products endpoints including listing, filtering,
 * pagination, search, individual product retrieval, and auth protection on POST.
 * Prerequisites: Running dev server at localhost:3000, 8 seed products in database.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("Products API", () => {
  test.describe("GET /api/products (Public)", () => {
    test("should return JSON with success:true and items array", async ({
      request,
    }) => {
      const response = await request.get("/api/products");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.items).toBeInstanceOf(Array);
      expect(data.data.items.length).toBeGreaterThan(0);
      expect(data.data.total).toBeGreaterThan(0);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(20);
      expect(data.data.totalPages).toBeGreaterThanOrEqual(1);
    });

    test("should filter products by category", async ({ request }) => {
      // First get all products to find a valid category
      const allResponse = await request.get("/api/products");
      const allData = await allResponse.json();
      const firstProduct = allData.data.items[0];
      const category = firstProduct.category;

      // Filter by that category
      const response = await request.get(
        `/api/products?category=${encodeURIComponent(category)}`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items.length).toBeGreaterThan(0);

      // All returned products should belong to the filtered category
      for (const product of data.data.items) {
        expect(product.category).toBe(category);
      }
    });

    test("should search products by name", async ({ request }) => {
      // First get a product name to use as a search term
      const allResponse = await request.get("/api/products");
      const allData = await allResponse.json();
      const firstProduct = allData.data.items[0];

      // Use a word from the product name as search term
      const searchTerm = firstProduct.name.split(" ")[0];

      const response = await request.get(
        `/api/products?search=${encodeURIComponent(searchTerm)}`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items.length).toBeGreaterThan(0);

      // At least one result should contain the search term (case-insensitive)
      const hasMatch = data.data.items.some(
        (p: { name: string; description: string; sku: string }) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(hasMatch).toBe(true);
    });

    test("should return paginated results", async ({ request }) => {
      const response = await request.get("/api/products?page=1&pageSize=3");
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items.length).toBeLessThanOrEqual(3);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(3);

      // With 8 seed products and pageSize=3, should have multiple pages
      if (data.data.total > 3) {
        expect(data.data.totalPages).toBeGreaterThan(1);
      }
    });

    test("should return different results on page 2", async ({ request }) => {
      const page1Response = await request.get(
        "/api/products?page=1&pageSize=3"
      );
      const page1Data = await page1Response.json();

      const page2Response = await request.get(
        "/api/products?page=2&pageSize=3"
      );
      const page2Data = await page2Response.json();

      expect(page2Data.success).toBe(true);
      expect(page2Data.data.page).toBe(2);

      // If there are enough products, page 2 should have different items
      if (page1Data.data.total > 3 && page2Data.data.items.length > 0) {
        const page1Ids = page1Data.data.items.map(
          (p: { id: string }) => p.id
        );
        const page2Ids = page2Data.data.items.map(
          (p: { id: string }) => p.id
        );

        // No overlap between pages
        for (const id of page2Ids) {
          expect(page1Ids).not.toContain(id);
        }
      }
    });
  });

  test.describe("POST /api/products (Protected)", () => {
    test("should return 401 without authentication", async ({ request }) => {
      const response = await request.post("/api/products", {
        data: {
          sku: "TEST-SKU-001",
          name: "Test Product",
          price: 9.99,
          category: "Test",
        },
      });

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  test.describe("GET /api/products/[id]", () => {
    test("should return a single product by valid ID", async ({ request }) => {
      // First get a valid product ID
      const listResponse = await request.get("/api/products?pageSize=1");
      const listData = await listResponse.json();
      expect(listData.data.items.length).toBeGreaterThan(0);

      const productId = listData.data.items[0].id;

      // Fetch individual product
      const response = await request.get(`/api/products/${productId}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe(productId);
      expect(data.data.name).toBeDefined();
      expect(data.data.sku).toBeDefined();
      expect(data.data.price).toBeDefined();
      expect(data.data.category).toBeDefined();
    });

    test("should return 404 for non-existent product ID", async ({
      request,
    }) => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await request.get(`/api/products/${fakeId}`);
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/not found/i);
    });
  });
});
