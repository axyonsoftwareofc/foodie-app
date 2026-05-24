
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './src/tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 13'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        env: {
            STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_for_e2e_stripe',
            STRIPE_SECRET_KEY: 'sk_test_000000000000000000000000000000000000000000000000',
            STRIPE_API_VERSION: '2024-12-18.acacia',
            MERCADOPAGO_WEBHOOK_SECRET: 'mp_test_secret_for_e2e_mp',
            MERCADOPAGO_ACCESS_TOKEN: 'TEST-0000000000000000-000000',
        },
    },
});