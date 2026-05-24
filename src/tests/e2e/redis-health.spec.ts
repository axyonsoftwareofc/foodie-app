import { test, expect } from '@playwright/test'

const redisConfigured = !!process.env.REDIS_URL && !!process.env.REDIS_TOKEN

test.describe('Redis Health', () => {
    test('returns success when Redis is configured and operational', async ({ request }) => {
        const response = await request.get('/api/test-redis')

        // Se Redis nao estiver configurado, endpoint retorna 503
        // Neste caso, pulamos validacoes rigorosas para nao quebrar CI sem Redis
        if (response.status() === 503) {
            const body = await response.json()
            expect(body.success).toBe(false)
            expect(body.error).toContain('nao configurado')
            test.skip(!redisConfigured, 'Redis nao configurado neste ambiente')
            return
        }

        expect(response.status()).toBe(200)

        const body = await response.json()
        expect(body.success).toBe(true)
        expect(body.message).toBe('Redis conectado e operacional')
        expect(body.operations).toMatchObject({
            set: true,
            get: true,
            del: true,
        })
        expect(body.env.hasUrl).toBe(true)
        expect(body.env.hasToken).toBe(true)
    })
})
