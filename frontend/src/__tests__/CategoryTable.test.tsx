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
  it('renders category names in the table', () => {
    render(
      <CategoryTable
        categories={mockCategories}
        canWrite={true}
      />
    )
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
  })

  it('renders slugs and descriptions', () => {
    render(
      <CategoryTable
        categories={mockCategories}
        canWrite={true}
      />
    )
    expect(screen.getByText('electronics')).toBeInTheDocument()
    expect(screen.getByText('Electronic devices')).toBeInTheDocument()
  })

  it('shows Edit and Delete buttons when onEdit and onDelete provided with full-access role', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <CategoryTable
        categories={mockCategories}
        onEdit={onEdit}
        onDelete={onDelete}
        canWrite={true}
      />
    )

    // Buttons use emoji (✏️ for edit, 🗑 for delete)
    const editButtons = screen.getAllByTitle('Edit')
    const deleteButtons = screen.getAllByTitle('Delete')

    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)

    // Buttons should be enabled
    editButtons.forEach((btn) => expect(btn).not.toBeDisabled())
    deleteButtons.forEach((btn) => expect(btn).not.toBeDisabled())
  })

  it('shows disabled Edit and Delete buttons for read-only role (canWrite=false)', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <CategoryTable
        categories={mockCategories}
        onEdit={onEdit}
        onDelete={onDelete}
        canWrite={false}
      />
    )

    // Buttons should be disabled (canWrite=false) and titled "Insufficient permissions"
    const insufficientBtns = screen.getAllByTitle('Insufficient permissions')
    expect(insufficientBtns.length).toBeGreaterThanOrEqual(4) // 2 edit + 2 delete

    insufficientBtns.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('clicking Edit invokes onEdit with the correct category object', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <CategoryTable
        categories={mockCategories}
        onEdit={onEdit}
        canWrite={true}
      />
    )

    const editButtons = screen.getAllByTitle('Edit')
    await user.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(mockCategories[0])
  })

  it('clicking Delete invokes onDelete with the correct id', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <CategoryTable
        categories={mockCategories}
        onDelete={onDelete}
        canWrite={true}
      />
    )

    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[1])

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(2)
  })

  it('shows "No entries found" when categories array is empty', () => {
    render(
      <CategoryTable
        categories={[]}
        canWrite={true}
      />
    )
    expect(screen.getByText(/no entries found/i)).toBeInTheDocument()
  })

  it('does not show action buttons when no onEdit or onDelete provided', () => {
    render(
      <CategoryTable
        categories={mockCategories}
        canWrite={true}
      />
    )
    // No buttons should exist when neither handler is provided
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('filters categories by search input', async () => {
    const user = userEvent.setup()

    render(
      <CategoryTable
        categories={mockCategories}
        canWrite={true}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search entries...')
    await user.type(searchInput, 'electr')

    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.queryByText('Books')).not.toBeInTheDocument()
  })
})
