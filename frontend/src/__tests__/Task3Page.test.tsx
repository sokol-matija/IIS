import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import Task3Page from '../pages/Task3Page'
import { AuthProvider } from '../context/AuthContext'
import { createTestQueryClient } from './test-utils'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Task3Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
  })

  it('renders title and Validate button', () => {
    render(<Task3Page />, { wrapper: Wrapper })
    expect(screen.getByText(/Task 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run validation/i })).toBeInTheDocument()
  })

  it('renders Generate XML button', () => {
    render(<Task3Page />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /generate xml/i })).toBeInTheDocument()
  })

  it('shows "XML is valid" when validation passes', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, errors: [] }),
      })
    )

    render(<Task3Page />, { wrapper: Wrapper })
    await user.click(screen.getByRole('button', { name: /run validation/i }))

    await waitFor(() => {
      expect(screen.getByText(/xml is valid/i)).toBeInTheDocument()
    })
  })

  it('shows "XML validation failed" with errors when validation fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          valid: false,
          errors: ['Element name is missing', 'Invalid attribute type'],
        }),
      })
    )

    render(<Task3Page />, { wrapper: Wrapper })
    await user.click(screen.getByRole('button', { name: /run validation/i }))

    await waitFor(() => {
      expect(screen.getByText(/xml validation failed/i)).toBeInTheDocument()
      expect(screen.getByText('Element name is missing')).toBeInTheDocument()
      expect(screen.getByText('Invalid attribute type')).toBeInTheDocument()
    })
  })

  it('shows server error when fetch fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    render(<Task3Page />, { wrapper: Wrapper })
    await user.click(screen.getByRole('button', { name: /run validation/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to contact server/i)).toBeInTheDocument()
    })
  })

  it('Generate XML shows success message', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'XML generated successfully' }),
      })
    )

    render(<Task3Page />, { wrapper: Wrapper })
    await user.click(screen.getByRole('button', { name: /generate xml/i }))

    await waitFor(() => {
      expect(screen.getByText('XML generated successfully')).toBeInTheDocument()
    })
  })
})
