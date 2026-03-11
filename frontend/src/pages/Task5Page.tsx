import React, { useReducer, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../api/categories";
import CategoryTable from "../components/CategoryTable";
import { GradientCard } from "@msokol/gradient-card-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

// ── CRUD state ────────────────────────────────────────────────────────────────
interface CrudState {
  categories: Category[];
  loading: boolean;
  error: string;
  showForm: boolean;
  formMode: "create" | "edit";
  editId: number | null;
  name: string;
  slug: string;
  description: string;
}

type CrudAction =
  | { type: "load_start" }
  | { type: "load_success"; categories: Category[] }
  | { type: "load_error"; error: string }
  | { type: "open_create" }
  | { type: "open_edit"; cat: Category }
  | { type: "cancel" }
  | { type: "set_name"; value: string }
  | { type: "set_slug"; value: string }
  | { type: "set_description"; value: string }
  | { type: "submit_error"; error: string };

const crudInit: CrudState = {
  categories: [], loading: false, error: "",
  showForm: false, formMode: "create", editId: null,
  name: "", slug: "", description: "",
};

function crudReducer(state: CrudState, action: CrudAction): CrudState {
  switch (action.type) {
    case "load_start":   return { ...state, loading: true, error: "" };
    case "load_success": return { ...state, loading: false, categories: action.categories };
    case "load_error":   return { ...state, loading: false, error: action.error };
    case "open_create":  return { ...state, showForm: true, formMode: "create", editId: null, name: "", slug: "", description: "" };
    case "open_edit":    return { ...state, showForm: true, formMode: "edit", editId: action.cat.id, name: action.cat.name, slug: action.cat.slug, description: action.cat.description || "" };
    case "cancel":       return { ...state, showForm: false, formMode: "create", editId: null, name: "", slug: "", description: "" };
    case "set_name":     return { ...state, name: action.value };
    case "set_slug":     return { ...state, slug: action.value };
    case "set_description": return { ...state, description: action.value };
    case "submit_error": return { ...state, error: action.error };
  }
}

// ── GraphQL state ─────────────────────────────────────────────────────────────
interface GqlState {
  open: boolean;
  query: string;
  result: string;
  loading: boolean;
}

type GqlAction =
  | { type: "toggle" }
  | { type: "set_query"; value: string }
  | { type: "run_start" }
  | { type: "run_done"; result: string };

const gqlInit: GqlState = {
  open: false,
  query: `{\n  categories {\n    id\n    name\n    slug\n    description\n  }\n}`,
  result: "",
  loading: false,
};

function gqlReducer(state: GqlState, action: GqlAction): GqlState {
  switch (action.type) {
    case "toggle":    return { ...state, open: !state.open };
    case "set_query": return { ...state, query: action.value };
    case "run_start": return { ...state, loading: true, result: "" };
    case "run_done":  return { ...state, loading: false, result: action.result };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Task5Page() {
  const { getToken, role } = useAuth();
  const canWrite = role === "full-access";

  const [crud, crudDispatch] = useReducer(crudReducer, crudInit);
  const [gql, gqlDispatch] = useReducer(gqlReducer, gqlInit);

  const loadCategories = useCallback(async () => {
    crudDispatch({ type: "load_start" });
    try {
      const token = await getToken();
      if (token) {
        const cats = await getCategories(token);
        crudDispatch({ type: "load_success", categories: cats });
      }
    } catch (err) {
      crudDispatch({ type: "load_error", error: err instanceof Error ? err.message : "Failed to load" });
    }
  }, [getToken]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) return;
    try {
      if (crud.formMode === "create") {
        await createCategory(token, { name: crud.name, slug: crud.slug, description: crud.description });
      } else if (crud.editId !== null) {
        await updateCategory(token, crud.editId, { name: crud.name, slug: crud.slug, description: crud.description });
      }
      crudDispatch({ type: "cancel" });
      await loadCategories();
    } catch (err) {
      crudDispatch({ type: "submit_error", error: err instanceof Error ? err.message : "Operation failed" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    const token = await getToken();
    if (!token) return;
    try {
      await deleteCategory(token, id);
      await loadCategories();
    } catch (err) {
      crudDispatch({ type: "submit_error", error: err instanceof Error ? err.message : "Delete failed" });
    }
  };

  const handleGraphQL = async () => {
    gqlDispatch({ type: "run_start" });
    const token = await getToken();
    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: gql.query }),
      });
      const data = await res.json();
      gqlDispatch({ type: "run_done", result: JSON.stringify(data, null, 2) });
    } catch (err) {
      gqlDispatch({ type: "run_done", result: err instanceof Error ? err.message : "GraphQL request failed" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 5 — Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">REST CRUD operations and GraphQL queries on categories.</p>
        </div>
        {canWrite && (
          <Button className="h-10 px-5" onClick={() => crudDispatch({ type: "open_create" })}>
            <Plus size={16} />
            Add an entry
          </Button>
        )}
      </div>

      {crud.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mb-5">
          {crud.error}
        </div>
      )}

      {/* Create / Edit Form */}
      {crud.showForm && (
        <GradientCard variant="lavender" title={crud.formMode === "create" ? "New Category" : "Edit Category"}>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="cat-name" className="mb-1.5">Name</Label>
                <Input
                  id="cat-name"
                  placeholder="Category name"
                  value={crud.name}
                  onChange={(e) => crudDispatch({ type: "set_name", value: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cat-slug" className="mb-1.5">Slug</Label>
                <Input
                  id="cat-slug"
                  placeholder="category-slug"
                  value={crud.slug}
                  onChange={(e) => crudDispatch({ type: "set_slug", value: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mb-5">
              <Label htmlFor="cat-desc" className="mb-1.5">Description</Label>
              <Input
                id="cat-desc"
                placeholder="Optional description"
                value={crud.description}
                onChange={(e) => crudDispatch({ type: "set_description", value: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="h-9 px-5">
                {crud.formMode === "create" ? "Create" : "Update"}
              </Button>
              <Button type="button" variant="outline" className="h-9 px-4" onClick={() => crudDispatch({ type: "cancel" })}>
                Cancel
              </Button>
            </div>
          </form>
        </GradientCard>
      )}

      {/* Categories Table */}
      <div className={`bg-card border border-border rounded-xl p-6 mb-6 ${crud.showForm ? "mt-6" : ""}`}>
        {crud.loading ? (
          <p className="text-muted-foreground text-center">Loading...</p>
        ) : (
          <CategoryTable
            categories={crud.categories}
            onEdit={(cat) => crudDispatch({ type: "open_edit", cat })}
            onDelete={handleDelete}
            canWrite={canWrite}
          />
        )}
      </div>

      {/* GraphQL Collapsible Panel */}
      <GradientCard variant="lavender" title="GraphQL Explorer">
        <div className="mt-2">
          <button
            onClick={() => gqlDispatch({ type: "toggle" })}
            className="flex items-center justify-between w-full bg-transparent border-0 text-foreground cursor-pointer p-0"
          >
            <span className="text-muted-foreground text-sm">
              {gql.open ? "Collapse" : "Expand query editor"}
            </span>
            {gql.open ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </button>

          {gql.open && (
            <div className="mt-4">
              <Label htmlFor="gql-query" className="mb-1.5">Query</Label>
              <Textarea
                id="gql-query"
                value={gql.query}
                onChange={(e) => gqlDispatch({ type: "set_query", value: e.target.value })}
                rows={8}
                className="mb-3"
              />
              <Button onClick={handleGraphQL} disabled={gql.loading} className="h-9 px-5">
                {gql.loading ? "Running..." : "Run Query"}
              </Button>

              {gql.result && (
                <pre className="rounded-lg bg-muted/50 border p-4 font-mono text-xs text-cyan-300 overflow-auto max-h-96 mt-3">
                  {gql.result}
                </pre>
              )}
            </div>
          )}
        </div>
      </GradientCard>
    </div>
  );
}
