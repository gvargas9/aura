/**
 * Test Suite: Link Integrity Verification
 * Category: e2e / deployment
 * Priority: critical
 *
 * Description: Crawls pages and verifies all internal links resolve to
 * real pages (no 404s, no blank screens). Tests header nav, footer links,
 * admin sidebar, and in-page links.
 *
 * This test catches:
 *   - Footer links pointing to missing pages
 *   - Header nav links that 404
 *   - Sidebar nav links to unbuilt pages
 *   - In-page links that lead nowhere
 *
 * Run after every major deployment.
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// Known missing pages (footer/nav links with no page.tsx)
// These are tracked so the test documents them without failing unexpectedly
// Previously missing pages - all created as of April 2026
// Keep this array for tracking; add new missing pages here as they're discovered
const KNOWN_MISSING_PAGES: string[] = [];

// Pages to skip link-checking on (external, auth callbacks, etc.)
const SKIP_PATTERNS = [
  /^https?:\/\//, // External links
  /^mailto:/, // Email links
  /^tel:/, // Phone links
  /^#/, // Anchor links
  /\/auth\/callback/, // OAuth callback
  /\/ref\//, // Referral codes (dynamic)
  /\/embed\//, // Embed routes (dynamic)
  /\/store\//, // Storefront routes (need real slug)
  /\/api\//, // API routes
];

function shouldSkipLink(href: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(href));
}

// Helper: collect all unique internal links on a page
async function collectInternalLinks(page: Page): Promise<string[]> {
  const links = await page.locator("a[href]").evaluateAll((els) =>
    els
      .map((el) => el.getAttribute("href"))
      .filter((href): href is string => !!href)
  );
  return [...new Set(links)].filter((href) => !shouldSkipLink(href));
}

// Helper: check if a page loads successfully (not 404, not error)
async function checkPageLoads(
  page: Page,
  url: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const response = await page.goto(url, { timeout: 15000 });
    const status = response?.status() ?? 0;

    if (status === 404) {
      return { ok: false, status, error: "404 Not Found" };
    }

    // Check for Next.js application error
    const hasAppError = await page
      .locator("text=Application error")
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (hasAppError) {
      return { ok: false, status, error: "Application error displayed" };
    }

    // Check page has content
    const bodyEmpty = await page.locator("body").evaluate(
      (el) => el.innerHTML.trim().length < 50
    );

    if (bodyEmpty) {
      return { ok: false, status, error: "Page body is empty" };
    }

    return { ok: true, status };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

test.describe("Deployment Verification: Link Integrity", () => {
  /* ==============================================================
     HEADER NAVIGATION LINKS
     ============================================================== */
  test.describe("Header Navigation Links", () => {
    test("all header nav links resolve to real pages", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("header").first()).toBeVisible();

      // Desktop nav links defined in Header.tsx
      const headerNavLinks = [
        { label: "Products", href: "/products" },
        { label: "Build a Box", href: "/build-box" },
        { label: "How It Works", href: "/how-it-works" },
        { label: "For Business", href: "/b2b" },
      ];

      const brokenLinks: string[] = [];

      for (const nav of headerNavLinks) {
        const result = await checkPageLoads(page, nav.href);
        if (!result.ok) {
          if (KNOWN_MISSING_PAGES.includes(nav.href)) {
            test.info().annotations.push({
              type: "known-missing",
              description: `Header link "${nav.label}" → ${nav.href} is a known missing page`,
            });
          } else {
            brokenLinks.push(`${nav.label} (${nav.href}): ${result.error}`);
          }
        }
      }

      expect(
        brokenLinks,
        `Broken header nav links: ${brokenLinks.join(", ")}`
      ).toHaveLength(0);
    });
  });

  /* ==============================================================
     FOOTER LINKS
     ============================================================== */
  test.describe("Footer Links", () => {
    const footerLinks = {
      Company: [
        { label: "About Us", href: "/about" },
        { label: "How It Works", href: "/how-it-works" },
        { label: "Our Story", href: "/story" },
        { label: "Careers", href: "/careers" },
      ],
      Products: [
        { label: "Build Your Box", href: "/build-box" },
        { label: "All Products", href: "/products" },
        { label: "Subscriptions", href: "/subscriptions" },
        { label: "Gift Cards", href: "/gift-cards" },
      ],
      Business: [
        { label: "For Dealers", href: "/b2b" },
        { label: "Wholesale", href: "/wholesale" },
        { label: "Aviation & Marine", href: "/b2b/luxury" },
        { label: "Partner With Us", href: "/partner" },
      ],
      Support: [
        { label: "Help Center", href: "/help" },
        { label: "Contact Us", href: "/contact" },
        { label: "Shipping Info", href: "/shipping" },
        { label: "Returns", href: "/returns" },
      ],
    };

    for (const [section, links] of Object.entries(footerLinks)) {
      test(`footer ${section} section links are verified`, async ({
        page,
      }) => {
        const brokenLinks: string[] = [];
        const missingPages: string[] = [];

        for (const link of links) {
          const result = await checkPageLoads(page, link.href);
          if (!result.ok) {
            if (KNOWN_MISSING_PAGES.includes(link.href)) {
              missingPages.push(`${link.label} (${link.href})`);
            } else {
              brokenLinks.push(
                `${link.label} (${link.href}): ${result.error}`
              );
            }
          }
        }

        // Annotate known missing pages
        if (missingPages.length > 0) {
          test.info().annotations.push({
            type: "known-missing",
            description: `Known missing pages in ${section}: ${missingPages.join(", ")}`,
          });
        }

        // Only fail on unexpected broken links
        expect(
          brokenLinks,
          `Unexpected broken links in footer ${section}: ${brokenLinks.join(", ")}`
        ).toHaveLength(0);
      });
    }
  });

  /* ==============================================================
     FOOTER LINKS EXIST IN DOM
     ============================================================== */
  test("footer renders all expected link elements", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const expectedLabels = [
      "About Us",
      "How It Works",
      "Our Story",
      "Careers",
      "Build Your Box",
      "All Products",
      "Subscriptions",
      "Gift Cards",
      "For Dealers",
      "Wholesale",
      "Aviation & Marine",
      "Partner With Us",
      "Help Center",
      "Contact Us",
      "Shipping Info",
      "Returns",
    ];

    for (const label of expectedLabels) {
      const link = footer.getByRole("link", { name: label });
      await expect(
        link,
        `Footer should contain "${label}" link`
      ).toBeVisible();
    }
  });

  /* ==============================================================
     ADMIN SIDEBAR LINKS
     ============================================================== */
  test.describe("Admin Sidebar Links", () => {
    test("all admin sidebar links resolve to real pages", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");

      const adminLinks = [
        "/admin",
        "/admin/products",
        "/admin/orders",
        "/admin/customers",
        "/admin/subscriptions",
        "/admin/inventory",
        "/admin/dealers",
        "/admin/samples",
        "/admin/storefronts",
        "/admin/vending",
        "/admin/recipes",
        "/admin/analytics",
        "/admin/notifications",
        "/admin/email-templates",
        "/admin/settings",
      ];

      const brokenLinks: string[] = [];

      for (const href of adminLinks) {
        const result = await checkPageLoads(page, href);
        if (!result.ok) {
          if (KNOWN_MISSING_PAGES.includes(href)) {
            test.info().annotations.push({
              type: "known-missing",
              description: `Admin sidebar link ${href} is a known missing page`,
            });
          } else {
            brokenLinks.push(`${href}: ${result.error}`);
          }
        }
      }

      expect(
        brokenLinks,
        `Broken admin sidebar links: ${brokenLinks.join(", ")}`
      ).toHaveLength(0);
    });
  });

  /* ==============================================================
     LANDING PAGE IN-PAGE LINKS
     ============================================================== */
  test("landing page internal links resolve", async ({ page }) => {
    await page.goto("/");
    // Landing page doesn't use <main> - wait for hero content
    await expect(page.getByText("Gourmet Food")).toBeVisible({ timeout: 15000 });

    const internalLinks = await collectInternalLinks(page);
    const brokenLinks: string[] = [];

    // Only check non-auth-protected, non-dynamic links
    const checkableLinks = internalLinks.filter(
      (href) =>
        !href.startsWith("/dashboard") &&
        !href.startsWith("/account") &&
        !href.startsWith("/orders") &&
        !href.startsWith("/checkout") &&
        !href.startsWith("/admin") &&
        !href.startsWith("/b2b/portal") &&
        !href.includes("[") &&
        !href.startsWith("/products/")
    );

    for (const href of checkableLinks) {
      const result = await checkPageLoads(page, href);
      if (!result.ok && !KNOWN_MISSING_PAGES.includes(href)) {
        brokenLinks.push(`${href}: ${result.error}`);
      }
    }

    expect(
      brokenLinks,
      `Broken links on landing page: ${brokenLinks.join(", ")}`
    ).toHaveLength(0);
  });

  /* ==============================================================
     PRODUCTS PAGE LINKS
     ============================================================== */
  test("products page links resolve (product detail pages)", async ({
    page,
  }) => {
    await page.goto("/products");
    await expect(page.locator(".animate-spin")).toBeHidden({
      timeout: 15000,
    });

    // Get product detail links
    const productLinks = await page
      .locator('a[href^="/products/"]')
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute("href"))
          .filter((href): href is string => !!href)
      );

    const uniqueProductLinks = [...new Set(productLinks)].slice(0, 5); // Check first 5
    const brokenLinks: string[] = [];

    for (const href of uniqueProductLinks) {
      const result = await checkPageLoads(page, href);
      if (!result.ok) {
        brokenLinks.push(`${href}: ${result.error}`);
      }
    }

    expect(
      brokenLinks,
      `Broken product detail links: ${brokenLinks.join(", ")}`
    ).toHaveLength(0);
  });

  /* ==============================================================
     B2B PAGE LINKS
     ============================================================== */
  test("B2B page internal links resolve", async ({ page }) => {
    await page.goto("/b2b");
    // B2B page - wait for content
    await expect(page.getByText("B2B Partner Program")).toBeVisible({ timeout: 15000 });

    const internalLinks = await collectInternalLinks(page);
    const brokenLinks: string[] = [];

    const checkableLinks = internalLinks.filter(
      (href) =>
        !href.startsWith("/b2b/portal") &&
        !href.startsWith("/dashboard") &&
        !href.startsWith("/admin")
    );

    for (const href of checkableLinks) {
      const result = await checkPageLoads(page, href);
      if (!result.ok && !KNOWN_MISSING_PAGES.includes(href)) {
        brokenLinks.push(`${href}: ${result.error}`);
      }
    }

    expect(
      brokenLinks,
      `Broken links on B2B page: ${brokenLinks.join(", ")}`
    ).toHaveLength(0);
  });

  /* ==============================================================
     KNOWN MISSING PAGES REPORT
     ============================================================== */
  test("report: document all known missing pages", async ({ page }) => {
    const results: { href: string; status: number; exists: boolean }[] = [];

    for (const href of KNOWN_MISSING_PAGES) {
      const response = await page.goto(href, { timeout: 10000 }).catch(() => null);
      const status = response?.status() ?? 0;
      // A page "exists" if it returns 200 and has content
      const hasContent = status === 200 &&
        (await page
          .locator("main")
          .isVisible({ timeout: 2000 })
          .catch(() => false));

      results.push({ href, status, exists: hasContent });
    }

    const stillMissing = results.filter((r) => !r.exists);
    const nowExists = results.filter((r) => r.exists);

    // Annotate findings
    if (stillMissing.length > 0) {
      test.info().annotations.push({
        type: "missing-pages",
        description: `${stillMissing.length} pages still missing: ${stillMissing.map((r) => r.href).join(", ")}`,
      });
    }

    if (nowExists.length > 0) {
      test.info().annotations.push({
        type: "resolved",
        description: `${nowExists.length} previously missing pages now exist: ${nowExists.map((r) => r.href).join(", ")}`,
      });
    }

    // This test always passes - it's a documentation/reporting test
    // Update KNOWN_MISSING_PAGES array when pages are created
    expect(true).toBe(true);
  });
});
