import { Page } from "@playwright/test";

/**
 * Login as admin on the production site.
 * Uses the admin account: admin@inspiration-ai.com
 * READ-ONLY: This account is used only for viewing pages, never modifying data.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto("/auth/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "admin@inspiration-ai.com");
  await page.fill('input[type="password"]', "Inssigma@2");
  await page.locator('main button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}

/**
 * Collect console errors during a test for debugging.
 * Call at the start of each test to capture errors.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Check that all visible images have loaded (no broken images).
 */
export async function checkNoBrokenImages(page: Page): Promise<number> {
  const brokenCount = await page.evaluate(() => {
    const images = document.querySelectorAll("img");
    let broken = 0;
    images.forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith("data:")) {
        broken++;
      }
    });
    return broken;
  });
  return brokenCount;
}
