/**
 * Strapi Integration Tests
 *
 * Tests CRUD operations against the live Strapi instance (http://localhost:1337)
 * and the backend toggle that switches between custom API and Strapi.
 *
 * Requires: Strapi running on port 1337
 * Skip gracefully if Strapi is not available.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app'

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const JWT_SECRET = process.env.JWT_SECRET!

function makeToken(role: string): string {
  return jwt.sign(
    { userId: 1, email: `${role}@test.hr`, role },
    JWT_SECRET,
    { expiresIn: '15m' }
  )
}

const fullToken = makeToken('full-access')

// Check Strapi availability before running tests
let strapiAvailable = false

beforeAll(async () => {
  try {
    const res = await fetch(`${STRAPI_URL}/api/categories`, { signal: AbortSignal.timeout(3000) })
    strapiAvailable = res.ok
  } catch {
    strapiAvailable = false
  }
})

// Restore custom API mode after all tests
afterAll(async () => {
  await request(app)
    .put('/api/settings')
    .send({ useCustomApi: true })
})

// Reset to custom API before each test
beforeEach(async () => {
  await request(app)
    .put('/api/settings')
    .send({ useCustomApi: true })
})

// ─── Direct Strapi API Tests ──────────────────────────────────────────────────

describe('Strapi direct API', () => {
  it('GET /api/categories returns 200 without auth (public access)', async () => {
    if (!strapiAvailable) return

    const res = await fetch(`${STRAPI_URL}/api/categories`)
    expect(res.status).toBe(200)
    const body = await res.json() as { data: unknown[] }
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns at least 1 category (seeded data)', async () => {
    if (!strapiAvailable) return

    const res = await fetch(`${STRAPI_URL}/api/categories`)
    const body = await res.json() as { data: { id: number; attributes?: { name: string }; name?: string }[] }
    expect(body.data.length).toBeGreaterThan(0)
  })

  it('each category has name and slug fields', async () => {
    if (!strapiAvailable) return

    const res = await fetch(`${STRAPI_URL}/api/categories`)
    const body = await res.json() as { data: Record<string, unknown>[] }
    const first = body.data[0]
    // Strapi v4 uses attributes, v5 puts fields directly
    const hasName = 'name' in first || ('attributes' in first && typeof first.attributes === 'object' && first.attributes !== null && 'name' in (first.attributes as Record<string, unknown>))
    expect(hasName).toBe(true)
  })

  it('GET /api/categories/:documentId returns single category', async () => {
    if (!strapiAvailable) return

    // Fetch list first to get a real documentId
    const listRes = await fetch(`${STRAPI_URL}/api/categories`)
    const list = await listRes.json() as { data: { documentId?: string; id: number }[] }
    const first = list.data[0]
    const idParam = first.documentId || first.id

    const res = await fetch(`${STRAPI_URL}/api/categories/${idParam}`)
    expect(res.status).toBe(200)
    const body = await res.json() as { data: unknown }
    expect(body).toHaveProperty('data')
  })

  it('POST /api/categories without auth returns 401 or 403 (write is protected)', async () => {
    if (!strapiAvailable) return

    const res = await fetch(`${STRAPI_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { name: 'Unauthorized', slug: 'unauthorized' } }),
    })
    expect([401, 403]).toContain(res.status)
  })
})

// ─── Backend Toggle Tests ─────────────────────────────────────────────────────

describe('Backend API toggle — switching to Strapi', () => {
  it('GET /api/settings returns current toggle state', async () => {
    const res = await request(app).get('/api/settings')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('useCustomApi')
    expect(typeof res.body.useCustomApi).toBe('boolean')
  })

  it('PUT /api/settings toggles to Strapi mode', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ useCustomApi: false })

    expect(res.status).toBe(200)
    expect(res.body.useCustomApi).toBe(false)
  })

  it('PUT /api/settings toggles back to custom mode', async () => {
    await request(app).put('/api/settings').send({ useCustomApi: false })

    const res = await request(app)
      .put('/api/settings')
      .send({ useCustomApi: true })

    expect(res.status).toBe(200)
    expect(res.body.useCustomApi).toBe(true)
  })

  it('GET /api/categories proxies to Strapi when toggle is off', async () => {
    if (!strapiAvailable) return

    await request(app).put('/api/settings').send({ useCustomApi: false })

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)

    expect(res.status).toBe(200)
    // Strapi returns { data: [...] }
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('GET /api/categories returns custom DB data when toggle is on', async () => {
    await request(app).put('/api/settings').send({ useCustomApi: true })

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
  })

  it('Strapi and custom API both return category data (toggle comparison)', async () => {
    if (!strapiAvailable) return

    // Custom API
    await request(app).put('/api/settings').send({ useCustomApi: true })
    const customRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)

    // Strapi API
    await request(app).put('/api/settings').send({ useCustomApi: false })
    const strapiRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)

    // Both should return data
    expect(customRes.body.data.length).toBeGreaterThan(0)
    expect(strapiRes.body.data.length).toBeGreaterThan(0)
  })
})

// ─── Strapi CRUD via Admin API ────────────────────────────────────────────────

describe('Strapi CRUD via admin API token', () => {
  let adminToken: string
  let createdDocumentId: string | null = null

  beforeAll(async () => {
    if (!strapiAvailable) return
    try {
      // Login as Strapi admin
      const res = await fetch(`${STRAPI_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@strapi.hr', password: 'Admin1234!' }),
      })
      if (res.ok) {
        const body = await res.json() as { data: { token: string } }
        adminToken = body.data?.token
      }
    } catch {
      adminToken = ''
    }
  })

  afterAll(async () => {
    // Clean up created test category
    if (!strapiAvailable || !adminToken || !createdDocumentId) return
    await fetch(`${STRAPI_URL}/api/categories/${createdDocumentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  })

  it('POST creates a new category (admin token)', async () => {
    if (!strapiAvailable || !adminToken) return

    const slug = `test-strapi-${Date.now()}`
    const res = await fetch(`${STRAPI_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ data: { name: 'Test Strapi Category', slug, description: 'Created by test' } }),
    })

    expect([200, 201]).toContain(res.status)
    const body = await res.json() as { data: { documentId?: string; id: number; name?: string; attributes?: { name: string } } }
    expect(body).toHaveProperty('data')
    createdDocumentId = body.data.documentId || String(body.data.id)
  })

  it('PUT updates the created category (admin token)', async () => {
    if (!strapiAvailable || !adminToken || !createdDocumentId) return

    const res = await fetch(`${STRAPI_URL}/api/categories/${createdDocumentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ data: { name: 'Updated Strapi Category' } }),
    })

    expect([200, 201]).toContain(res.status)
    const body = await res.json() as { data: { name?: string; attributes?: { name: string } } }
    const name = body.data.name ?? (body.data.attributes as { name: string } | undefined)?.name
    expect(name).toBe('Updated Strapi Category')
  })

  it('DELETE removes the created category (admin token)', async () => {
    if (!strapiAvailable || !adminToken || !createdDocumentId) return

    const res = await fetch(`${STRAPI_URL}/api/categories/${createdDocumentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect([200, 204]).toContain(res.status)
    createdDocumentId = null // mark as cleaned up
  })
})
