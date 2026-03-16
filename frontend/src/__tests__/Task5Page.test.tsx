import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import Task5Page from '../pages/Task5Page'
import { AuthProvider } from '../context/AuthContext'
import * as categoriesApi from '../api/categories'
import { createTestQueryClient } from './test-utils'

function makeJwt(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }))
  const body = btoa(JSON.stringify({ userId: 1, email: 'a@iis.hr', role, exp: Math.floor(Date.now() / 1000) + 900 }))
  return `${header}.${body}.sig`
}

const mockCategories: categoriesApi.Category[] = [
  { id: 1, name: 'Electronics', slug: 'electronics', description: 'Devices' },
  { id: 2, name: 'Books', slug: 'books', description: null },
]

function setupWithRole(role: string) {
  const token = makeJwt(role)
  window.localStorage.setItem('refreshToken', 'r')
  vi.spyOn(categoriesApi, 'getCategories').mockResolvedValue(mockCategories)

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: token, refreshToken: 'r', role }),
    })
  )

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AuthProvider>
          <Task5Page />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Task5Page', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders title and loads categories', async () => {
    setupWithRole('full-access')
    expect(screen.getByText(/Task 5/)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Books')).toBeInTheDocument()
    })
  })

  it('shows "Add an entry" button for full-access', async () => {
    setupWithRole('full-access')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add an entry/i })).toBeInTheDocument()
    })
  })

  it('hides "Add an entry" button for read-only', async () => {
    setupWithRole('read-only')
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add an entry/i })).not.toBeInTheDocument()
    })
  })

  it('opens create form when "Add an entry" is clicked', async () => {
    const user = userEvent.setup()
    setupWithRole('full-access')

    await waitFor(() => screen.getByRole('button', { name: /add an entry/i }))
    await user.click(screen.getByRole('button', { name: /add an entry/i }))

    expect(screen.getByText('New Category')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('category-slug')).toBeInTheDocument()
  })

  it('submits create form and reloads categories', async () => {
    const user = userEvent.setup()
    vi.spyOn(categoriesApi, 'createCategory').mockResolvedValue({
      id: 3, name: 'Music', slug: 'music', description: null,
    })
    setupWithRole('full-access')

    await waitFor(() => screen.getByRole('button', { name: /add an entry/i }))
    await user.click(screen.getByRole('button', { name: /add an entry/i }))

    await user.type(screen.getByPlaceholderText('Category name'), 'Music')
    await user.type(screen.getByPlaceholderText('category-slug'), 'music')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(categoriesApi.createCategory).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'Music', slug: 'music' })
      )
    })
  })

  it('opens edit form prefilled when Edit is clicked', async () => {
    const user = userEvent.setup()
    setupWithRole('full-access')

    await waitFor(() => screen.getAllByTitle('Edit'))
    await user.click(screen.getAllByTitle('Edit')[0])

    expect(screen.getByText('Edit Category')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument()
    expect(screen.getByDisplayValue('electronics')).toBeInTheDocument()
  })

  it('Cancel button closes the form', async () => {
    const user = userEvent.setup()
    setupWithRole('full-access')

    await waitFor(() => screen.getByRole('button', { name: /add an entry/i }))
    await user.click(screen.getByRole('button', { name: /add an entry/i }))
    expect(screen.getByText('New Category')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('New Category')).not.toBeInTheDocument()
  })

  it('GraphQL panel is collapsed by default', async () => {
    setupWithRole('full-access')
    await waitFor(() => screen.getByText('GraphQL Explorer'))
    expect(screen.queryByPlaceholderText(/query/i)).not.toBeInTheDocument()
  })

  it('GraphQL panel expands and shows textarea', async () => {
    const user = userEvent.setup()
    setupWithRole('full-access')

    await waitFor(() => screen.getByText('Expand query editor'))
    await user.click(screen.getByText('Expand query editor'))

    expect(screen.getByRole('button', { name: /run query/i })).toBeInTheDocument()
  })

  it('GraphQL query is submitted and result displayed', async () => {
    const user = userEvent.setup()
    const token = makeJwt('full-access')
    window.localStorage.setItem('refreshToken', 'r')
    vi.spyOn(categoriesApi, 'getCategories').mockResolvedValue([])

    // Route by URL so auth refresh can be called any number of times
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ accessToken: token, refreshToken: 'r', role: 'full-access' }),
        })
      }
      // GraphQL endpoint
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { categories: [] } }),
      })
    }))

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <Task5Page />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => screen.getByText('Expand query editor'))
    await user.click(screen.getByText('Expand query editor'))
    await user.click(screen.getByRole('button', { name: /run query/i }))

    await waitFor(() => {
      const pre = document.querySelector('pre')
      expect(pre).toBeTruthy()
      expect(pre!.textContent).toContain('"categories"')
    })
  })
})
