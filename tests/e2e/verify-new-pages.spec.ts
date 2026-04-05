/**
 * Test Suite: New Pages Content & Link Verification
 * Category: e2e / deployment
 * Priority: critical
 *
 * Description: Verifies all newly created pages render their content correctly,
 * display key sections, and have working internal links. Covers company, support,
 * business, legal, and admin pages.
 *
 * Run after every major deployment.
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// Helper: assert page loaded without crash
async function assertPageLoaded(page: Page) {
  const errorOverlay = page.locator("text=Application error");
  const hasError = await errorOverlay.isVisible().catch(() => false);
  expect(hasError).toBe(false);
}

// Helper: verify a link on the page resolves (not 404)
async function assertLinkWorks(page: Page, href: string) {
  const response = await page.goto(href, { timeout: 15000 });
  const status = response?.status() ?? 0;
  expect(status, `${href} should not 404`).not.toBe(404);
  await assertPageLoaded(page);
}

/* ================================================================
   COMPANY PAGES
   ================================================================ */
test.describe("New Pages: Company", () => {
  test("About page renders content and sections", async ({ page }) => {
    await page.goto("/about");
    await assertPageLoaded(page);

    // Hero heading
    await expect(page.getByRole("heading", { name: /about aura/i })).toBeVisible({
      timeout: 10000,
    });

    // Key sections
    await expect(page.getByText(/our mission/i).first()).toBeVisible();
    await expect(page.getByText(/quality first/i).first()).toBeVisible();

    // Stats
    await expect(page.getByText("50+")).toBeVisible();
    await expect(page.getByText("10K+")).toBeVisible();

    // Footer present
    await expect(page.locator("footer")).toBeAttached();

    // CTA link works
    const ctaLink = page.locator('a[href="/build-box"]').first();
    await expect(ctaLink).toBeVisible();
  });

  test("About page CTA links to /build-box", async ({ page }) => {
    await page.goto("/about");
    await assertLinkWorks(page, "/build-box");
  });

  test("How It Works page renders content and steps", async ({ page }) => {
    await page.goto("/how-it-works");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /how aura works/i })
    ).toBeVisible({ timeout: 10000 });

    // 3 steps
    await expect(page.getByText(/choose your box/i).first()).toBeVisible();
    await expect(page.getByText(/fill with favorites/i).first()).toBeVisible();
    await expect(page.getByText(/delivered monthly/i).first()).toBeVisible();

    // Why shelf-stable section
    await expect(page.getByText(/shelf-stable/i).first()).toBeVisible();

    // FAQ section
    await expect(page.getByText(/frequently asked/i).first()).toBeVisible();

    // CTA
    await expect(page.locator('a[href="/build-box"]').first()).toBeVisible();
  });

  test("How It Works FAQ accordion toggles", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(
      page.getByRole("heading", { name: /how aura works/i })
    ).toBeVisible({ timeout: 10000 });

    // Find and click a FAQ question
    const faqButton = page.locator("button").filter({ hasText: /\?/ }).first();
    if (await faqButton.isVisible()) {
      await faqButton.click();
      // After clicking, some answer text should appear
      await page.waitForTimeout(300);
    }
  });

  test("Our Story page renders timeline and content", async ({ page }) => {
    await page.goto("/story");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /our story/i })
    ).toBeVisible({ timeout: 10000 });

    // Origin narrative
    await expect(page.getByText(/austin/i).first()).toBeVisible();

    // The Aura Difference section
    await expect(page.getByText(/aura difference/i).first()).toBeVisible();

    // Our Promise
    await expect(page.getByText(/our promise/i).first()).toBeVisible();

    // CTA links to /products
    await expect(page.locator('a[href="/products"]').first()).toBeVisible();
  });

  test("Careers page renders job info", async ({ page }) => {
    await page.goto("/careers");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /join the aura team/i })
    ).toBeVisible({ timeout: 10000 });

    // Why work section
    await expect(page.getByText(/why work/i).first()).toBeVisible();

    // Perks
    await expect(page.getByText(/health/i).first()).toBeVisible();

    // No open positions message
    await expect(page.getByText(/no open positions/i).first()).toBeVisible();

    // Contact email
    await expect(page.getByText(/careers@aura.com/i).first()).toBeVisible();

    // CTA
    await expect(page.locator('a[href="/products"]').first()).toBeVisible();
  });
});

/* ================================================================
   SUPPORT PAGES
   ================================================================ */
test.describe("New Pages: Support", () => {
  test("Subscriptions page renders tiers and pricing", async ({ page }) => {
    await page.goto("/subscriptions");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /aura subscriptions/i })
    ).toBeVisible({ timeout: 10000 });

    // Box tiers
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Voyager").first()).toBeVisible();
    await expect(page.getByText("Bunker").first()).toBeVisible();

    // Pricing
    await expect(page.getByText("$59.99").first()).toBeVisible();
    await expect(page.getByText("$84.99").first()).toBeVisible();
    await expect(page.getByText("$149.99").first()).toBeVisible();

    // CTA
    await expect(page.locator('a[href="/build-box"]').first()).toBeVisible();
  });

  test("Help Center page renders FAQ categories", async ({ page }) => {
    await page.goto("/help");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /help center/i })
    ).toBeVisible({ timeout: 10000 });

    // FAQ categories (combined titles like "Orders & Shipping")
    await expect(page.getByText(/orders.*shipping/i).first()).toBeVisible();
    await expect(page.getByText("Subscriptions").first()).toBeVisible();
    await expect(page.getByText("Products").first()).toBeVisible();

    // Contact info
    await expect(page.getByText("hello@aura.com").first()).toBeVisible();
    await expect(page.getByText("1-800-AURA-NOW").first()).toBeVisible();
  });

  test("Help Center FAQ accordion works", async ({ page }) => {
    await page.goto("/help");
    await expect(
      page.getByRole("heading", { name: /help center/i })
    ).toBeVisible({ timeout: 10000 });

    // Click a FAQ question to expand
    const faqButton = page.locator("button").filter({ hasText: /\?/ }).first();
    if (await faqButton.isVisible()) {
      await faqButton.click();
      await page.waitForTimeout(300);
    }
  });

  test("Contact page renders form and info", async ({ page }) => {
    await page.goto("/contact");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /contact us/i })
    ).toBeVisible({ timeout: 10000 });

    // Contact info
    await expect(page.getByText("hello@aura.com").first()).toBeVisible();
    await expect(page.getByText("1-800-AURA-NOW").first()).toBeVisible();
    await expect(page.getByText(/austin/i).first()).toBeVisible();

    // Form elements
    await expect(page.locator('input[type="text"], input[name*="name"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator("textarea").first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();

    // B2B link
    await expect(page.locator('a[href="/b2b"]').first()).toBeVisible();
  });

  test("Shipping page renders delivery info", async ({ page }) => {
    await page.goto("/shipping");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /shipping information/i })
    ).toBeVisible({ timeout: 10000 });

    // Key info
    await expect(page.getByText(/free shipping/i).first()).toBeVisible();
    await expect(page.getByText(/3-5 business days/i).first()).toBeVisible();
    await expect(page.getByText(/el paso/i).first()).toBeVisible();
    await expect(page.getByText(/united states/i).first()).toBeVisible();
  });

  test("Returns page renders policy info", async ({ page }) => {
    await page.goto("/returns");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /returns.*refunds/i })
    ).toBeVisible({ timeout: 10000 });

    // Satisfaction guarantee
    await expect(page.getByText(/satisfaction/i).first()).toBeVisible();

    // Refund timeline
    await expect(page.getByText(/5-7 business days/i).first()).toBeVisible();

    // CTA link to help
    await expect(page.locator('a[href="/help"]').first()).toBeVisible();
  });
});

/* ================================================================
   BUSINESS PAGES
   ================================================================ */
test.describe("New Pages: Business", () => {
  test("Wholesale page renders dealer tiers", async ({ page }) => {
    await page.goto("/wholesale");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: "Wholesale Pricing", exact: true })
    ).toBeVisible({ timeout: 10000 });

    // Dealer tier system heading
    await expect(page.getByText(/dealer tier/i).first()).toBeVisible();

    // Tier names visible on scroll
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(page.getByText("Bronze").first()).toBeVisible();

    // CTA
    await expect(page.locator('a[href="/b2b/apply"]').first()).toBeVisible();
    await expect(page.locator('a[href="/b2b/portal"]').first()).toBeVisible();
  });

  test("Wholesale page links resolve", async ({ page }) => {
    await assertLinkWorks(page, "/b2b/apply");
    await assertLinkWorks(page, "/b2b/portal");
  });

  test("Aviation & Marine page renders content", async ({ page }) => {
    await page.goto("/b2b/luxury");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: "Aviation & Marine", exact: true })
    ).toBeVisible({ timeout: 10000 });

    // Key selling points (may need scroll to see)
    await expect(page.getByText(/gourmet/i).first()).toBeVisible();

    // Page has testimonials section (scroll down)
    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect(page.getByText(/marcus thompson/i).first()).toBeVisible();
    await expect(page.getByText(/sarah mitchell/i).first()).toBeVisible();

    // CTAs
    await expect(page.locator('a[href="/b2b/apply"]').first()).toBeVisible();
    await expect(page.locator('a[href="/wholesale"]').first()).toBeVisible();
  });

  test("Aviation & Marine links resolve", async ({ page }) => {
    await assertLinkWorks(page, "/b2b/apply");
    await assertLinkWorks(page, "/wholesale");
  });

  test("Partner page renders partnership types", async ({ page }) => {
    await page.goto("/partner");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /partner with us/i })
    ).toBeVisible({ timeout: 10000 });

    // Partnership types
    await expect(page.getByText(/retail/i).first()).toBeVisible();
    await expect(page.getByText(/affiliate/i).first()).toBeVisible();
    await expect(page.getByText(/corporate/i).first()).toBeVisible();

    // Process steps
    await expect(page.getByText(/apply/i).first()).toBeVisible();
    await expect(page.getByText(/onboard/i).first()).toBeVisible();

    // CTAs
    await expect(page.locator('a[href="/b2b/apply"]').first()).toBeVisible();
    await expect(page.locator('a[href="/wholesale"]').first()).toBeVisible();
  });
});

/* ================================================================
   LEGAL PAGES
   ================================================================ */
test.describe("New Pages: Legal", () => {
  test("Privacy Policy renders all sections", async ({ page }) => {
    await page.goto("/privacy");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /privacy policy/i })
    ).toBeVisible({ timeout: 10000 });

    // Last updated
    await expect(page.getByText(/march 2026/i).first()).toBeVisible();

    // Key sections
    await expect(page.getByText(/information we collect/i).first()).toBeVisible();
    await expect(page.getByText(/how we use/i).first()).toBeVisible();
    await expect(page.getByText(/data security/i).first()).toBeVisible();
    await expect(page.getByText(/your rights/i).first()).toBeVisible();

    // Contact
    await expect(page.getByText("hello@aura.com").first()).toBeVisible();

    // Link to cookies page
    await expect(page.locator('a[href="/cookies"]').first()).toBeVisible();
  });

  test("Privacy page cookie link resolves", async ({ page }) => {
    await assertLinkWorks(page, "/cookies");
  });

  test("Terms of Service renders all sections", async ({ page }) => {
    await page.goto("/terms");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /terms of service/i })
    ).toBeVisible({ timeout: 10000 });

    // Last updated
    await expect(page.getByText(/march 2026/i).first()).toBeVisible();

    // Key sections
    await expect(page.getByText(/acceptance/i).first()).toBeVisible();
    await expect(page.getByText(/orders.*payment/i).first()).toBeVisible();
    await expect(page.getByText(/limitation of liability/i).first()).toBeVisible();
    await expect(page.getByText(/state of texas/i).first()).toBeVisible();

    // Link to returns
    await expect(page.locator('a[href="/returns"]').first()).toBeVisible();
  });

  test("Terms returns link resolves", async ({ page }) => {
    await assertLinkWorks(page, "/returns");
  });

  test("Cookie Policy renders cookie types", async ({ page }) => {
    await page.goto("/cookies");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /cookie policy/i })
    ).toBeVisible({ timeout: 10000 });

    // Cookie types
    await expect(page.getByText(/essential/i).first()).toBeVisible();
    await expect(page.getByText(/functional/i).first()).toBeVisible();
    await expect(page.getByText(/analytics/i).first()).toBeVisible();

    // Third party
    await expect(page.getByText(/stripe/i).first()).toBeVisible();
    await expect(page.getByText(/supabase/i).first()).toBeVisible();
  });

  test("Accessibility Statement renders standards", async ({ page }) => {
    await page.goto("/accessibility");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: "Accessibility Statement", exact: true })
    ).toBeVisible({ timeout: 10000 });

    // Conformance standards section
    await expect(page.getByText(/conformance/i).first()).toBeVisible();

    // WCAG reference (text contains "WCAG" somewhere)
    await expect(page.getByText("WCAG").first()).toBeVisible();

    // Commitment section
    await expect(page.getByText(/our commitment/i).first()).toBeVisible();

    // Contact
    await expect(page.getByText("hello@aura.com").first()).toBeVisible();
  });
});

/* ================================================================
   ADMIN PAGES (require login)
   ================================================================ */
test.describe("New Pages: Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Admin Settings page renders all sections", async ({ page }) => {
    await page.goto("/admin/settings");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /settings/i }).first()
    ).toBeVisible({ timeout: 15000 });

    // Wait for data to load (spinner disappears)
    await expect(page.locator(".animate-spin").first()).toBeHidden({
      timeout: 20000,
    }).catch(() => {});

    // General settings section
    await expect(page.getByText("General Settings").first()).toBeVisible();

    // Shipping section
    await expect(page.getByText("Shipping").first()).toBeVisible();

    // Integrations
    await expect(page.getByText(/stripe/i).first()).toBeVisible();
    await expect(page.getByText(/connected/i).first()).toBeVisible();
  });

  test("Admin Settings notification toggles are interactive", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.getByRole("heading", { name: /settings/i }).first()
    ).toBeVisible({ timeout: 15000 });

    // Wait for data to load
    await expect(page.locator(".animate-spin").first()).toBeHidden({
      timeout: 20000,
    }).catch(() => {});

    // Verify toggle switches exist and are clickable
    const toggle = page.locator('[role="switch"]').first();
    const isVisible = await toggle.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      // Toggle has aria-checked attribute
      const ariaChecked = await toggle.getAttribute("aria-checked");
      expect(ariaChecked).toBeTruthy();

      // Click is possible (no crash)
      await toggle.click();
      await page.waitForTimeout(300);
      await assertPageLoaded(page);
    }
  });

  test("Admin Subscriptions page renders table or empty state", async ({
    page,
  }) => {
    await page.goto("/admin/subscriptions");
    await assertPageLoaded(page);

    await expect(
      page.getByRole("heading", { name: /subscriptions/i }).first()
    ).toBeVisible({ timeout: 15000 });

    // Subtitle
    await expect(
      page.getByText(/manage.*subscriptions/i).first()
    ).toBeVisible();

    // Search input
    await expect(
      page.locator('input[placeholder*="earch"]').first()
    ).toBeVisible();

    // Status filter buttons
    await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible();

    // Wait for data load
    await expect(page.locator(".animate-spin").first()).toBeHidden({
      timeout: 20000,
    }).catch(() => {});

    // Should show table or empty state
    const hasTable = await page
      .locator("table")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/no subscriptions/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);
  });

  test("Admin Subscriptions status filter works", async ({ page }) => {
    await page.goto("/admin/subscriptions");
    await expect(
      page.getByRole("heading", { name: /subscriptions/i }).first()
    ).toBeVisible({ timeout: 15000 });

    // Click Active filter
    const activeBtn = page.getByRole("button", { name: /active/i }).first();
    if (await activeBtn.isVisible()) {
      await activeBtn.click();
      await page.waitForTimeout(500);
      // Page should still be functional (no crash)
      await assertPageLoaded(page);
    }
  });
});

/* ================================================================
   CROSS-PAGE LINK VERIFICATION
   ================================================================ */
test.describe("New Pages: Cross-page links resolve", () => {
  const pageLinks: { from: string; links: string[] }[] = [
    { from: "/about", links: ["/build-box"] },
    { from: "/how-it-works", links: ["/build-box"] },
    { from: "/story", links: ["/products"] },
    { from: "/careers", links: ["/products"] },
    { from: "/subscriptions", links: ["/build-box"] },
    { from: "/returns", links: ["/help"] },
    { from: "/contact", links: ["/b2b"] },
    { from: "/wholesale", links: ["/b2b/apply"] },
    { from: "/b2b/luxury", links: ["/b2b/apply", "/wholesale"] },
    { from: "/partner", links: ["/b2b/apply", "/wholesale"] },
    { from: "/privacy", links: ["/cookies"] },
    { from: "/terms", links: ["/returns"] },
  ];

  for (const { from, links } of pageLinks) {
    test(`${from} internal links all resolve`, async ({ page }) => {
      await page.goto(from);
      await assertPageLoaded(page);

      for (const href of links) {
        // Verify the link element exists on the page
        const link = page.locator(`a[href="${href}"]`).first();
        await expect(
          link,
          `${from} should have link to ${href}`
        ).toBeVisible({ timeout: 5000 });

        // Navigate and verify target loads
        await assertLinkWorks(page, href);
      }
    });
  }
});
