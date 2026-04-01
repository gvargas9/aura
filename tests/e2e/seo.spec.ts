/**
 * Test Suite: SEO Features
 * Category: e2e
 * Priority: medium
 *
 * Description: Tests SEO-critical features including robots.txt, sitemap.xml,
 * and structured data (JSON-LD) on the landing page.
 * Prerequisites: Running dev server at localhost:3000.
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("SEO Features", () => {
  test.describe("robots.txt", () => {
    test("should return 200 with correct directives", async ({ request }) => {
      const response = await request.get("/robots.txt");
      expect(response.status()).toBe(200);

      const body = await response.text();
      expect(body).toContain("Sitemap:");
      expect(body).toContain("Disallow: /admin");
      expect(body).toContain("Disallow: /dashboard");
      expect(body).toContain("Disallow: /api");
    });
  });

  test.describe("sitemap.xml", () => {
    test("should return 200 with valid XML sitemap", async ({ request }) => {
      const response = await request.get("/sitemap.xml");
      expect(response.status()).toBe(200);

      const body = await response.text();
      expect(body).toContain("<urlset");
      expect(body).toContain("<url>");
      expect(body).toContain("<loc>");
    });
  });

  test.describe("Structured Data (JSON-LD)", () => {
    test("should include Organization schema on landing page", async ({
      page,
    }) => {
      await page.goto("/");

      // Find the JSON-LD script tag
      const jsonLd = await page.locator('script[type="application/ld+json"]').first();
      await expect(jsonLd).toBeAttached();

      const content = await jsonLd.textContent();
      expect(content).toBeTruthy();

      const schema = JSON.parse(content!);
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Organization");
      expect(schema.name).toBe("Aura");
    });
  });
});
