
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display header', async ({ page }) => {
        await expect(page.getByText('Foodie')).toBeVisible();
    });

    test('should display promo banner', async ({ page }) => {
        await expect(page.getByText('50% OFF').or(page.getByText(/promo/i))).toBeVisible()
    });

    test('should display categories', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Pizza/ })).toBeVisible()
        await expect(page.getByRole('button', { name: /Burger/ })).toBeVisible()
    });

    test('should display restaurants', async ({ page }) => {
        await expect(page.getByText('Burger King').first()).toBeVisible()
        await expect(page.getByText('Pizza Hut').first()).toBeVisible()
    });

    test('should navigate to restaurant page', async ({ page }) => {
        const card = page.locator('a[href^="/restaurant/"]').first()
        if (await card.isVisible()) {
            await card.click()
            await expect(page).toHaveURL(/\/restaurant\//)
        }
    });
});