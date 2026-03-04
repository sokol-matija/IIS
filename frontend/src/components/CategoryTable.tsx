import type { Category } from "../api/categories";

interface CategoryTableProps {
  categories: Category[];
  onEdit?: (cat: Category) => void;
  onDelete?: (id: number) => void;
  canWrite: boolean;
}

export default function CategoryTable({ categories, onEdit, onDelete, canWrite }: CategoryTableProps) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <thead>
        <tr style={{ background: "#1a1a2e", color: "#fff" }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Slug</th>
          <th style={thStyle}>Description</th>
          {(onEdit || onDelete) && <th style={thStyle}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {categories.length === 0 ? (
          <tr>
            <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#999" }}>
              No categories found
            </td>
          </tr>
        ) : (
          categories.map((cat) => (
            <tr key={cat.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{cat.id}</td>
              <td style={tdStyle}>{cat.name}</td>
              <td style={tdStyle}>{cat.slug}</td>
              <td style={tdStyle}>{cat.description || "-"}</td>
              {(onEdit || onDelete) && (
                <td style={tdStyle}>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(cat)}
                      disabled={!canWrite}
                      title={!canWrite ? "Insufficient permissions" : "Edit"}
                      style={{
                        ...btnStyle,
                        background: canWrite ? "#2196f3" : "#ccc",
                        cursor: canWrite ? "pointer" : "not-allowed",
                        marginRight: 4,
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(cat.id)}
                      disabled={!canWrite}
                      title={!canWrite ? "Insufficient permissions" : "Delete"}
                      style={{
                        ...btnStyle,
                        background: canWrite ? "#e74c3c" : "#ccc",
                        cursor: canWrite ? "pointer" : "not-allowed",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
};

const btnStyle: React.CSSProperties = {
  padding: "4px 10px",
  color: "#fff",
  border: "none",
  borderRadius: 3,
  fontSize: 12,
};
