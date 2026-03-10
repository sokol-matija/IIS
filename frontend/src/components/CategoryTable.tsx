import { useState } from "react";
import type { Category } from "../api/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Search } from "lucide-react";

interface CategoryTableProps {
  categories: Category[];
  onEdit?: (cat: Category) => void;
  onDelete?: (id: number) => void;
  canWrite: boolean;
}

export default function CategoryTable({
  categories,
  onEdit,
  onDelete,
  canWrite,
}: CategoryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.slug.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const showActions = !!(onEdit || onDelete);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-[0_1_320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-card border-b border-border">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Slug</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Description</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">ID</th>
              {showActions && <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={showActions ? 5 : 4}
                  className="px-4 py-10 text-center text-sm text-muted-foreground bg-card"
                >
                  No entries found
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 h-12 align-middle text-sm">
                    <span className="font-medium text-foreground">{cat.name}</span>
                  </td>
                  <td className="px-4 h-12 align-middle text-sm">
                    <code className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-4 h-12 align-middle text-sm text-muted-foreground max-w-[240px]">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap block">
                      {cat.description || "\u2014"}
                    </span>
                  </td>
                  <td className="px-4 h-12 align-middle text-xs text-muted-foreground">
                    {cat.id}
                  </td>
                  {showActions && (
                    <td className="px-4 h-12 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => canWrite && onEdit(cat)}
                            disabled={!canWrite}
                            title={!canWrite ? "Insufficient permissions" : "Edit"}
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => canWrite && onDelete(cat.id)}
                            disabled={!canWrite}
                            title={!canWrite ? "Insufficient permissions" : "Delete"}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
