import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import app from '../app'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET!

function makeToken(role: string): string {
  return jwt.sign({ userId: role === 'full-access' ? 1 : 2, email: `${role}@test.hr`, role }, JWT_SECRET, {
    expiresIn: '15m',
  })
}

const fullToken = makeToken('full-access')
const readToken = makeToken('read-only')

// Keep track of created category IDs for cleanup
const createdIds: number[] = []

afterAll(async () => {
  if (createdIds.length > 0) {
    await prisma.category.deleteMany({ where: { id: { in: createdIds } } })
  }
  await prisma.$disconnect()
})

describe('GET /api/categories', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(401)
  })

  it('returns 200 with data array for valid full-access token', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('returns 200 with data array for read-only token', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${readToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
  })
})

describe('GET /api/categories/:id', () => {
  it('returns 404 for non-existent category', async () => {
    const res = await request(app)
      .get('/api/categories/999999')
      .set('Authorization', `Bearer ${fullToken}`)

    expect(res.status).toBe(404)
  })
})

describe('POST /api/categories', () => {
  it('returns 201 and creates category with full-access token', async () => {
    const slug = `test-cat-${Date.now()}`
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)
      .send({ name: 'Test Category', slug, description: 'A test' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data.slug).toBe(slug)
    createdIds.push(res.body.data.id)
  })

  it('returns 403 with read-only token', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${readToken}`)
      .send({ name: 'Test', slug: `read-only-test-${Date.now()}` })

    expect(res.status).toBe(403)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)
      .send({ slug: 'no-name-slug' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/categories/:id', () => {
  it('returns 200 and updates category with full-access token', async () => {
    // First create a category to update
    const slug = `test-update-${Date.now()}`
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)
      .send({ name: 'Before Update', slug })

    expect(createRes.status).toBe(201)
    const id = createRes.body.data.id
    createdIds.push(id)

    const res = await request(app)
      .put(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${fullToken}`)
      .send({ name: 'After Update' })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('After Update')
  })
})

describe('DELETE /api/categories/:id', () => {
  it('returns 200 or 204 and deletes category with full-access token', async () => {
    // Create a category to delete
    const slug = `test-delete-${Date.now()}`
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${fullToken}`)
      .send({ name: 'To Delete', slug })

    expect(createRes.status).toBe(201)
    const id = createRes.body.data.id

    const res = await request(app)
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${fullToken}`)

    expect([200, 204]).toContain(res.status)
    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${fullToken}`)
    expect(getRes.status).toBe(404)
  })
})
