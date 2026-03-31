import { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "admin@inspiration-ai.com");
  await page.fill('input[type="password"]', "Inssigma@2");
  await page.locator('main button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 30000 });
}
