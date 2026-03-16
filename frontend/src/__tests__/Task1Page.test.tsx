import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import Task1Page from '../pages/Task1Page'
import { AuthProvider } from '../context/AuthContext'
import { createTestQueryClient } from './test-utils'

function makeJwt(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }))
  const body = btoa(JSON.stringify({ userId: 1, email: 'a@iis.hr', role, exp: Math.floor(Date.now() / 1000) + 900 }))
  return `${header}.${body}.sig`
}

function setup(role: string) {
  const token = makeJwt(role)
  window.localStorage.setItem('refreshToken', 'r')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: token, refreshToken: 'r', role }),
    })
  )
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AuthProvider>
          <Task1Page />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Task1Page', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the page title', async () => {
    setup('full-access')
    expect(screen.getByText(/Task 1/)).toBeInTheDocument()
  })

  it('shows upload button enabled for full-access', async () => {
    setup('full-access')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload & validate/i })).not.toBeDisabled()
    })
  })

  it('disables upload button for read-only role', async () => {
    setup('read-only')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /read-only/i })).toBeDisabled()
    })
  })

  it('shows XML and JSON upload zones', () => {
    setup('full-access')
    expect(screen.getByText('XML File')).toBeInTheDocument()
    expect(screen.getByText('JSON File')).toBeInTheDocument()
  })

  it('displays success result after upload', async () => {
    const user = userEvent.setup()
    const token = makeJwt('full-access')
    window.localStorage.setItem('refreshToken', 'r')

    vi.stubGlobal(
      'fetch',
      vi.fn()
        // Auth refresh on mount
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: token, refreshToken: 'r', role: 'full-access' }),
        })
        // Upload response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 1, name: 'Test', slug: 'test' } }),
        })
    )

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <Task1Page />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const submitBtn = await screen.findByRole('button', { name: /upload & validate/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/category saved successfully/i)).toBeInTheDocument()
    })
  })

  it('displays validation errors on failed upload', async () => {
    const user = userEvent.setup()
    const token = makeJwt('full-access')
    window.localStorage.setItem('refreshToken', 'r')

    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: token, refreshToken: 'r', role: 'full-access' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ errors: ['Invalid XML structure', 'Missing required field: name'] }),
        })
    )

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <Task1Page />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const submitBtn = await screen.findByRole('button', { name: /upload & validate/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/validation errors/i)).toBeInTheDocument()
      expect(screen.getByText('Invalid XML structure')).toBeInTheDocument()
      expect(screen.getByText('Missing required field: name')).toBeInTheDocument()
    })
  })
})
