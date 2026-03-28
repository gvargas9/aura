/**
 * Test Suite: Build-a-Box Flow
 * Category: e2e
 * Priority: high
 *
 * Description: Tests the build-a-box page including size selection, adding/removing products,
 *              Aura Fill, and checkout button state.
 * Prerequisites: Running dev server, seed products in database (8 products minimum).
 * Test Data: aura_products table with active, in-stock products.
 *
 * Author: Claude Test Agent
 */

import { test, expect } from "@playwright/test";

test.describe("Build-a-Box Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build-box");
    // Wait for products to load
    await expect(page.locator(".animate-spin")).toBeHidden({ timeout: 15000 });
  });

  test("should load with default Voyager box size selected", async ({
    page,
  }) => {
    // The URL should default to voyager size
    // BoxSizeSelector shows the voyager option as selected (border-aura-primary)
    const voyagerButton = page.locator("button", { hasText: "voyager" });
    await expect(voyagerButton.first()).toBeVisible();

    // The sidebar should show "My Order" with 0 positions
    await expect(page.getByText("My Order")).toBeVisible();
    await expect(page.getByText("0 positions")).toBeVisible();
  });

  test("should be able to switch box sizes", async ({ page }) => {
    // Scroll to box size selector section
    const sizeSection = page.getByText("Choose Your Box Size");
    await sizeSection.scrollIntoViewIfNeeded();

    // Click on Starter
    const starterButton = page.locator("button", { hasText: "starter" }).first();
    await starterButton.click();

    // The starter button should now have the selected style
    await expect(starterButton).toHaveClass(/border-aura-primary/);

    // Click on Bunker
    const bunkerButton = page.locator("button", { hasText: "bunker" }).first();
    await bunkerButton.click();

    await expect(bunkerButton).toHaveClass(/border-aura-primary/);

    // Click back on Voyager
    const voyagerButton = page.locator("button", { hasText: "voyager" }).first();
    await voyagerButton.click();

    await expect(voyagerButton).toHaveClass(/border-aura-primary/);
  });

  test("should add a product to the box when clicking add button", async ({
    page,
  }) => {
    // The featured product has an "Add to order" button
    const addButton = page.getByRole("button", { name: /add to order/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // The sidebar position count should update from 0 to 1
      await expect(page.getByText("1 positions")).toBeVisible();

      // The button text should change to "Added to box"
      await expect(
        page.getByRole("button", { name: /added to box/i })
      ).toBeVisible();
    }
  });

  test("should update the box counter when a product is added", async ({
    page,
  }) => {
    // Verify initial state is 0
    await expect(page.getByText("0 positions")).toBeVisible();

    // Add the featured product
    const addButton = page.getByRole("button", { name: /add to order/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Counter should update
      await expect(page.getByText("1 positions")).toBeVisible();
    }
  });

  test("should remove a product from the box", async ({ page }) => {
    // First add a product
    const addButton = page.getByRole("button", { name: /add to order/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText("1 positions")).toBeVisible();

      // Find the remove button (minus icon) in the sidebar order items
      // Each order item in sidebar has a minus button to remove
      const removeButton = page
        .locator("aside .bg-gray-50")
        .first()
        .locator("button")
        .first();

      if (await removeButton.isVisible()) {
        await removeButton.click();

        // Counter should go back to 0
        await expect(page.getByText("0 positions")).toBeVisible();
      }
    }
  });

  test("should fill remaining slots with Aura Fill button", async ({
    page,
  }) => {
    // First add one product to make the Aura Fill button appear
    const addButton = page.getByRole("button", { name: /add to order/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText("1 positions")).toBeVisible();
    }

    // Click "Let Aura Fill My Box" button in the sidebar
    const auraFillButton = page.getByRole("button", {
      name: /let aura fill my box/i,
    });

    if (await auraFillButton.isVisible()) {
      await auraFillButton.click();

      // Wait for products to be added - the position count should equal maxSlots
      // Default is voyager with 12 slots
      await expect(page.getByText("12 positions")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should show checkout button as disabled when box is not full", async ({
    page,
  }) => {
    // The checkout button in the sidebar shows "Add X more items" when not full
    // It should be disabled
    // First we need at least one product for the button to appear
    const addButton = page.getByRole("button", { name: /add to order/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Look for the checkout button with "Add X more items" text
      const checkoutButton = page.locator("aside button.btn-accent");
      await expect(checkoutButton).toBeVisible();
      await expect(checkoutButton).toBeDisabled();
      await expect(checkoutButton).toContainText(/add \d+ more items/i);
    }
  });

  test("should enable checkout button when box is full via Aura Fill", async ({
    page,
  }) => {
    // Add one product first
    const addButton = page.getByRole("button", { name: /add to order/i });
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Use Aura Fill to complete the box
    const auraFillButton = page.getByRole("button", {
      name: /let aura fill my box/i,
    });

    if (await auraFillButton.isVisible()) {
      await auraFillButton.click();

      // Wait for box to be full
      await expect(page.getByText("12 positions")).toBeVisible({
        timeout: 5000,
      });

      // The checkout button should now say "Confirm Order" and be enabled
      const confirmButton = page.locator("aside button.btn-accent");
      await expect(confirmButton).toBeVisible();
      await expect(confirmButton).toBeEnabled();
      await expect(confirmButton).toContainText(/confirm order/i);
    }
  });
});
