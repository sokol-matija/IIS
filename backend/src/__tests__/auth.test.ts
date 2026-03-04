import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

describe('POST /auth/login', () => {
  it('returns 200 with accessToken, refreshToken, and role for valid admin credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@iis.hr', password: 'admin123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
    expect(res.body).toHaveProperty('role', 'full-access')
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@iis.hr', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'unknown@iis.hr', password: 'admin123' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('decoded access token has correct email and role fields', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@iis.hr', password: 'admin123' })

    expect(res.status).toBe(200)
    const decoded = jwt.verify(res.body.accessToken, JWT_SECRET) as {
      email: string
      role: string
      userId: number
    }
    expect(decoded.email).toBe('admin@iis.hr')
    expect(decoded.role).toBe('full-access')
    expect(decoded.userId).toBeTypeOf('number')
  })
})

describe('POST /auth/refresh', () => {
  it('returns 200 with new accessToken for valid refresh token', async () => {
    // Get a refresh token first
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@iis.hr', password: 'admin123' })

    const { refreshToken } = loginRes.body

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    // The new access token should be verifiable
    const decoded = jwt.verify(res.body.accessToken, JWT_SECRET) as { email: string }
    expect(decoded.email).toBe('admin@iis.hr')
  })

  it('returns 401 for garbage token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'garbage.token.value' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when refresh token is missing', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({})

    expect(res.status).toBe(400)
  })
})
