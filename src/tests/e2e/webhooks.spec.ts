import { test, expect } from '@playwright/test'
import Stripe from 'stripe'

test.describe('Webhook Endpoints', () => {
    const stripeWebhookSecret = 'whsec_test_secret_for_e2e_stripe'
    const mpWebhookSecret = 'mp_test_secret_for_e2e_mp'
    const stripeSecretKey = 'sk_test_000000000000000000000000000000000000000000000000'

    test.describe('Stripe Webhook', () => {
        test('returns 400 when stripe-signature header is missing', async ({ request }) => {
            const response = await request.post('/api/webhooks/stripe', {
                data: '{}',
            })
            expect(response.status()).toBe(400)
            const body = await response.json()
            expect(body.error).toContain('Missing stripe-signature')
        })

        test('returns 400 for invalid stripe-signature', async ({ request }) => {
            const response = await request.post('/api/webhooks/stripe', {
                headers: {
                    'stripe-signature': 'invalid-signature',
                },
                data: '{}',
            })
            expect(response.status()).toBe(400)
            const body = await response.json()
            expect(body.error).toContain('Invalid signature')
        })

        test('returns 200 and acknowledges valid Stripe event', async ({ request }) => {
            const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })

            const payload = JSON.stringify({
                id: 'evt_test_123',
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_123',
                        metadata: {},
                    },
                },
            })

            const signature = stripe.webhooks.generateTestHeaderString({
                payload,
                secret: stripeWebhookSecret,
            })

            const response = await request.post('/api/webhooks/stripe', {
                headers: {
                    'stripe-signature': signature,
                },
                data: payload,
            })

            expect(response.status()).toBe(200)
            const body = await response.json()
            expect(body.received).toBe(true)
        })
    })

    test.describe('MercadoPago Webhook', () => {
        test('returns 401 for invalid query secret', async ({ request }) => {
            const response = await request.post('/api/webhooks/mercadopago?secret=wrong-secret')
            expect(response.status()).toBe(401)
            const body = await response.json()
            expect(body.error).toContain('Invalid secret')
        })

        test('returns 400 for invalid payload', async ({ request }) => {
            const response = await request.post('/api/webhooks/mercadopago?secret=' + mpWebhookSecret, {
                data: { foo: 'bar' },
            })
            expect(response.status()).toBe(400)
            const body = await response.json()
            expect(body.error).toContain('Invalid payload')
        })

        test('returns 502 when MP API verification fails', async ({ request }) => {
            const response = await request.post('/api/webhooks/mercadopago?secret=' + mpWebhookSecret, {
                data: {
                    type: 'payment',
                    data: { id: '123456789' },
                },
            })
            expect(response.status()).toBe(502)
            const body = await response.json()
            expect(body.error).toContain('Failed to verify payment')
        })
    })
})
