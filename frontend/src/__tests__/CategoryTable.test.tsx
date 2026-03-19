import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CategoryTable from "../components/CategoryTable"
import type { Category } from "../api/categories"

const mockCategories: Category[] = [
  { id: 1, name: "Electronics", slug: "electronics", description: "Electronic devices" },
  { id: 2, name: "Books", slug: "books", description: null },
]

describe("CategoryTable", () => {
  it("renders category names", () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.getByText("Electronics")).toBeInTheDocument()
    expect(screen.getByText("Books")).toBeInTheDocument()
  })

  it("renders slugs and descriptions", () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.getByText("electronics")).toBeInTheDocument()
    expect(screen.getByText("Electronic devices")).toBeInTheDocument()
  })

  it("shows enabled Edit and Delete buttons for full-access role", () => {
    const onInlineUpdate = vi.fn()
    const onDelete = vi.fn()
    render(
      <CategoryTable
        categories={mockCategories}
        onInlineUpdate={onInlineUpdate}
        onDelete={onDelete}
        canWrite={true}
      />
    )
    const editButtons = screen.getAllByTitle("Edit inline")
    const deleteButtons = screen.getAllByTitle("Delete")
    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
    editButtons.forEach((btn) => expect(btn).not.toBeDisabled())
    deleteButtons.forEach((btn) => expect(btn).not.toBeDisabled())
  })

  it('shows disabled buttons with "Insufficient permissions" title for read-only', () => {
    const onInlineUpdate = vi.fn()
    const onDelete = vi.fn()
    render(
      <CategoryTable
        categories={mockCategories}
        onInlineUpdate={onInlineUpdate}
        onDelete={onDelete}
        canWrite={false}
      />
    )
    const insufficient = screen.getAllByTitle("Insufficient permissions")
    expect(insufficient.length).toBeGreaterThanOrEqual(4)
    insufficient.forEach((btn) => expect(btn).toBeDisabled())
  })

  it("clicking Edit enters inline edit mode and Save calls onInlineUpdate", async () => {
    const user = userEvent.setup()
    const onInlineUpdate = vi.fn()
    render(<CategoryTable categories={mockCategories} onInlineUpdate={onInlineUpdate} canWrite={true} />)
    await user.click(screen.getAllByTitle("Edit inline")[0])
    // Inputs should appear
    expect(screen.getByDisplayValue("Electronics")).toBeInTheDocument()
    // Click save
    await user.click(screen.getByTitle("Save"))
    expect(onInlineUpdate).toHaveBeenCalledOnce()
    expect(onInlineUpdate).toHaveBeenCalledWith(1, {
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices",
    })
  })

  it("clicking Delete calls onDelete with correct id", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<CategoryTable categories={mockCategories} onDelete={onDelete} canWrite={true} />)
    await user.click(screen.getAllByTitle("Delete")[1])
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(2)
  })

  it('shows "No entries found" for empty list', () => {
    render(<CategoryTable categories={[]} canWrite={true} />)
    expect(screen.getByText(/no entries found/i)).toBeInTheDocument()
  })

  it("does not show action buttons when no handlers provided", () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.queryByTitle("Edit inline")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Delete")).not.toBeInTheDocument()
  })

  it("filters categories by search input", async () => {
    const user = userEvent.setup()
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    await user.type(screen.getByPlaceholderText("Search entries..."), "electr")
    expect(screen.getByText("Electronics")).toBeInTheDocument()
    expect(screen.queryByText("Books")).not.toBeInTheDocument()
  })

  it("shows entry count in toolbar", () => {
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    expect(screen.getByText(/2 entries found/i)).toBeInTheDocument()
  })

  it('shows singular "entry" for one result', async () => {
    const user = userEvent.setup()
    render(<CategoryTable categories={mockCategories} canWrite={true} />)
    await user.type(screen.getByPlaceholderText("Search entries..."), "electronics")
    expect(screen.getByText(/1 entry found/i)).toBeInTheDocument()
  })
})
