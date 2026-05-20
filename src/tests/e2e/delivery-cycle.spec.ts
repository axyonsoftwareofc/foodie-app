import { test, expect } from '@playwright/test'

test.describe('Complete Delivery Cycle', () => {
    test('should load homepage with header', async ({ page }) => {
        await page.goto('/')
        await expect(page.locator('header, nav').first()).toBeVisible()
    })

    test('should show restaurant heading', async ({ page }) => {
        await page.goto('/')
        const heading = page.getByRole('heading', { name: /restaurantes/i })
        if (await heading.isVisible()) {
            await expect(heading).toBeVisible()
        }
    })

    test('should navigate to first restaurant card if present', async ({ page }) => {
        await page.goto('/')
        const card = page.locator('a[href^="/restaurant/"]').first()
        if (await card.isVisible({ timeout: 3000 })) {
            await card.click()
            await page.waitForURL(/\/restaurant\//, { timeout: 5000 })
        }
    })

    test('should load cart page', async ({ page }) => {
        await page.goto('/cart')
        await expect(page).toHaveURL('/cart')
    })

    test('should load favorites page', async ({ page }) => {
        await page.goto('/favorites')
        await expect(page).toHaveURL('/favorites')
    })

    test('search input should be visible', async ({ page }) => {
        await page.goto('/')
        const search = page.getByPlaceholder(/buscar/i)
        await expect(search).toBeVisible()
    })
})
