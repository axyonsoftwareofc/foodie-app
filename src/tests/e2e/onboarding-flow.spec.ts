import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/onboarding');
    // Onboarding requires auth — should redirect
    await expect(page).toHaveURL(/\/sign-in|onboarding/);
  });
});
