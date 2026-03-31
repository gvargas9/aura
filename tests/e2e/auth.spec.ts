/**
 * Test Suite: Authentication Flows
 * Category: e2e
 * Priority: high
 *
 * Description: Tests login, signup, forgot-password pages and protected route redirects.
 * Prerequisites: Running dev server at localhost:3000, admin user seeded in Supabase.
 * Test Data: admin@inspiration-ai.com / Inssigma@2
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Authentication Flows", () => {
  test.describe("Login Page", () => {
    test("should render the login form with all expected elements", async ({
      page,
    }) => {
      await page.goto("/auth/login");

      // Page title / heading
      await expect(page.getByText("Welcome Back")).toBeVisible();
      await expect(
        page.getByText("Sign in to your Aura account to continue")
      ).toBeVisible();

      // Email and password fields
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      // Sign In button
      await expect(
        page.locator('button[type="submit"]', { hasText: "Sign In" })
      ).toBeVisible();

      // Google sign-in button
      await expect(
        page.getByRole("button", { name: /continue with google/i })
      ).toBeVisible();

      // Remember me checkbox
      await expect(page.getByText("Remember me")).toBeVisible();

      // Forgot password link
      await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();

      // Sign up link
      await expect(
        page.getByRole("link", { name: /sign up for free/i })
      ).toBeVisible();
    });

    test("should login with valid admin credentials and redirect to dashboard", async ({
      page,
    }) => {
      await loginAsAdmin(page);

      // Verify we landed on the dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/welcome back/i)).toBeVisible({
        timeout: 10000,
      });
    });

    test("should show error message with invalid credentials", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.fill('input[type="email"]', "invalid@example.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.locator('main button[type="submit"]').click();

      // Expect an error message to appear
      await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Signup Page", () => {
    test("should render the signup form with expected fields", async ({
      page,
    }) => {
      await page.goto("/auth/signup");

      // Heading
      await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();

      // Form fields - full name, email, password, confirm password
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();

      // Submit button (scoped to main to avoid AuraChatWidget submit)
      await expect(page.locator('main button[type="submit"]')).toBeVisible();
    });
  });

  test.describe("Forgot Password Page", () => {
    test("should render the forgot password form", async ({ page }) => {
      await page.goto("/auth/forgot-password");

      // Email input should be present
      await expect(page.locator('input[type="email"]')).toBeVisible();

      // Submit button (scoped to main to avoid AuraChatWidget submit)
      await expect(page.locator('main button[type="submit"]')).toBeVisible();

      // Back to login link (scoped to main to avoid header Sign In link)
      await expect(page.locator('main').getByRole("link", { name: /back to sign in/i })).toBeVisible();
    });
  });

  test.describe("Protected Route Redirects", () => {
    test("should redirect /dashboard to login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/dashboard");

      // Should redirect to login page with redirectTo param
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    });

    test("should redirect /orders to login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/orders");

      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    });

    test("should redirect /account to login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/account");

      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    });
  });
});
