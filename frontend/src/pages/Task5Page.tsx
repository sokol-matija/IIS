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
  const [showForm, setShowForm] = useState(false);

  // GraphQL state
  const [gqlOpen, setGqlOpen] = useState(false);
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
      setShowForm(false);
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
    setShowForm(true);
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

  const handleCancelEdit = () => {
    setFormMode("create");
    setEditId(null);
    setName("");
    setSlug("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task 5 — Categories</h1>
          <p className="page-subtitle">REST CRUD operations and GraphQL queries on categories.</p>
        </div>
        {canWrite && (
          <button
            className="btn-primary"
            style={{ height: 40, padding: "0 20px" }}
            onClick={() => {
              setFormMode("create");
              setName("");
              setSlug("");
              setDescription("");
              setShowForm(true);
            }}
          >
            + Add an entry
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 20,
            }}
          >
            {formMode === "create" ? "New Category" : "Edit Category"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label className="field-label" htmlFor="cat-name">
                  Name
                </label>
                <input
                  id="cat-name"
                  className="input"
                  placeholder="Category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cat-slug">
                  Slug
                </label>
                <input
                  id="cat-slug"
                  className="input"
                  placeholder="category-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="field-label" htmlFor="cat-desc">
                Description
              </label>
              <input
                id="cat-desc"
                className="input"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn-primary" style={{ height: 36, padding: "0 20px" }}>
                {formMode === "create" ? "Create" : "Update"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 36, padding: "0 16px" }}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading...</p>
        ) : (
          <CategoryTable
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canWrite={canWrite}
          />
        )}
      </div>

      {/* GraphQL Collapsible Panel */}
      <div className="card">
        <button
          onClick={() => setGqlOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            GraphQL Explorer
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {gqlOpen ? "▲" : "▼"}
          </span>
        </button>

        {gqlOpen && (
          <div style={{ marginTop: 20 }}>
            <label className="field-label">Query</label>
            <textarea
              className="textarea"
              value={gqlQuery}
              onChange={(e) => setGqlQuery(e.target.value)}
              rows={8}
              style={{ marginBottom: 12 }}
            />
            <button
              onClick={handleGraphQL}
              disabled={gqlLoading}
              className="btn-primary"
              style={{ height: 36, padding: "0 20px" }}
            >
              {gqlLoading ? "Running..." : "Run Query"}
            </button>

            {gqlResult && (
              <pre className="json-viewer">{gqlResult}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
