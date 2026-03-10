import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTable from '../components/CategoryTable'
import type { Category } from '../api/categories'

const mockCategories: Category[] = [
  { id: 1, name: 'Electronics', slug: 'electronics', description: 'Electronic devices' },
  { id: 2, name: 'Books', slug: 'books', description: null },
]

describe('CategoryTable', () => {
  it('renders category names', () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
  })

  it('renders slugs and descriptions', () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.getByText('electronics')).toBeInTheDocument()
    expect(screen.getByText('Electronic devices')).toBeInTheDocument()
  })

  it('shows enabled Edit and Delete buttons for full-access role', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <CategoryTable categories={mockCategories} onEdit={onEdit} onDelete={onDelete} canWrite={true} />
    )
    const editButtons = screen.getAllByTitle('Edit')
    const deleteButtons = screen.getAllByTitle('Delete')
    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
    editButtons.forEach((btn) => expect(btn).not.toBeDisabled())
    deleteButtons.forEach((btn) => expect(btn).not.toBeDisabled())
  })

  it('shows disabled buttons with "Insufficient permissions" title for read-only', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <CategoryTable categories={mockCategories} onEdit={onEdit} onDelete={onDelete} canWrite={false} />
    )
    const insufficient = screen.getAllByTitle('Insufficient permissions')
    expect(insufficient.length).toBeGreaterThanOrEqual(4)
    insufficient.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('clicking Edit calls onEdit with correct category', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <CategoryTable categories={mockCategories} onEdit={onEdit} canWrite={true} />
    )
    await user.click(screen.getAllByTitle('Edit')[0])
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(mockCategories[0])
  })

  it('clicking Delete calls onDelete with correct id', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <CategoryTable categories={mockCategories} onDelete={onDelete} canWrite={true} />
    )
    await user.click(screen.getAllByTitle('Delete')[1])
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(2)
  })

  it('shows "No entries found" for empty list', () => {
    render(<CategoryTable categories={[]} canWrite={true} />)
    expect(screen.getByText(/no entries found/i)).toBeInTheDocument()
  })

  it('does not show action buttons when no handlers provided', () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('filters categories by search input', async () => {
    const user = userEvent.setup()
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    await user.type(screen.getByPlaceholderText('Search entries...'), 'electr')
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.queryByText('Books')).not.toBeInTheDocument()
  })

  it('shows entry count in toolbar', () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.getByText(/2 entries found/i)).toBeInTheDocument()
  })

  it('shows singular "entry" for one result', async () => {
    const user = userEvent.setup()
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    await user.type(screen.getByPlaceholderText('Search entries...'), 'electronics')
    expect(screen.getByText(/1 entry found/i)).toBeInTheDocument()
  })
})
