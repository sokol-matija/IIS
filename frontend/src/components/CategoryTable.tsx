import { useState } from "react";
import type { Category } from "../api/categories";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div style={{ position: "relative", flex: "0 1 320px" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            style={{ paddingLeft: 36 }}
          />
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} found
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Slug</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>ID</th>
              {showActions && <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={showActions ? 5 : 4}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    background: "var(--bg-card)",
                  }}
                >
                  No entries found
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr
                  key={cat.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--bg-card)")
                  }
                >
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {cat.name}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <code
                      style={{
                        background: "var(--bg-input)",
                        borderRadius: 3,
                        padding: "2px 6px",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {cat.slug}
                    </code>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--text-secondary)", maxWidth: 240 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {cat.description || "—"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: 12 }}>
                    {cat.id}
                  </td>
                  {showActions && (
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {onEdit && (
                        <button
                          onClick={() => canWrite && onEdit(cat)}
                          disabled={!canWrite}
                          title={!canWrite ? "Insufficient permissions" : "Edit"}
                          className="btn-icon btn-icon-edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => canWrite && onDelete(cat.id)}
                          disabled={!canWrite}
                          title={!canWrite ? "Insufficient permissions" : "Delete"}
                          className="btn-icon btn-icon-delete"
                        >
                          🗑
                        </button>
                      )}
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

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-muted)",
};

const tdStyle: React.CSSProperties = {
  padding: "0 16px",
  fontSize: 14,
  height: 48,
  verticalAlign: "middle",
};
