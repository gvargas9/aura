/**
 * Test Suite: Presentation Page
 * Category: e2e
 * Priority: medium
 *
 * Description: Tests the investor/pitch presentation page with slide navigation,
 * animations, keyboard controls, and overview grid.
 * Prerequisites: Running dev server at localhost:3000.
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

// Slide transition (250ms) + animation reveal (up to 800ms) + buffer
const TRANSITION_WAIT = 400;
const REVEAL_TIMEOUT = 5000;

test.describe("Presentation Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/presentation");
    // Wait for first slide content to be fully revealed
    await expect(page.getByText("Energy, Anywhere")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
  });

  test("should load the title slide with Aura branding", async ({ page }) => {
    await expect(page.locator("h1").getByText("Aura")).toBeVisible();
    await expect(page.getByText("Energy, Anywhere")).toBeVisible();
    await expect(
      page.getByText("AI-Native Omni-Commerce Food Platform")
    ).toBeVisible({ timeout: REVEAL_TIMEOUT });
  });

  test("should show progress bar and slide counter", async ({ page }) => {
    await expect(page.getByText("01 / 18")).toBeVisible();
  });

  test("should navigate forward with right arrow key", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("02 / 18")).toBeVisible();
    await expect(page.getByText("$300B")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
  });

  test("should navigate backward with left arrow key", async ({ page }) => {
    // Go to slide 2
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("02 / 18")).toBeVisible();

    // Go back to slide 1
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("01 / 18")).toBeVisible();
  });

  test("should navigate with arrow buttons", async ({ page }) => {
    const nextButton = page.getByLabel("Next slide");
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("02 / 18")).toBeVisible();

    const prevButton = page.getByLabel("Previous slide");
    await expect(prevButton).toBeVisible();
    await prevButton.click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("01 / 18")).toBeVisible();
  });

  test("should open overview grid with ESC key", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByText("Overview")).toBeVisible();
    await expect(page.getByText("Close")).toBeVisible();
  });

  test("should navigate to specific slide from overview", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByText("Overview")).toBeVisible();

    // Click on slide labeled "Consumer UX" (slide 5)
    await page.getByText("Consumer UX").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("05 / 18")).toBeVisible();
  });

  test("should close overview with ESC", async ({ page }) => {
    // Open
    await page.keyboard.press("Escape");
    await expect(page.getByText("Overview")).toBeVisible();

    // Close
    await page.keyboard.press("Escape");
    // The overview heading should disappear (use role to avoid matching the small "overview" hint)
    await expect(page.getByRole("heading", { name: "Overview" })).not.toBeVisible();
    // Should still be on slide 1
    await expect(page.getByText("01 / 18")).toBeVisible();
  });

  test("should show nav dots for all 18 slides", async ({ page }) => {
    const dots = page.locator('[aria-label^="Go to slide"]');
    await expect(dots).toHaveCount(18);
  });

  test("should navigate via nav dots", async ({ page }) => {
    await page.getByLabel("Go to slide 10: Architecture").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("10 / 18")).toBeVisible();
    await expect(page.getByText("The Stack")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
  });

  test("should display all 18 slides in overview grid", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByText("Overview")).toBeVisible();

    const slideLabels = [
      "Title", "Problem", "Solution", "Channels", "Consumer UX",
      "AI Features", "B2B Portal", "Academy", "Multi-Storefront",
      "Architecture", "Metrics", "Supply Chain", "Security",
      "i18n", "Roadmap", "Competitive Moat", "Revenue", "CTA",
    ];

    for (const label of slideLabels) {
      await expect(
        page.getByText(label, { exact: true }).first()
      ).toBeVisible();
    }
  });

  test("should render Problem slide content", async ({ page }) => {
    await page.getByLabel("Go to slide 2: Problem").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("$300B")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("Cold-Chain is Expensive")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("Shelf-Stable is Mush")).toBeVisible();
    await expect(page.getByText("No Multi-Channel Platform")).toBeVisible();
  });

  test("should render Solution slide content", async ({ page }) => {
    await page.getByLabel("Go to slide 3: Solution").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("Zero Refrigeration")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("2-Year Shelf Life")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("100% Natural")).toBeVisible();
  });

  test("should render Channels slide with 6 channels", async ({ page }) => {
    await page.getByLabel("Go to slide 4: Channels").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("Ways to Sell")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("B2C Subscription")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("B2B Wholesale")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Vending" })
    ).toBeVisible();
  });

  test("should render Consumer UX slide with device mockups", async ({
    page,
  }) => {
    await page.getByLabel("Go to slide 5: Consumer UX").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(
      page.getByRole("heading", { name: /Build-a-Box/i }).first()
    ).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });

    // Check device mockup image is present
    const img = page.getByRole("img", { name: "Build-a-Box interface" });
    await expect(img).toBeVisible({ timeout: REVEAL_TIMEOUT });
  });

  test("should render AI Features slide", async ({ page }) => {
    await page.getByLabel("Go to slide 6: AI Features").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("AI-Native")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("Ask Aura Chat")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("Smart Fill")).toBeVisible();
    await expect(page.getByText("Vector Search")).toBeVisible();
    await expect(page.getByText("Demand Forecasting")).toBeVisible();
  });

  test("should render Architecture slide with stack layers", async ({
    page,
  }) => {
    await page.getByLabel("Go to slide 10: Architecture").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("The Stack")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(
      page.getByText("Next.js 16 + React 19 + Tailwind 4")
    ).toBeVisible({ timeout: REVEAL_TIMEOUT });
    await expect(
      page.getByText("Supabase Postgres (42+ tables, RLS)")
    ).toBeVisible();
  });

  test("should render Platform Scale slide with metrics", async ({ page }) => {
    await page.getByLabel("Go to slide 11: Metrics").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("Platform Scale")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("LINES OF CODE")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("API ENDPOINTS")).toBeVisible();
    await expect(page.getByText("DATABASE TABLES")).toBeVisible();
    await expect(page.getByText("E2E TESTS")).toBeVisible();
  });

  test("should render Security slide", async ({ page }) => {
    await page.getByLabel("Go to slide 13: Security").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("Secure by Design")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(
      page.getByText("Rate Limiting on all API endpoints")
    ).toBeVisible({ timeout: REVEAL_TIMEOUT });
    await expect(
      page.getByText("Row Level Security on all tables")
    ).toBeVisible();
  });

  test("should render Roadmap slide with phases", async ({ page }) => {
    await page.getByLabel("Go to slide 15: Roadmap").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("Roadmap").first()).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("Core Platform")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
    await expect(page.getByText("Intelligence Layer")).toBeVisible();
    await expect(page.getByText("Scale Operations")).toBeVisible();
    await expect(page.getByText("Market Expansion")).toBeVisible();
  });

  test("should render CTA slide with contact info", async ({ page }) => {
    await page.getByLabel("Go to slide 18: CTA").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("gio@gvargas.com")).toBeVisible({
      timeout: REVEAL_TIMEOUT,
    });
  });

  test("should not show previous arrow on first slide", async ({ page }) => {
    await expect(page.getByLabel("Previous slide")).not.toBeVisible();
    await expect(page.getByLabel("Next slide")).toBeVisible();
  });

  test("should not show next arrow on last slide", async ({ page }) => {
    await page.getByLabel("Go to slide 18: CTA").click();
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByLabel("Next slide")).not.toBeVisible();
    await expect(page.getByLabel("Previous slide")).toBeVisible();
  });

  test("should navigate with spacebar", async ({ page }) => {
    await page.keyboard.press(" ");
    await page.waitForTimeout(TRANSITION_WAIT);
    await expect(page.getByText("02 / 18")).toBeVisible();
  });
});
