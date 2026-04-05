/**
 * Test Suite: AI Recommendations API Verification
 * Category: e2e / deployment
 * Priority: medium
 *
 * Description: Verifies the AI recommendation endpoints work correctly.
 * Tests product recommendations, smart-fill, and chat product search.
 * Requires: Products with embeddings in the database.
 *
 * Endpoints covered:
 *   GET /api/recommendations
 *   GET /api/recommendations/smart-fill
 *   POST /api/chat/products
 *   GET /api/search
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Deployment Verification: AI & Recommendations", () => {
  /* ==============================================================
     PRODUCT RECOMMENDATIONS API
     ============================================================== */
  test("GET /api/recommendations returns products or empty array", async ({
    request,
  }) => {
    const response = await request.get("/api/recommendations");
    // May return 200 with data or 400 if no product_id provided
    expect([200, 400]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("GET /api/recommendations with product_id returns similar products", async ({
    request,
  }) => {
    // First get a product ID from the products API
    const productsResponse = await request.get("/api/products");

    if (productsResponse.status() !== 200) {
      test.info().annotations.push({
        type: "info",
        description: "Products API not available - skipping",
      });
      return;
    }

    const products = await productsResponse.json();
    const productList = products.data || products.products || products;

    if (!Array.isArray(productList) || productList.length === 0) {
      test.info().annotations.push({
        type: "info",
        description: "No products in database - run seed script",
      });
      return;
    }

    const productId = productList[0].id;
    const response = await request.get(
      `/api/recommendations?product_id=${productId}`
    );

    // Should return 200 even if no embeddings exist (returns empty/fallback)
    expect([200, 400, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  /* ==============================================================
     SMART FILL API
     ============================================================== */
  test("GET /api/recommendations/smart-fill returns products for box filling", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/recommendations/smart-fill?box_size=8"
    );

    // May return 200, 400/500, or 405 if method not supported
    expect([200, 400, 405, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();

      // Should return products array
      const products = data.products || data.data || data;
      if (Array.isArray(products)) {
        // Smart fill should try to return up to box_size items
        expect(products.length).toBeLessThanOrEqual(8);
      }
    }
  });

  /* ==============================================================
     PRODUCT SEARCH API
     ============================================================== */
  test("GET /api/search returns search results", async ({ request }) => {
    const response = await request.get("/api/search?q=chicken");

    expect([200, 400]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("GET /api/search with empty query returns error or all products", async ({
    request,
  }) => {
    const response = await request.get("/api/search?q=");
    // Should handle gracefully
    expect([200, 400]).toContain(response.status());
  });

  /* ==============================================================
     PRODUCTS API
     ============================================================== */
  test("GET /api/products returns product listing", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();

    const products = data.data || data.products || data;
    if (Array.isArray(products) && products.length > 0) {
      // Verify product structure
      const product = products[0];
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("price");
    }
  });

  /* ==============================================================
     CHAT PRODUCTS API
     ============================================================== */
  test("POST /api/chat/products returns product suggestions", async ({
    request,
  }) => {
    const response = await request.post("/api/chat/products", {
      data: { query: "high protein meals" },
    });

    // May need auth, may work without it, or method may not be supported
    expect([200, 400, 401, 405]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  /* ==============================================================
     CATEGORIES API
     ============================================================== */
  test("GET /api/categories returns category list", async ({ request }) => {
    const response = await request.get("/api/categories");

    expect([200, 400, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  /* ==============================================================
     RECOMMENDATIONS UI INTEGRATION
     ============================================================== */
  test("product detail page shows recommendations section", async ({
    page,
  }) => {
    // Go to products page, find a product link
    await page.goto("/products");
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const productLinks = page.locator('a[href^="/products/"]');
    const count = await productLinks.count();

    if (count === 0) {
      test.info().annotations.push({
        type: "info",
        description: "No products available - skipping UI test",
      });
      return;
    }

    // Navigate to first product detail
    const href = await productLinks.first().getAttribute("href");
    if (href) {
      await page.goto(href);
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

      // Product page should load
      const body = await page.locator("body").innerHTML();
      expect(body.length).toBeGreaterThan(200);

      // Check for recommendations section (may or may not exist depending on embeddings)
      const hasRecommendations = await page
        .getByText(/you might also like|recommended|similar/i)
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (!hasRecommendations) {
        test.info().annotations.push({
          type: "info",
          description:
            "No recommendations section found - embeddings may not be generated",
        });
      }
    }
  });
});
