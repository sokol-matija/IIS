import React, { useReducer } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../store/authStore"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../api/categories"
import CategoryTable from "../components/CategoryTable"
import { GradientCard } from "@msokol/gradient-card-component"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || ""

// ── CRUD form state ────────────────────────────────────────────────────────────
interface FormState {
  showForm: boolean
  formMode: "create" | "edit"
  editId: number | null
  name: string
  slug: string
  description: string
}

type FormAction =
  | { type: "open_create" }
  | { type: "open_edit"; cat: Category }
  | { type: "cancel" }
  | { type: "set_name"; value: string }
  | { type: "set_slug"; value: string }
  | { type: "set_description"; value: string }

const formInit: FormState = {
  showForm: false,
  formMode: "create",
  editId: null,
  name: "",
  slug: "",
  description: "",
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "open_create":
      return {
        ...state,
        showForm: true,
        formMode: "create",
        editId: null,
        name: "",
        slug: "",
        description: "",
      }
    case "open_edit":
      return {
        ...state,
        showForm: true,
        formMode: "edit",
        editId: action.cat.id,
        name: action.cat.name,
        slug: action.cat.slug,
        description: action.cat.description || "",
      }
    case "cancel":
      return {
        ...state,
        showForm: false,
        formMode: "create",
        editId: null,
        name: "",
        slug: "",
        description: "",
      }
    case "set_name":
      return { ...state, name: action.value }
    case "set_slug":
      return { ...state, slug: action.value }
    case "set_description":
      return { ...state, description: action.value }
  }
}

// ── GraphQL state ─────────────────────────────────────────────────────────────
interface GqlState {
  open: boolean
  query: string
  result: string
  loading: boolean
}

type GqlAction =
  | { type: "toggle" }
  | { type: "set_query"; value: string }
  | { type: "run_start" }
  | { type: "run_done"; result: string }

const gqlInit: GqlState = {
  open: false,
  query: `{\n  categories {\n    id\n    name\n    slug\n    description\n  }\n}`,
  result: "",
  loading: false,
}

function gqlReducer(state: GqlState, action: GqlAction): GqlState {
  switch (action.type) {
    case "toggle":
      return { ...state, open: !state.open }
    case "set_query":
      return { ...state, query: action.value }
    case "run_start":
      return { ...state, loading: true, result: "" }
    case "run_done":
      return { ...state, loading: false, result: action.result }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Task5Page() {
  const { getToken, role } = useAuthStore()
  const canWrite = role === "full-access"
  const queryClient = useQueryClient()

  const [form, formDispatch] = useReducer(formReducer, formInit)
  const [gql, gqlDispatch] = useReducer(gqlReducer, gqlInit)

  // ── Queries ──────────────────────────────────────────────────────────────────
  const {
    data: categories = [],
    isLoading: loadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = await getToken()
      if (!token) return []
      return getCategories(token)
    },
  })

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (cat: { name: string; slug: string; description: string }) => {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")
      return createCategory(token, cat)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      formDispatch({ type: "cancel" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      cat,
    }: {
      id: number
      cat: { name: string; slug: string; description: string }
    }) => {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")
      return updateCategory(token, id, cat)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      formDispatch({ type: "cancel" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")
      return deleteCategory(token, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const submitError =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    deleteMutation.error?.message ||
    (categoriesError instanceof Error
      ? categoriesError.message
      : categoriesError
        ? "Failed to load"
        : "")

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    if (form.formMode === "create") {
      createMutation.mutate({ name: form.name, slug: form.slug, description: form.description })
    } else if (form.editId !== null) {
      updateMutation.mutate({
        id: form.editId,
        cat: { name: form.name, slug: form.slug, description: form.description },
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return
    deleteMutation.mutate(id)
  }

  const handleGraphQL = async () => {
    gqlDispatch({ type: "run_start" })
    const token = await getToken()
    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: gql.query }),
      })
      const data = await res.json()
      gqlDispatch({ type: "run_done", result: JSON.stringify(data, null, 2) })
    } catch (err) {
      gqlDispatch({
        type: "run_done",
        result: err instanceof Error ? err.message : "GraphQL request failed",
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task 5 — Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            REST CRUD operations and GraphQL queries on categories.
          </p>
        </div>
        {canWrite && (
          <Button className="h-10 px-5" onClick={() => formDispatch({ type: "open_create" })}>
            <Plus size={16} />
            Add an entry
          </Button>
        )}
      </div>

      {submitError && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive mb-5 rounded-lg border p-4">
          {submitError}
        </div>
      )}

      {/* Create / Edit Form */}
      {form.showForm && (
        <GradientCard
          variant="lavender"
          title={form.formMode === "create" ? "New Category" : "Edit Category"}
        >
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cat-name" className="mb-1.5">
                  Name
                </Label>
                <Input
                  id="cat-name"
                  placeholder="Category name"
                  value={form.name}
                  onChange={(e) => formDispatch({ type: "set_name", value: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cat-slug" className="mb-1.5">
                  Slug
                </Label>
                <Input
                  id="cat-slug"
                  placeholder="category-slug"
                  value={form.slug}
                  onChange={(e) => formDispatch({ type: "set_slug", value: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mb-5">
              <Label htmlFor="cat-desc" className="mb-1.5">
                Description
              </Label>
              <Input
                id="cat-desc"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => formDispatch({ type: "set_description", value: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="h-9 px-5" disabled={isSubmitting}>
                {form.formMode === "create" ? "Create" : "Update"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4"
                onClick={() => formDispatch({ type: "cancel" })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </GradientCard>
      )}

      {/* Categories Table */}
      <div
        className={`bg-card border-border mb-6 rounded-xl border p-6 ${form.showForm ? "mt-6" : ""}`}
      >
        {loadingCategories ? (
          <p className="text-muted-foreground text-center">Loading...</p>
        ) : (
          <CategoryTable
            categories={categories}
            onEdit={(cat) => formDispatch({ type: "open_edit", cat })}
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
            className="text-foreground flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0"
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
              <Label htmlFor="gql-query" className="mb-1.5">
                Query
              </Label>
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
                <pre className="bg-muted/50 mt-3 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-xs text-cyan-300">
                  {gql.result}
                </pre>
              )}
            </div>
          )}
        </div>
      </GradientCard>
    </div>
  )
}
