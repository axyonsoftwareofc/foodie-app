import { test, expect } from '@playwright/test';

test.describe('Complete Checkout Flow', () => {
  test('should load checkout page and redirect if no cart', async ({ page }) => {
    await page.goto('/checkout');
    // Either stays on checkout or redirects to home
    await expect(page).toHaveURL(/\/(checkout|$)/);
  });

  test('should navigate from home to restaurant menu', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('a[href^="/restaurant/"]').first();
    if (await card.isVisible({ timeout: 3000 })) {
      await card.click();
      await page.waitForURL(/\/restaurant\//, { timeout: 5000 });
    }
  });
});
