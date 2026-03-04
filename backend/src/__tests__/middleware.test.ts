import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, requireWriteAccess } from '../middleware/auth'

const JWT_SECRET = process.env.JWT_SECRET!

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as Request
}

function mockRes(): { res: Response; statusCode: number | null; jsonBody: unknown } {
  const state: { statusCode: number | null; jsonBody: unknown } = {
    statusCode: null,
    jsonBody: null,
  }
  const res = {
    status(code: number) {
      state.statusCode = code
      return res
    },
    json(body: unknown) {
      state.jsonBody = body
      return res
    },
  } as unknown as Response
  return { res, ...state, get statusCode() { return state.statusCode }, get jsonBody() { return state.jsonBody } }
}

describe('authenticate middleware', () => {
  it('returns 401 when no Authorization header', () => {
    const req = mockReq()
    const mock = mockRes()
    const next = vi.fn()

    authenticate(req, mock.res, next as NextFunction)

    expect(mock.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for malformed token (not Bearer format)', () => {
    const req = mockReq({ headers: { authorization: 'Basic sometoken' } })
    const mock = mockRes()
    const next = vi.fn()

    authenticate(req, mock.res, next as NextFunction)

    expect(mock.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() and sets req.user for valid token', () => {
    const payload = { userId: 1, email: 'admin@iis.hr', role: 'full-access' }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })
    const mock = mockRes()
    const next = vi.fn()

    authenticate(req, mock.res, next as NextFunction)

    expect(next).toHaveBeenCalledOnce()
    expect(req.user).toBeDefined()
    expect(req.user!.email).toBe('admin@iis.hr')
    expect(req.user!.role).toBe('full-access')
  })

  it('returns 401 for an expired token', () => {
    const payload = { userId: 1, email: 'admin@iis.hr', role: 'full-access' }
    // expiresIn of 0 seconds means it's already expired
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 0 })
    // small delay to ensure expiry
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } })
    const mock = mockRes()
    const next = vi.fn()

    // Wait a tick to ensure expiry
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        authenticate(req, mock.res, next as NextFunction)
        expect(mock.statusCode).toBe(401)
        expect(next).not.toHaveBeenCalled()
        resolve()
      }, 1100)
    })
  })
})

describe('requireWriteAccess middleware', () => {
  it('returns 403 for read-only user', () => {
    const req = mockReq({
      user: { userId: 2, email: 'reader@iis.hr', role: 'read-only' },
    } as Partial<Request>)
    const mock = mockRes()
    const next = vi.fn()

    requireWriteAccess(req, mock.res, next as NextFunction)

    expect(mock.statusCode).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() for full-access user', () => {
    const req = mockReq({
      user: { userId: 1, email: 'admin@iis.hr', role: 'full-access' },
    } as Partial<Request>)
    const mock = mockRes()
    const next = vi.fn()

    requireWriteAccess(req, mock.res, next as NextFunction)

    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 401 when user is not set', () => {
    const req = mockReq()
    const mock = mockRes()
    const next = vi.fn()

    requireWriteAccess(req, mock.res, next as NextFunction)

    expect(mock.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })
})
