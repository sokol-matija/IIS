import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"
import type { Category } from "../api/categories"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Search, Check, X } from "lucide-react"

interface CategoryTableProps {
  categories: Category[]
  onInlineUpdate?: (id: number, patch: { name: string; slug: string; description: string }) => void
  onDelete?: (id: number) => void
  canWrite: boolean
}

const columnHelper = createColumnHelper<Category>()

export default function CategoryTable({
  categories,
  onInlineUpdate,
  onDelete,
  canWrite,
}: CategoryTableProps) {
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ name: "", slug: "", description: "" })

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setDraft({ name: cat.name, slug: cat.slug, description: cat.description || "" })
  }

  const saveEdit = () => {
    if (editingId !== null && onInlineUpdate) {
      onInlineUpdate(editingId, draft)
    }
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const filtered = useMemo(
    () =>
      categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          cat.slug.toLowerCase().includes(search.toLowerCase()) ||
          (cat.description ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => {
          const cat = info.row.original
          if (editingId === cat.id) {
            return (
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                className="h-8 text-sm"
                autoFocus
              />
            )
          }
          return <span className="text-foreground font-medium">{info.getValue()}</span>
        },
      }),
      columnHelper.accessor("slug", {
        header: "Slug",
        cell: (info) => {
          const cat = info.row.original
          if (editingId === cat.id) {
            return (
              <Input
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                className="h-8 font-mono text-xs"
              />
            )
          }
          return (
            <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
              {info.getValue()}
            </code>
          )
        },
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => {
          const cat = info.row.original
          if (editingId === cat.id) {
            return (
              <Input
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                className="h-8 text-sm"
                placeholder="Optional description"
              />
            )
          }
          return (
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
              {info.getValue() || "\u2014"}
            </span>
          )
        },
      }),
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => <span className="text-muted-foreground text-xs">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="flex justify-end">Actions</span>,
        cell: ({ row }) => {
          const cat = row.original
          if (editingId === cat.id) {
            return (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveEdit}
                  title="Save"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Check size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancelEdit}
                  title="Cancel"
                >
                  <X size={14} />
                </Button>
              </div>
            )
          }
          return (
            <div className="flex items-center justify-end gap-1">
              {onInlineUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => canWrite && startEdit(cat)}
                  disabled={!canWrite || editingId !== null}
                  title={!canWrite ? "Insufficient permissions" : "Edit inline"}
                >
                  <Pencil size={14} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => canWrite && onDelete(cat.id)}
                  disabled={!canWrite || editingId !== null}
                  title={!canWrite ? "Insufficient permissions" : "Delete"}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          )
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingId, draft, onInlineUpdate, onDelete, canWrite]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative flex-[0_1_320px]">
          <Search
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="pl-9"
          />
        </div>
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} found
        </span>
      </div>

      {/* Table */}
      <div className="border-border overflow-hidden rounded border">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-card border-border border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-muted-foreground px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.06em] uppercase"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground bg-card px-4 py-10 text-center text-sm"
                >
                  No entries found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-border bg-card hover:bg-accent/30 border-b transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === "description"
                          ? "text-muted-foreground h-12 max-w-[240px] px-4 align-middle text-sm"
                          : cell.column.id === "actions"
                            ? "h-12 px-4 text-right align-middle"
                            : "h-12 px-4 align-middle text-sm"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
