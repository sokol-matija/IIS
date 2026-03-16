import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import Task4Page from '../pages/Task4Page'
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

describe('Task4Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
  })

  it('renders title and city input', () => {
    render(<Task4Page />, { wrapper: Wrapper })
    expect(screen.getByText(/Task 4/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/city name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get temperature/i })).toBeInTheDocument()
  })

  it('shows empty state prompt initially', () => {
    render(<Task4Page />, { wrapper: Wrapper })
    expect(screen.getByText(/enter a city name to search weather stations/i)).toBeInTheDocument()
  })

  it('fetches weather and renders station cards', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          stations: [
            { city: 'Zagreb', temperature: '18', description: 'Partly cloudy' },
            { city: 'Zagreb-Maksimir', temperature: '17', description: 'Clear' },
          ],
        }),
      })
    )

    render(<Task4Page />, { wrapper: Wrapper })
    await user.type(screen.getByPlaceholderText(/city name/i), 'Zagreb')
    await user.click(screen.getByRole('button', { name: /get temperature/i }))

    await waitFor(() => {
      expect(screen.getByText('Zagreb')).toBeInTheDocument()
      expect(screen.getByText('Zagreb-Maksimir')).toBeInTheDocument()
      expect(screen.getByText('18 °C')).toBeInTheDocument()
    })
  })

  it('shows error when request fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'gRPC service unavailable' }),
      })
    )

    render(<Task4Page />, { wrapper: Wrapper })
    await user.type(screen.getByPlaceholderText(/city name/i), 'Zagreb')
    await user.click(screen.getByRole('button', { name: /get temperature/i }))

    await waitFor(() => {
      expect(screen.getByText('gRPC service unavailable')).toBeInTheDocument()
    })
  })

  it('shows error on network failure', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    render(<Task4Page />, { wrapper: Wrapper })
    await user.type(screen.getByPlaceholderText(/city name/i), 'Zagreb')
    await user.click(screen.getByRole('button', { name: /get temperature/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
    })
  })

  it('query includes the city name in the URL', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stations: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<Task4Page />, { wrapper: Wrapper })
    await user.type(screen.getByPlaceholderText(/city name/i), 'Osijek')
    await user.click(screen.getByRole('button', { name: /get temperature/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('city=Osijek'))
    })
  })
})
