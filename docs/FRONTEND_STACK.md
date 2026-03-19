# Frontend Stack — Tools and Why They Exist

This document covers the non-React parts of the frontend: TanStack Query (and why it replaces manual fetch), Zustand (and why it replaces Redux), React Router, Vite, TypeScript, TanStack Table, and the Express middleware pattern on the backend. Each section explains the traditional approach first so you understand what problem the tool solves.

---

## Table of Contents

1. [TanStack Query — Server State Management](#1-tanstack-query--server-state-management)
2. [TanStack Table — Headless Table Logic](#2-tanstack-table--headless-table-logic)
3. [Zustand — Lightweight Global State](#3-zustand--lightweight-global-state)
4. [React Router — Client-Side Navigation](#4-react-router--client-side-navigation)
5. [Vite — The Build Tool](#5-vite--the-build-tool)
6. [TypeScript — Why Types Matter](#6-typescript--why-types-matter)
7. [Express Middleware — The Backend Pattern](#7-express-middleware--the-backend-pattern)
8. [Tailwind CSS — Utility-First Styling](#8-tailwind-css--utility-first-styling)

---

## 1. TanStack Query — Server State Management

### The traditional approach (manual fetch)

Before tools like TanStack Query, fetching data in React looked like this:

```tsx
function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <ul>{categories.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

This works, but has problems:
- **Race conditions**: if the component re-renders and fires another fetch before the first completes, the older response might arrive last and overwrite the newer data
- **No caching**: every component mount fires a new network request, even if you just fetched the same data 2 seconds ago
- **No deduplication**: two components mounted at the same time both send the same request
- **Manual loading/error state**: every fetch needs its own `loading` and `error` state
- **Stale data**: the data in `useState` never updates after the first load — you have to manually re-fetch after mutations

After 10 endpoints, you have 10 copies of this pattern.

### The TanStack Query approach

TanStack Query (formerly React Query) separates **server state** (data that lives on a server and needs to be fetched) from **client state** (UI state like "is this modal open"). It manages the fetching, caching, deduplication, background refetching, and error handling for you.

```tsx
import { useQuery } from "@tanstack/react-query";

function CategoryList() {
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then(res => res.json()),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <ul>{categories.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

### How it works internally

TanStack Query maintains an in-memory **query cache**. Each cache entry is identified by a **query key** (an array like `["categories"]` or `["category", 42]`).

When `useQuery` is called:
1. Check the cache for `["categories"]`
2. If fresh data exists → return it immediately, no network request
3. If data is stale (or not yet fetched) → start a fetch, show `isLoading`, update cache when done
4. If two components call `useQuery({ queryKey: ["categories"] })` simultaneously → only one fetch is made; both get the result

### Query keys

Query keys are how TanStack Query identifies and invalidates data:

```tsx
// Global list
queryKey: ["categories"]

// One specific item
queryKey: ["category", id]

// With filters
queryKey: ["categories", { search: term, page: 2 }]
```

When you change the query key (e.g., `id` changes), a new fetch is triggered automatically.

### useMutation — for write operations

While `useQuery` is for reading, `useMutation` is for creating, updating, and deleting:

```tsx
const createMutation = useMutation({
  mutationFn: async (newCat: { name: string; slug: string }) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    // ^ tells TanStack Query: "categories data is stale, re-fetch it"
    toast.success("Category created!");
  },
  onError: (err) => {
    toast.error(err.message);
  },
});

// Calling the mutation
createMutation.mutate({ name: "Electronics", slug: "electronics" });

// Status flags
createMutation.isPending  // true while the request is in flight
createMutation.isSuccess  // true after success
createMutation.error      // the error if it failed
```

### Cache invalidation

After a mutation, the list of categories is outdated. `queryClient.invalidateQueries` marks the cache entry as stale, triggering a background re-fetch. The component automatically re-renders with fresh data when the fetch completes.

```tsx
// In Task5Page after creating a category:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["categories"] });
}
```

### Traditional vs TanStack Query comparison

| Feature | Traditional (fetch + useState) | TanStack Query |
|---|---|---|
| Cache | None — fresh fetch every mount | In-memory cache, configurable stale time |
| Deduplication | None — every component fetches independently | Identical query keys share one fetch |
| Background refetch | Manual | Automatic (on window focus, network reconnect) |
| Loading/error state | Manually managed | `isLoading`, `error` provided |
| Retry on failure | Manual | Automatic (3 retries by default) |
| Post-mutation refresh | Manual | `invalidateQueries` |
| Race condition safety | You handle it | Handled automatically |
| DevTools | None | Built-in query inspector panel |

### In this project

`Task5Page` uses `useQuery` to load categories and `useMutation` for create, update, and delete. The `QueryClient` is created once in `App.tsx` with `staleTime: 60000` (data is considered fresh for 60 seconds). The `ReactQueryDevtools` component provides a panel (bottom of screen) showing all cached queries and their state.

---

## 2. TanStack Table — Headless Table Logic

### The traditional approach

Building a sortable, filterable, paginated table by hand requires maintaining a lot of state:

```tsx
const [sortField, setSortField] = useState("name");
const [sortDir, setSortDir] = useState("asc");
const [search, setSearch] = useState("");
const [page, setPage] = useState(1);

const filtered = data.filter(row => row.name.includes(search));
const sorted = [...filtered].sort((a, b) => ...);
const paged = sorted.slice((page - 1) * 20, page * 20);
```

As features grow (multi-column sort, column resizing, row selection, virtual scrolling), this becomes thousands of lines of custom logic.

### What headless means

TanStack Table is **headless** — it provides all the logic (sorting, filtering, pagination, column definitions, row selection) but **no UI**. You supply the JSX. This means:
- Full control over markup and styling
- No CSS conflicts with an opinionated component library
- Works with any styling approach (Tailwind, CSS modules, emotion)

### The column definition pattern

```tsx
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<Category>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <strong>{info.getValue()}</strong>,
  }),
  columnHelper.accessor("slug", {
    header: "Slug",
    cell: (info) => <code>{info.getValue()}</code>,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <button onClick={() => onDelete(row.original.id)}>Delete</button>
    ),
  }),
];
```

`accessor` columns read from a field in the data. `display` columns have no data accessor — they render computed content like action buttons.

### Using the table instance

```tsx
const table = useReactTable({
  data: filteredCategories,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // optional: getSortedRowModel(), getPaginationRowModel(), etc.
});

return (
  <table>
    <thead>
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </thead>
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
```

`flexRender` handles both function renderers and plain values.

### In this project

`CategoryTable.tsx` uses TanStack Table with a custom `useMemo` on columns that re-builds when `editingId` changes (so the inline edit inputs appear in the right row when editing is active). The client-side search filter is applied before passing data to `useReactTable` so the table model always sees the pre-filtered list.

---

## 3. Zustand — Lightweight Global State

### The problem with passing state everywhere

Some state needs to be accessible from many unrelated components — authentication, theme, settings. Passing it via props through every intermediate component (prop drilling) is verbose and couples unrelated components. React Context solves this but has a re-render problem: every context consumer re-renders when the context value changes.

### The Redux way (heavy)

Redux was the dominant solution for years. It works, but requires significant boilerplate:
- Action types (constants)
- Action creators (functions that return action objects)
- Reducers (pure functions to compute new state)
- A store
- `connect()` or `useSelector()` / `useDispatch()` hooks

For simple global state (user, auth token, settings), Redux is massive overkill.

### Zustand — the minimal store

Zustand is a tiny state management library. A store is just a function that returns an object with state and actions:

```tsx
import { create } from "zustand";

interface BearState {
  count: number;
  increase: () => void;
  reset: () => void;
}

const useBearStore = create<BearState>((set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// In any component, no Provider needed:
function Counter() {
  const { count, increase } = useBearStore();
  return <button onClick={increase}>Bears: {count}</button>;
}
```

No Provider, no boilerplate. The store is created once; any component calls `useBearStore()` to subscribe to it.

### Selective subscription

Zustand only re-renders a component when the specific values it subscribes to change:

```tsx
// Only re-renders when role changes — not when token changes
const role = useAuthStore((state) => state.role);

// Re-renders when anything in the store changes
const everything = useAuthStore();
```

This is more efficient than Context where all consumers re-render.

### Traditional vs Zustand comparison

| Feature | Context + useReducer | Redux | Zustand |
|---|---|---|---|
| Boilerplate | Medium | High | Minimal |
| Performance | Re-renders all consumers | Selector-based | Selector-based |
| DevTools | None | Redux DevTools | Optional middleware |
| Bundle size | 0 (built-in) | ~45kb | ~1kb |
| Outside-component access | No | Yes | Yes |
| Persist to localStorage | Manual | With middleware | With middleware |

### In this project

`authStore.ts` is the Zustand store. It holds:
- `accessToken` — the current JWT
- `email` and `role` — decoded from the token
- `isAuthenticated` — derived flag
- `login()`, `logout()`, `getToken()` — actions

`task1Store.ts` holds the Task 1 editor content (file names and XML/JSON text) so it survives navigation.

`getToken()` is async and automatically refreshes the token if it is about to expire — this logic lives in the store, not scattered across components.

---

## 4. React Router — Client-Side Navigation

### What a Single-Page Application is

Traditional websites navigate by requesting a new HTML page from the server for every link click. SPAs load once, and all navigation is handled by JavaScript — the URL changes, but no new HTML is fetched from the server. React Router intercepts link clicks, updates the URL, and renders the right component.

### Traditional vs SPA navigation

```
Traditional:
Click link → Browser sends GET /categories → Server returns new HTML page → Browser renders it

SPA:
Click link → React Router updates URL → React renders the matching component → No server round-trip
```

### Route definitions

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>        {/* parent with Outlet */}
          <Route index element={<Navigate to="/home" />} />
          <Route path="home" element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="users/:id" element={<UserPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />  {/* catch-all */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Outlet — rendering children in a layout

`<Outlet />` is a placeholder in a parent route component. When a child route matches, its element renders where `<Outlet />` is placed:

```tsx
// Layout.tsx — the persistent shell
function Layout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet /> {/* Task1Page, Task2Page, etc. render here */}
      </main>
    </div>
  );
}
```

This is why navigating between tasks doesn't flash the sidebar — the `Layout` component stays mounted; only the `Outlet` content changes.

### NavLink vs Link

`<Link>` navigates without a page reload. `<NavLink>` is a `<Link>` that knows if it is currently active and applies a class or style accordingly:

```tsx
<NavLink
  to="/task2"
  className={({ isActive }) => isActive ? "active-tab" : "tab"}
>
  SOAP
</NavLink>
```

The `isActive` callback receives a boolean — used in this project to highlight the current page's icon in the sidebar.

### Protected routes

A `ProtectedRoute` wraps routes that require authentication. If the user is not logged in, they are redirected to `/login`:

```tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

`replace` means the `/login` URL replaces the current history entry, so the back button doesn't take the user back to a protected page.

### URL params

```tsx
<Route path="categories/:id" element={<CategoryDetail />} />

// In the component:
import { useParams } from "react-router-dom";
function CategoryDetail() {
  const { id } = useParams();
  // id is the string from the URL
}
```

### In this project

`App.tsx` defines all routes. The `Layout` component is the parent route — it contains the sidebar and renders the active page via `<Outlet />`. The `ProtectedRoute` wrapper redirects unauthenticated users to `/login`.

---

## 5. Vite — The Build Tool

### What a build tool does

Modern JavaScript (TypeScript, JSX, `import` statements) cannot run directly in a browser. A build tool:
1. Transforms TypeScript → JavaScript
2. Transforms JSX → `React.createElement()` calls
3. Bundles all imports into a small number of files
4. Optimizes for production (minification, tree-shaking, code splitting)

### Why not Create React App (CRA)

CRA was the official way to start a React project until ~2022. It uses Webpack under the hood. Problems:
- **Slow startup** — Webpack bundles the entire application before showing anything
- **Slow HMR** — Hot Module Replacement (updating only the changed module without a full reload) was slow because of bundling
- **No longer maintained** — the React team no longer recommends it

### Vite's approach

Vite exploits the fact that modern browsers natively support ES modules (the `import`/`export` syntax). In development:
- Vite does NOT bundle — it serves each module as a separate file
- The browser requests exactly the modules it needs
- When you change a file, only that module is updated (true HMR)

In production, Vite uses Rollup to bundle and optimize.

### The dev proxy

A common development problem: the frontend (localhost:5173) and backend (localhost:3001) are on different ports. Browser security blocks cross-origin requests by default (CORS). Vite's dev proxy solves this by forwarding requests from the frontend to the backend:

```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/auth": "http://localhost:3001",
      "/graphql": "http://localhost:3001",
      "/soap": "http://localhost:3001",
    },
  },
});
```

Now `fetch("/api/categories")` from the browser hits `http://localhost:5173/api/categories`, which Vite forwards to `http://localhost:3001/api/categories`. The browser sees it as a same-origin request — no CORS issue.

In production, you'd configure Nginx or another reverse proxy to do the same thing.

### `import.meta.env`

Environment variables in Vite are accessed via `import.meta.env`. Variables prefixed with `VITE_` are exposed to the browser:

```tsx
const API_URL = import.meta.env.VITE_API_URL || "";
```

In development, `VITE_API_URL` is empty (since the proxy handles routing). In production, it would be set to the actual backend URL.

---

## 6. TypeScript — Why Types Matter

TypeScript is JavaScript with a type system. Types are annotations that describe the shape of data — they are checked at compile time and stripped at runtime. The JavaScript that runs in the browser has no types.

### The problem TypeScript solves

```javascript
// JavaScript — no error until runtime
function getUser(id) {
  return fetch(`/users/${id}`).then(r => r.json());
}

getUser("not-a-number"); // silently broken
const user = await getUser(1);
console.log(user.nme); // typo — undefined, no error
```

```typescript
// TypeScript — errors at compile time
async function getUser(id: number): Promise<User> {
  const res = await fetch(`/users/${id}`);
  return res.json() as User;
}

getUser("not-a-number"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
const user = await getUser(1);
console.log(user.nme); // Error: Property 'nme' does not exist on type 'User'. Did you mean 'name'?
```

### Key TypeScript concepts

**Union types** — a value can be one of several types:
```typescript
type Status = "idle" | "loading" | "error" | "success";
let status: Status = "loading"; // only these four values allowed
```

**Optional chaining** — safely access nested properties that might be undefined:
```typescript
const name = user?.profile?.name; // undefined if user or profile is null
```

**Non-null assertion** — tell TypeScript "trust me, this is not null":
```typescript
const element = document.getElementById("root")!; // you know it exists
```

**Type narrowing** — TypeScript tracks what a value can be after checks:
```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    value.toUpperCase(); // TypeScript knows it's a string here
  } else {
    value.toFixed(2); // TypeScript knows it's a number here
  }
}
```

**Generics** — functions and types that work with any type while remaining type-safe:
```typescript
function first<T>(array: T[]): T | undefined {
  return array[0];
}
const num = first([1, 2, 3]); // inferred as number | undefined
const str = first(["a", "b"]); // inferred as string | undefined
```

### TypeScript and React

In this project, every component, API function, and store has TypeScript types. This means:
- Passing the wrong prop type is a compile error, not a runtime bug
- The IDE shows autocomplete for all props, state fields, and API responses
- Refactoring (renaming a field) automatically shows everywhere that field is used

---

## 7. Express Middleware — The Backend Pattern

### What middleware is

In Express (the Node.js web framework), a **middleware** is a function with the signature:

```typescript
(req: Request, res: Response, next: NextFunction) => void
```

- `req` — the incoming HTTP request (URL, headers, body, params)
- `res` — the outgoing HTTP response (you call `res.json()`, `res.send()`, etc.)
- `next` — call this to pass control to the next middleware in the chain

Middleware functions are chained — each one either responds to the request or passes it down the chain.

### The chain pattern

```
Request
  ↓
cors()              — adds CORS headers to every response
  ↓
express.json()      — parses JSON body into req.body
  ↓
authenticate        — verifies JWT, attaches req.user
  ↓
requireWriteAccess  — checks req.user.role === "full-access"
  ↓
route handler       — does the actual work
  ↓
Response
```

### Example: authentication middleware

```typescript
// backend/src/middleware/auth.ts
function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
    // NOT calling next() — the chain stops here
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded; // attach to request for downstream use
    next(); // pass control to the next middleware/handler
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

### Applying middleware selectively

Middleware can be applied globally (all routes) or to specific routes:

```typescript
// Global — every request
app.use(cors());
app.use(express.json());

// Route-level — only this endpoint
router.post("/", authenticate, requireWriteAccess, async (req, res) => {
  // only runs if JWT is valid AND role is full-access
  const category = await prisma.category.create({ data: req.body });
  res.json({ data: category });
});
```

### Error middleware

A special middleware with four parameters is an error handler:

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});
```

It only runs when a previous middleware calls `next(err)` with an error argument.

### Why this pattern

The middleware chain keeps concerns separated. The route handler only needs to worry about its business logic — it never has to think about CORS headers, JSON parsing, or authentication because those are handled before it runs. Adding a new protection to a route is one line: `router.get("/", authenticate, handler)`.

---

## 8. Tailwind CSS — Utility-First Styling

### Traditional CSS approach

```css
/* styles.css */
.button {
  background-color: #6366f1;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}
.button:hover {
  background-color: #4f46e5;
}
```

```tsx
<button className="button">Click</button>
```

### Tailwind approach

Tailwind gives you tiny single-purpose CSS classes. Instead of writing CSS files, you compose classes directly in the markup:

```tsx
<button className="bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-600">
  Click
</button>
```

### Why utility-first

- **No naming things** — coming up with class names (`button`, `card-header`, `hero-section`) is surprisingly hard and leads to naming conflicts
- **Co-located with markup** — the style is right next to the element; no context switching between HTML and CSS files
- **No dead CSS** — Tailwind's build step scans your files and includes only the classes you actually use
- **Consistent design tokens** — `bg-indigo-500` is always the same shade; `p-4` is always 16px. No "how big is this padding again?"

### The `cn()` utility

Combining conditional classes is messy:

```tsx
// Messy
className={`btn ${isActive ? "btn-active" : ""} ${disabled ? "btn-disabled" : ""}`}
```

The `cn()` utility (from `clsx` + `tailwind-merge`) handles this:

```tsx
className={cn(
  "rounded px-4 py-2",
  isActive && "bg-indigo-500 text-white",
  disabled && "opacity-50 cursor-not-allowed"
)}
```

`tailwind-merge` also resolves conflicts — if you pass both `bg-red-500` and `bg-blue-500`, it keeps only the last one rather than letting both through.

### shadcn/ui

shadcn/ui is not a component library in the traditional sense (you don't install components, you copy them into your project). It provides React components built on top of Radix UI (unstyled, accessible primitives) and styled with Tailwind.

The advantage: you own the code. You can modify the components directly. There is no dependency to update — the component is yours.

In this project, `Button`, `Input`, `Label`, `Textarea`, and `Badge` in `frontend/src/components/ui/` come from shadcn/ui.

---

*For React fundamentals (components, hooks, state), see `REACT.md`. For protocol concepts (REST, SOAP, GraphQL, gRPC, JWT), see `CONCEPTS.md`.*
