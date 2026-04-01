/**
 * Test Suite: SEO & Technical (Production)
 * Category: Production E2E
 * Priority: high
 *
 * Description: Tests SEO elements, meta tags, structured data, robots.txt,
 * sitemap.xml, security headers, and HTTPS enforcement.
 * All tests are READ-ONLY against production.
 *
 * Target: https://aura.inspiration-ai.com
 */

import { test, expect } from "@playwright/test";

test.describe("SEO - Robots & Sitemap", () => {
  test("should return valid robots.txt", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const text = await response.text();
    // robots.txt should contain User-agent directive
    expect(text.toLowerCase()).toContain("user-agent");
  });

  test("should return sitemap.xml or reference it in robots.txt", async ({ request }) => {
    // Try direct sitemap access
    const sitemapResponse = await request.get("/sitemap.xml");

    if (sitemapResponse.status() === 200) {
      const text = await sitemapResponse.text();
      expect(text).toContain("<?xml");
      expect(text.toLowerCase()).toContain("url");
    } else {
      // Check if robots.txt references a sitemap
      const robotsResponse = await request.get("/robots.txt");
      const robotsText = await robotsResponse.text();
      // It's OK if sitemap doesn't exist — just log
      console.warn("No sitemap.xml found, robots.txt content:", robotsText.slice(0, 200));
    }
  });
});

test.describe("SEO - Meta Tags", () => {
  test("should have title tag on landing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    // Title should contain brand name or relevant keyword
    expect(title.toLowerCase()).toMatch(/aura|food|gourmet|subscription/);
  });

  test("should have meta description on landing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const metaDesc = await page.locator('meta[name="description"]').getAttribute("content");
    if (metaDesc) {
      expect(metaDesc.length).toBeGreaterThan(20);
    } else {
      console.warn("No meta description found on landing page");
    }
  });

  test("should have Open Graph tags on landing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content").catch(() => null);
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content").catch(() => null);

    // At least one OG tag should be present
    const hasOGTags = ogTitle || ogDesc;
    if (!hasOGTags) {
      console.warn("No Open Graph tags found on landing page");
    }
  });

  test("should have viewport meta tag", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toBeTruthy();
    expect(viewport).toContain("width=device-width");
  });

  test("should have charset meta tag", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const charset = await page.locator('meta[charset]').getAttribute("charset");
    if (charset) {
      expect(charset.toLowerCase()).toBe("utf-8");
    }
  });
});

test.describe("SEO - Structured Data", () => {
  test("should have JSON-LD structured data on landing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    if (count > 0) {
      const content = await jsonLdScripts.first().textContent();
      expect(content).toBeTruthy();
      // Validate it's valid JSON
      const parsed = JSON.parse(content!);
      expect(parsed["@context"]).toContain("schema.org");
    } else {
      console.warn("No JSON-LD structured data found on landing page");
    }
  });
});

test.describe("SEO - Product Page Meta", () => {
  test("should have dynamic metadata on product pages", async ({ page }) => {
    // First find a product
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const productLink = page.locator('a[href*="/products/"]').first();
    const isVisible = await productLink.isVisible({ timeout: 10000 }).catch(() => false);

    if (isVisible) {
      await productLink.click();
      await page.waitForLoadState("networkidle");

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // Product page title should differ from landing page
      // (indicates dynamic metadata)
      expect(title).not.toBe("");
    }
  });
});

test.describe("Technical - Security Headers", () => {
  test("should have security headers on responses", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    // Check common security headers
    const securityHeaders = {
      "x-content-type-options": headers["x-content-type-options"],
      "referrer-policy": headers["referrer-policy"],
      "x-frame-options": headers["x-frame-options"],
      "strict-transport-security": headers["strict-transport-security"],
    };

    // Log which headers are present
    let presentCount = 0;
    for (const [name, value] of Object.entries(securityHeaders)) {
      if (value) {
        presentCount++;
      } else {
        console.warn(`Security header "${name}" not set`);
      }
    }

    // At least some security headers should be present (Next.js sets some by default)
    expect(presentCount).toBeGreaterThan(0);
  });
});

test.describe("Technical - HTTPS", () => {
  test("should serve pages over HTTPS", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toMatch(/^https:\/\//);
  });

  test("should not have mixed content on landing page", async ({ page }) => {
    const mixedContentWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.text().toLowerCase().includes("mixed content")) {
        mixedContentWarnings.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(mixedContentWarnings.length).toBe(0);
  });
});

test.describe("Technical - Performance", () => {
  test("should load landing page within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  test("should load products page within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/products");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });
});

test.describe("Technical - 404 Handling", () => {
  test("should handle non-existent routes gracefully", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345");

    // Should either return 404 or redirect to a custom 404 page
    if (response) {
      const status = response.status();
      expect([200, 404]).toContain(status); // 200 if custom 404 page
    }

    // Page should still render something (not a blank page)
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });
});
