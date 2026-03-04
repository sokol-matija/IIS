import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Track slugs created during tests for cleanup
const testSlugs: string[] = []

beforeAll(async () => {
  // Clean up any leftover test upload categories
  await prisma.category.deleteMany({
    where: { slug: { startsWith: 'test-upload-' } },
  })
})

afterAll(async () => {
  // Clean up categories created by upload tests
  if (testSlugs.length > 0) {
    await prisma.category.deleteMany({
      where: { slug: { in: testSlugs } },
    })
  }
  await prisma.$disconnect()
})

function makeXmlBuffer(name: string, slug: string, description?: string): Buffer {
  const descEl = description ? `  <description>${description}</description>` : ''
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<category>
  <name>${name}</name>
  <slug>${slug}</slug>
${descEl}
</category>`)
}

function makeJsonBuffer(data: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(data))
}

describe('POST /api/upload', () => {
  it('returns 200/201 and creates entity with valid XML and JSON', async () => {
    const slug = 'test-upload-valid-1'
    testSlugs.push(slug)

    const res = await request(app)
      .post('/api/upload')
      .attach('xmlFile', makeXmlBuffer('Test Upload', slug, 'A test category'), {
        filename: 'category.xml',
        contentType: 'text/xml',
      })
      .attach('jsonFile', makeJsonBuffer({ name: 'Test Upload', slug, description: 'A test category' }), {
        filename: 'category.json',
        contentType: 'application/json',
      })

    expect(res.status).toBeLessThan(300)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data.slug).toBe(slug)
  })

  it('returns 400 with errors array when XML is missing name element', async () => {
    const slug = 'test-upload-invalid-xml'

    const invalidXml = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<category>
  <slug>${slug}</slug>
</category>`)

    const res = await request(app)
      .post('/api/upload')
      .attach('xmlFile', invalidXml, {
        filename: 'category.xml',
        contentType: 'text/xml',
      })
      .attach('jsonFile', makeJsonBuffer({ name: 'Test', slug }), {
        filename: 'category.json',
        contentType: 'application/json',
      })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
    expect(Array.isArray(res.body.errors)).toBe(true)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('returns 400 with errors array when JSON has empty name (fails minLength)', async () => {
    const slug = 'test-upload-empty-name'

    const res = await request(app)
      .post('/api/upload')
      .attach('xmlFile', makeXmlBuffer('Test', slug), {
        filename: 'category.xml',
        contentType: 'text/xml',
      })
      .attach('jsonFile', makeJsonBuffer({ name: '', slug }), {
        filename: 'category.json',
        contentType: 'application/json',
      })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
    expect(Array.isArray(res.body.errors)).toBe(true)
    expect(res.body.errors.some((e: string) => e.includes('JSON'))).toBe(true)
  })

  it('returns 400 when JSON has additional unknown properties', async () => {
    const slug = 'test-upload-extra-props'

    const res = await request(app)
      .post('/api/upload')
      .attach('xmlFile', makeXmlBuffer('Test', slug), {
        filename: 'category.xml',
        contentType: 'text/xml',
      })
      .attach('jsonFile', makeJsonBuffer({ name: 'Test', slug, unknownField: 'bad' }), {
        filename: 'category.json',
        contentType: 'application/json',
      })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
    expect(Array.isArray(res.body.errors)).toBe(true)
  })

  it('returns 400 when neither file is provided', async () => {
    const res = await request(app).post('/api/upload')

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })
})
