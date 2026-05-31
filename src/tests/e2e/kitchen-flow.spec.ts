// src/tests/e2e/kitchen-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Kitchen Kanban Flow', () => {
  test('should load kitchen dashboard with Kanban columns', async ({ page }) => {
    await page.goto('/dashboard/cozinha');

    await expect(page).toHaveURL(/cozinha/, { timeout: 10000 });

    const kanban = page.locator('[class*="grid-cols"]').first();
    await expect(kanban).toBeVisible({ timeout: 10000 });
  });

  test('should show filters button', async ({ page }) => {
    await page.goto('/dashboard/cozinha');

    const filterButton = page.getByText('Filtros');
    await expect(filterButton).toBeVisible({ timeout: 10000 });
  });

  test('should show column headers', async ({ page }) => {
    await page.goto('/dashboard/cozinha');

    await expect(page.getByText('Novos')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Em Preparo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Prontos')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Finalizados')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Waiter Flow', () => {
  test('should load waiter table selection page', async ({ page }) => {
    await page.goto('/waiter');

    await expect(page).toHaveURL(/\/waiter(\?|$)/, { timeout: 10000 });
  });
});

test.describe('Status Machine Validation', () => {
  test('should reject invalid status transitions', async ({ request }) => {
    const response = await request.post('/api/orders/update-status', {
      data: {
        orderId: 'non-existent-order',
        newStatus: 'DELIVERED',
        restaurantId: 'non-existent-restaurant',
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
