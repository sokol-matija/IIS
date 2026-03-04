import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../api/categories";
import CategoryTable from "../components/CategoryTable";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task5Page() {
  const { getToken, role } = useAuth();
  const canWrite = role === "full-access";

  // CRUD state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // GraphQL state
  const [gqlQuery, setGqlQuery] = useState(
    `{\n  categories {\n    id\n    name\n    slug\n    description\n  }\n}`
  );
  const [gqlResult, setGqlResult] = useState("");
  const [gqlLoading, setGqlLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        const cats = await getCategories(token);
        setCategories(cats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = await getToken();
    if (!token) return;

    try {
      if (formMode === "create") {
        await createCategory(token, { name, slug, description });
      } else if (editId !== null) {
        await updateCategory(token, editId, { name, slug, description });
      }
      setName("");
      setSlug("");
      setDescription("");
      setFormMode("create");
      setEditId(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleEdit = (cat: Category) => {
    setFormMode("edit");
    setEditId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    const token = await getToken();
    if (!token) return;

    try {
      await deleteCategory(token, id);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleGraphQL = async () => {
    setGqlLoading(true);
    setGqlResult("");
    const token = await getToken();

    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: gqlQuery }),
      });
      const data = await res.json();
      setGqlResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setGqlResult(err instanceof Error ? err.message : "GraphQL request failed");
    } finally {
      setGqlLoading(false);
    }
  };

  return (
    <div>
      <h1>Task 5 - REST CRUD + GraphQL</h1>

      {/* CRUD Section */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Categories CRUD (REST)</h2>

        {error && <div style={{ color: "#c62828", marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
            />
          </div>
          <button
            type="submit"
            disabled={!canWrite}
            title={!canWrite ? "Insufficient permissions" : undefined}
            style={{
              ...btnStyle,
              background: canWrite ? "#0f3460" : "#ccc",
              cursor: canWrite ? "pointer" : "not-allowed",
            }}
          >
            {formMode === "create" ? "Create Category" : "Update Category"}
          </button>
          {formMode === "edit" && (
            <button
              type="button"
              onClick={() => {
                setFormMode("create");
                setEditId(null);
                setName("");
                setSlug("");
                setDescription("");
              }}
              style={{ ...btnStyle, background: "#666", marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <CategoryTable
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canWrite={canWrite}
          />
        )}
      </div>

      {/* GraphQL Section */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>GraphQL Query Panel</h2>
        <textarea
          value={gqlQuery}
          onChange={(e) => setGqlQuery(e.target.value)}
          rows={8}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: 13,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            boxSizing: "border-box",
            marginBottom: 8,
          }}
        />
        <button onClick={handleGraphQL} disabled={gqlLoading} style={btnStyle}>
          {gqlLoading ? "Running..." : "Execute Query"}
        </button>

        {gqlResult && (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: "#1a1a2e",
              color: "#0f0",
              borderRadius: 4,
              overflow: "auto",
              fontSize: 12,
              maxHeight: 400,
            }}
          >
            {gqlResult}
          </pre>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: 8,
  border: "1px solid #ddd",
  borderRadius: 4,
  minWidth: 120,
};

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#0f3460",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
