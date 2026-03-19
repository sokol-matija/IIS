# Tasks Explained

This document covers each of the six course tasks: what was required, how it was implemented, which files are involved, a key code snippet, and how to demo it during assessment.

---

## Task 1 — REST File Upload with XSD and JSON Schema Validation

**Points:** 6
**Learning Outcome (LO):** Implement a REST endpoint that accepts structured data files and validates them against formal schemas before persisting.

### What the task required

Build a REST endpoint that accepts an XML file and a JSON file as a multipart upload. The XML must be validated against an XSD schema; the JSON must be validated against a JSON Schema. If either file fails validation, return descriptive errors. If both are valid, persist the category to the database.

### What was implemented

- A `POST /api/upload` endpoint that accepts two files (`xmlFile`, `jsonFile`) via `multipart/form-data`.
- XML is validated structurally using `@xmldom/xmldom` against the rules defined in `category.xsd` (requires `name` and `slug` elements, optional `description`).
- JSON is validated using **AJV** (Another JSON Validator, draft-07) against `category.schema.json` (requires `name` and `slug` strings; `slug` must match the kebab-case pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- On success the category is written to the SQLite database via Prisma and the created record is returned.
- Temp files written by Multer to `/tmp/uploads/` are deleted after validation regardless of outcome.

### Files involved

| Layer | File |
|---|---|
| Route handler | `backend/src/routes/upload.ts` |
| XML validator | `backend/src/utils/validateXml.ts` |
| XSD schema | `backend/schemas/category.xsd` |
| JSON Schema | `backend/schemas/category.schema.json` |
| Frontend page | `frontend/src/pages/Task1Page.tsx` |

### Key code snippet

```typescript
// backend/src/routes/upload.ts
router.post(
  "/",
  upload.fields([
    { name: "xmlFile", maxCount: 1 },
    { name: "jsonFile", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const xmlContent = fs.readFileSync(files.xmlFile[0].path, "utf-8");
    const jsonContent = fs.readFileSync(files.jsonFile[0].path, "utf-8");

    // Validate XML against XSD structural rules
    const xmlResult = validateXmlAgainstXsd(xmlContent);
    if (!xmlResult.valid) {
      errors.push(...xmlResult.errors.map((e) => `XML: ${e}`));
    }

    // Validate JSON against AJV-compiled JSON Schema
    if (jsonData && !validateJson(jsonData)) {
      const jsonErrors = validateJson.errors?.map(
        (e) => `JSON: ${e.instancePath} ${e.message}`
      ) || [];
      errors.push(...jsonErrors);
    }

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const category = await prisma.category.create({ data: { ... } });
    res.json({ data: category });
  }
);
```

### How to demo

1. Open the frontend at `http://localhost:5173` and navigate to **Task 1**.
2. Prepare two files:
   - A valid XML file, for example:
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <category>
       <name>Test Category</name>
       <slug>test-category</slug>
       <description>A demo category</description>
     </category>
     ```
   - A valid JSON file, for example:
     ```json
     { "name": "Test Category", "slug": "test-category" }
     ```
3. Select both files and click **Upload & Validate**. The created database record is displayed on success.
4. To demonstrate validation failure, remove the `<name>` element from the XML and re-upload. The error `XML: Missing required element 'name'` is returned.

---

## Task 2 — SOAP Service with XPath Filtering

**Points:** 10
**Learning Outcome (LO):** Expose business logic via a SOAP/WSDL service; use XPath to query XML data.

### What the task required

Create a SOAP web service with a published WSDL that accepts a search term and returns matching categories. The search must use XPath to filter an XML document, not a direct database query.

### What was implemented

- A SOAP service (`CategoriesService`) mounted on `POST /soap` using the `soap` npm package.
- The WSDL is defined in `backend/src/soap/categories.wsdl` and describes one operation: `SearchCategories(term: string) → categories[]`.
- The service implementation reads the generated `generated/categories.xml` file (created by `GET /api/generate-xml`), parses it with `@xmldom/xmldom`, and applies an XPath query to find categories whose `name` or `description` contains the search term (case-insensitive via XPath `translate()`).
- A helper endpoint `GET /api/generate-xml` writes current database contents to `generated/categories.xml`.
- The frontend constructs a raw SOAP XML envelope, POSTs it to `/soap`, and parses the XML response.

### Files involved

| Layer | File |
|---|---|
| Service implementation | `backend/src/soap/categoriesService.ts` |
| WSDL definition | `backend/src/soap/categories.wsdl` |
| XML generator endpoint | `backend/src/index.ts` (`GET /api/generate-xml`) |
| XML validator (reused) | `backend/src/utils/validateXml.ts` |
| Frontend SOAP client | `frontend/src/api/soap.ts` |
| Frontend page | `frontend/src/pages/Task2Page.tsx` |

### Key code snippet

```typescript
// backend/src/soap/categoriesService.ts
const xpathQuery = `//category[
  contains(translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}') or
  contains(translate(description, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}')
]`;

const nodes = xpath.select(xpathQuery, doc as unknown as Node);
```

```typescript
// frontend/src/api/soap.ts — raw SOAP envelope construction
const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://iis.hr/categories">
  <soap:Body>
    <tns:SearchCategoriesRequest>
      <tns:term>${escapeXml(term)}</tns:term>
    </tns:SearchCategoriesRequest>
  </soap:Body>
</soap:Envelope>`;
```

### How to demo

1. Navigate to **Task 2** in the frontend.
2. Click **Generate categories.xml** — this calls `GET /api/generate-xml` and writes the XML file.
3. Enter a search term such as `electr` in the search box and click **Search via SOAP**.
4. The Electronics category matching the term is returned in a table.
5. You can inspect the raw SOAP WSDL at `http://localhost:3001/soap?wsdl`.

---

## Task 3 — XML Schema Validation (Jakarta XML Equivalent)

**Points:** 8
**Learning Outcome (LO):** Validate XML documents against a formal XSD schema; report violations programmatically.

### What the task required

Implement server-side XML validation against an XSD schema, equivalent to the Jakarta XML Binding / JAXB validation approach used in Java EE. The validator must check structural constraints (required elements, cardinality) and return structured error messages.

### What was implemented

- The XSD schema `backend/schemas/category.xsd` defines the valid structure: a `<category>` element must contain `<name>` (required) and `<slug>` (required), with an optional `<description>`; a `<categories>` element may contain zero or more `<category>` elements.
- The validator in `backend/src/utils/validateXml.ts` uses `@xmldom/xmldom` to parse and structurally validate XML in pure JavaScript. It checks for parse errors, validates the root element name, and enforces the required child elements.
- The endpoint `GET /api/validate-xml` reads `generated/categories.xml` and returns `{ valid: boolean, errors: string[] }`.
- The same `validateXmlAgainstXsd` function is reused by both the upload route (Task 1) and the SOAP service (Task 2).

### Files involved

| Layer | File |
|---|---|
| XSD schema | `backend/schemas/category.xsd` |
| Validator utility | `backend/src/utils/validateXml.ts` |
| Validate endpoint | `backend/src/index.ts` (`GET /api/validate-xml`) |
| Frontend page | `frontend/src/pages/Task3Page.tsx` |

### Key code snippet

```typescript
// backend/src/utils/validateXml.ts
export function validateXmlAgainstXsd(
  xmlString: string
): { valid: boolean; errors: string[] } {
  const parser = new DOMParser({
    onError: (level: string, msg: string) => {
      if (level === "error" || level === "fatalError") {
        parseErrors.push(String(msg));
      }
    },
  });

  const doc = parser.parseFromString(xmlString, "text/xml");
  const root = doc.documentElement;

  if (root.tagName === "categories") {
    const categoryElements = root.getElementsByTagName("category");
    for (let i = 0; i < categoryElements.length; i++) {
      validateCategoryNode(categoryElements[i]!, errors, i);
    }
  }

  return { valid: errors.length === 0, errors };
}

// backend/schemas/category.xsd (key constraints)
// <xs:element name="name" type="xs:string" minOccurs="1" maxOccurs="1"/>
// <xs:element name="slug" type="xs:string" minOccurs="1" maxOccurs="1"/>
// <xs:element name="description" type="xs:string" minOccurs="0" maxOccurs="1"/>
```

### How to demo

1. Navigate to **Task 3** in the frontend.
2. Click **Generate XML** to create `generated/categories.xml` from the database.
3. Click **Validate XML** — the response `{ valid: true, errors: [] }` is shown in green.
4. To demonstrate failure, manually corrupt the XML (e.g., directly edit the file to remove all `<slug>` elements) and click **Validate XML** again. The specific errors are listed.

---

## Task 4 — gRPC Weather Server with Backend Proxy

**Points:** 8
**Learning Outcome (LO):** Implement a gRPC service defined by a `.proto` file; consume it from a REST proxy layer.

### What the task required

Build a gRPC server that fetches and returns Croatian weather data. Expose it to the frontend through a REST proxy endpoint on the Express backend (since browsers cannot call gRPC directly).

### What was implemented

- The Protobuf contract is defined in `grpc-server/proto/weather.proto`: one service `WeatherService` with one unary RPC `GetTemperature(TemperatureRequest) → TemperatureResponse`.
- The gRPC server (`grpc-server/src/server.ts`) fetches live XML from `https://vrijeme.hr/hrvatska_n.xml`, parses it with `fast-xml-parser` in `weatherParser.ts`, and returns matching `WeatherStation` records filtered by city name.
- The backend has a REST proxy at `GET /api/weather?city=<name>` that dynamically loads the proto file, creates a gRPC client connected to `GRPC_SERVER_HOST`, and calls `GetTemperature`.
- The proto file is loaded at runtime from `grpc-server/proto/weather.proto` relative to the backend's source directory.

### Files involved

| Layer | File |
|---|---|
| Proto definition | `grpc-server/proto/weather.proto` |
| gRPC server | `grpc-server/src/server.ts` |
| XML parser | `grpc-server/src/weatherParser.ts` |
| REST proxy endpoint | `backend/src/index.ts` (`GET /api/weather`) |
| Frontend page | `frontend/src/pages/Task4Page.tsx` |

### Key code snippet

```protobuf
// grpc-server/proto/weather.proto
syntax = "proto3";
package weather;

service WeatherService {
  rpc GetTemperature (TemperatureRequest) returns (TemperatureResponse);
}

message TemperatureRequest { string city = 1; }
message TemperatureResponse { repeated WeatherStation stations = 1; }
message WeatherStation {
  string city = 1;
  string temperature = 2;
  string description = 3;
}
```

```typescript
// backend/src/index.ts — REST-to-gRPC proxy
app.get("/api/weather", (req, res) => {
  const PROTO_PATH = path.resolve(__dirname, "../../grpc-server/proto/weather.proto");
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, { ... });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const client = new WeatherService(GRPC_HOST, grpc.credentials.createInsecure());

  client.GetTemperature({ city }, (err, response) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(response);
  });
});
```

### How to demo

1. Ensure the gRPC server is running (`npm run dev` in `grpc-server/`).
2. Navigate to **Task 4** in the frontend.
3. Enter `Zagreb` in the city input and click **Get Temperature**.
4. A table of matching Croatian weather stations with city, temperature, and description is displayed.
5. Enter a partial name like `Split` to see stations from the Split area.

---

## Task 5 — Custom REST API + JWT Authentication + GraphQL + API Toggle

**Points:** 42
**Learning Outcome (LO):** Implement a full CRUD REST API with JWT-based authentication, expose the same data via GraphQL, and support a runtime API source toggle (custom vs. Strapi CMS).

### What the task required

This is the largest task. It covers:
- A custom REST API for categories with full CRUD, protected by JWT.
- JWT authentication with access tokens (15-minute expiry) and refresh tokens (7-day expiry).
- Role-based access: `read-only` users may only read; `full-access` users may create, update, and delete.
- A GraphQL API (Apollo Server 4) over the same data with the same auth enforcement.
- A settings toggle (`USE_CUSTOM_API`) that switches the source of `GET /api/categories` between the local database and a Strapi CMS proxy.

### What was implemented

**Authentication (`/auth/login`, `/auth/refresh`):**
- `POST /auth/login` verifies credentials against the Prisma `User` table and returns `accessToken` (JWT, 15 min) and `refreshToken` (JWT, 7 days).
- `POST /auth/refresh` validates a refresh token and issues a new access token.
- The `authenticate` middleware (`backend/src/middleware/auth.ts`) verifies the `Authorization: Bearer <token>` header on protected routes.
- The `requireWriteAccess` middleware rejects requests where `role !== 'full-access'`.

**REST CRUD (`/api/categories`):**
- `GET /api/categories` — returns all categories (respects `USE_CUSTOM_API` toggle).
- `GET /api/categories/:id` — returns one category.
- `POST /api/categories` — creates a category (full-access only).
- `PUT /api/categories/:id` — updates a category (full-access only).
- `DELETE /api/categories/:id` — deletes a category (full-access only).

**GraphQL (`/graphql`):**
- Apollo Server 4 with `expressMiddleware`.
- Queries: `categories`, `category(id)` — require any authenticated user.
- Mutations: `createCategory`, `updateCategory`, `deleteCategory` — require `full-access` role.
- The JWT token from the `Authorization` header is extracted in the Apollo context and verified per-resolver.

**API Toggle (`/api/settings`):**
- `GET /api/settings` — returns `{ useCustomApi: boolean }`.
- `PUT /api/settings` — updates the `USE_CUSTOM_API` process environment variable at runtime.
- When `false`, `GET /api/categories` proxies to `STRAPI_URL/api/categories`.

### Files involved

| Layer | File |
|---|---|
| Auth routes | `backend/src/routes/auth.ts` |
| Auth middleware | `backend/src/middleware/auth.ts` |
| Categories REST | `backend/src/routes/categories.ts` |
| GraphQL schema | `backend/src/graphql/schema.ts` |
| GraphQL resolvers | `backend/src/graphql/resolvers.ts` |
| Settings endpoints | `backend/src/index.ts` (`GET/PUT /api/settings`) |
| Frontend API client | `frontend/src/api/categories.ts` |
| Auth store | `frontend/src/store/authStore.ts` |
| Frontend page | `frontend/src/pages/Task5Page.tsx` |
| Settings page | `frontend/src/pages/SettingsPage.tsx` |

### Key code snippet

```typescript
// backend/src/routes/auth.ts — login endpoint
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
res.json({ accessToken, refreshToken, role: user.role });

// backend/src/graphql/resolvers.ts — role enforcement
function requireWrite(user: AuthPayload): void {
  if (user.role !== "full-access") {
    throw new GraphQLError("Insufficient permissions", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}
```

```graphql
# GraphQL schema (backend/src/graphql/schema.ts)
type Query {
  categories: [Category!]!
  category(id: Int!): Category
}

type Mutation {
  createCategory(input: CategoryInput!): Category!
  updateCategory(id: Int!, input: CategoryUpdateInput!): Category!
  deleteCategory(id: Int!): Category!
}
```

### How to demo

1. Navigate to the frontend at `http://localhost:5173`. You are redirected to the login page.
2. Log in as `admin@iis.hr` / `admin123` (full-access). All CRUD buttons are active.
3. In **Task 5**, create a new category with name `Demo`, slug `demo`, and a description.
4. Edit the category and change its name. Delete it.
5. In the GraphQL panel, run the default query to list all categories. Observe the JWT is sent automatically.
6. Log out, log in as `reader@iis.hr` / `reader123` (read-only). The create/update/delete controls are disabled.
7. Visit **Settings** and toggle to **Strapi Proxy**. `GET /api/categories` now proxies to Strapi (will return 502 if Strapi is not running — expected).
8. Toggle back to **Custom API** to restore normal operation.

---

## Task 6 — React Client with Role-Based Access Control

**Points:** 10
**Learning Outcome (LO):** Build a React SPA that integrates with all backend services and enforces UI-level role-based access control.

### What the task required

Build a React frontend application that:
- Authenticates users via the JWT auth endpoint and persists sessions across page reloads.
- Protects all routes behind a login gate.
- Renders different UI capabilities depending on the authenticated user's role.
- Provides a dedicated UI page for each of the five backend tasks.

### What was implemented

**Authentication and session management (`authStore`):**
- Auth state (access token, role, email) lives in a Zustand store (`frontend/src/store/authStore.ts`).
- `AuthProvider` (in `context/AuthContext.tsx`) runs on mount, attempts a silent token refresh from `localStorage`, and writes the result into the store, restoring the session after page reload.
- `getToken()` proactively refreshes the access token when it will expire within 60 seconds, ensuring API calls never fail due to token expiry.

**Route protection:**
- `ProtectedRoute` (in `App.tsx`) redirects unauthenticated users to `/login`.
- After login the user is redirected to `/task1`.

**Role-based UI controls:**
- The `RoleGuard` component conditionally renders children only when `role === requiredRole`.
- On `Task5Page`, write buttons (`Create`, `Update`, `Delete`) check `role === 'full-access'` and are visually disabled (grey, `cursor: not-allowed`) for read-only users.
- The CRUD form submit button is `disabled` when the user lacks write access.

**Page structure:**
- `Layout` provides the navigation sidebar and wraps all task pages via React Router's `<Outlet>`.
- Five task pages (`Task1Page` through `Task5Page`) and a `SettingsPage` are nested under the protected layout route.

### Files involved

| Layer | File |
|---|---|
| App router and route guards | `frontend/src/App.tsx` |
| Auth store | `frontend/src/store/authStore.ts` |
| Role-guard component | `frontend/src/components/RoleGuard.tsx` |
| Layout and navigation | `frontend/src/components/Layout.tsx` |
| Login page | `frontend/src/pages/LoginPage.tsx` |
| Category table component | `frontend/src/components/CategoryTable.tsx` |
| Task pages | `frontend/src/pages/Task1Page.tsx` — `Task5Page.tsx` |
| Settings page | `frontend/src/pages/SettingsPage.tsx` |

### Key code snippet

```typescript
// frontend/src/components/RoleGuard.tsx
export default function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const { role } = useAuth();
  if (role !== requiredRole) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}

// frontend/src/App.tsx — protected route
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// frontend/src/store/authStore.ts — silent refresh on mount (useAuthInit hook)
useEffect(() => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    fetch(`${API_URL}/auth/refresh`, { method: "POST", body: JSON.stringify({ refreshToken }) })
      .then(res => res.json())
      .then(data => {
        setAccessToken(data.accessToken);
        setRole(decodeJwt(data.accessToken).role);
      });
  }
}, []);
```

### How to demo

1. Open `http://localhost:5173`. You are redirected to `/login`.
2. Log in as `admin@iis.hr` / `admin123`. All five task tabs are accessible.
3. On Task 5, the CRUD form and action buttons are active.
4. Log out. Log in as `reader@iis.hr` / `reader123`.
5. On Task 5, the create/update/delete button is greyed out with tooltip "Insufficient permissions".
6. Reload the page — the session is restored silently from `localStorage` without re-entering credentials.

---

## File-to-Task Summary Table

| File | Task(s) |
|---|---|
| `backend/src/routes/upload.ts` | Task 1 |
| `backend/src/utils/validateXml.ts` | Task 1, Task 2, Task 3 |
| `backend/schemas/category.xsd` | Task 1, Task 3 |
| `backend/schemas/category.schema.json` | Task 1 |
| `backend/src/soap/categoriesService.ts` | Task 2 |
| `backend/src/soap/categories.wsdl` | Task 2 |
| `frontend/src/api/soap.ts` | Task 2 |
| `grpc-server/proto/weather.proto` | Task 4 |
| `grpc-server/src/server.ts` | Task 4 |
| `grpc-server/src/weatherParser.ts` | Task 4 |
| `backend/src/routes/auth.ts` | Task 5, Task 6 |
| `backend/src/middleware/auth.ts` | Task 5 |
| `backend/src/routes/categories.ts` | Task 5 |
| `backend/src/graphql/schema.ts` | Task 5 |
| `backend/src/graphql/resolvers.ts` | Task 5 |
| `backend/src/index.ts` | Task 2, Task 3, Task 4, Task 5 |
| `backend/prisma/schema.prisma` | Task 5 |
| `backend/prisma/seed.ts` | Task 5, Task 6 |
| `frontend/src/App.tsx` | Task 6 |
| `frontend/src/store/authStore.ts` | Task 5, Task 6 |
| `frontend/src/components/RoleGuard.tsx` | Task 6 |
| `frontend/src/components/Layout.tsx` | Task 6 |
| `frontend/src/components/CategoryTable.tsx` | Task 5, Task 6 |
| `frontend/src/pages/LoginPage.tsx` | Task 6 |
| `frontend/src/pages/Task1Page.tsx` | Task 1, Task 6 |
| `frontend/src/pages/Task2Page.tsx` | Task 2, Task 6 |
| `frontend/src/pages/Task3Page.tsx` | Task 3, Task 6 |
| `frontend/src/pages/Task4Page.tsx` | Task 4, Task 6 |
| `frontend/src/pages/Task5Page.tsx` | Task 5, Task 6 |
| `frontend/src/pages/SettingsPage.tsx` | Task 5, Task 6 |
| `frontend/src/api/categories.ts` | Task 5 |
