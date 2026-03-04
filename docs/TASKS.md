# IIS Project — Task Checklist
**Endpoint #58:** Strapi Categories (`/api/categories`)
**Stack:** Vite + React + TS (frontend) · Node.js + TS Express (backend) · gRPC server (Node.js)

---

## Task 1 — REST Upload with XML/JSON Validation (6pts)
- [ ] Define Category entity (id, name, slug, description, createdAt, updatedAt)
- [ ] Create `schemas/category.xsd`
- [ ] Create `schemas/category.schema.json`
- [ ] `POST /api/upload` — accepts multipart XML + JSON files
- [ ] Validate XML against XSD using `libxmljs2`
- [ ] Validate JSON against schema using `ajv`
- [ ] Return validation errors if invalid
- [ ] Save valid entity to DB and return it
- [ ] React UI: file pickers for XML + JSON, display result/errors

## Task 2 — SOAP Interface with XPath Filtering (10pts)
- [ ] `GET /api/generate-xml` — fetch categories from DB, write `categories.xml`
- [ ] Define `categories.wsdl`
- [ ] Mount SOAP server at `/soap/categories` using `node-soap`
- [ ] Implement `SearchCategories(term: string)` SOAP method
- [ ] Load `categories.xml`, apply XPath filter using `xpath` npm package
- [ ] Return matched Category objects as SOAP response
- [ ] React UI: SOAP search form + results table

## Task 3 — XML Schema Validation (8pts)
- [ ] `validateXml(xmlPath, xsdPath)` utility using `libxmljs2`
- [ ] Validate `categories.xml` against `category.xsd` before XPath search
- [ ] Return structured validation messages if invalid
- [ ] Expose validation result via SOAP response or dedicated REST endpoint
- [ ] React UI: validation status/messages panel

## Task 4 — gRPC Weather Service (8pts)
- [ ] Write `weather.proto` (service + message types)
- [ ] gRPC server: fetch `https://vrijeme.hr/hrvatska_n.xml` on request
- [ ] Parse DHMZ XML with `fast-xml-parser`
- [ ] Filter stations by partial city name (case-insensitive)
- [ ] Return all matching stations with temperature
- [ ] Set up grpc-web proxy (Envoy or `@improbable-eng/grpc-web`)
- [ ] React UI: city input + temperature results list

## Task 5 — Custom REST API + JWT + GraphQL + Toggle (42pts)
- [ ] Prisma schema for Category model
- [ ] `POST /auth/login` → returns `{ accessToken, refreshToken }`
- [ ] `POST /auth/refresh` → returns new `accessToken`
- [ ] JWT middleware for protected routes
- [ ] `GET    /api/categories` — list all
- [ ] `GET    /api/categories/:id` — get one
- [ ] `POST   /api/categories` — create
- [ ] `PUT    /api/categories/:id` — update
- [ ] `DELETE /api/categories/:id` — delete
- [ ] Apollo Server at `/graphql`
- [ ] GraphQL: `Query { categories, category(id) }`
- [ ] GraphQL: `Mutation { createCategory, updateCategory, deleteCategory }`
- [ ] `.env` toggle: `USE_CUSTOM_API=true/false`
- [ ] Backend: respects toggle, proxies to Strapi if false
- [ ] React UI: CRUD table + GraphQL query panel + toggle switch in settings

## Task 6 — React Client App (10pts)
- [ ] Login page (email + password → JWT)
- [ ] Role handling (`read-only` vs `full-access`) from JWT claims
- [ ] Role guard: hide/disable POST/PUT/DELETE for `read-only`
- [ ] Task 1 panel: XML + JSON upload, validation result display
- [ ] Task 2 panel: SOAP search input + results
- [ ] Task 3 panel: XML validation status
- [ ] Task 4 panel: city name input + temperature results
- [ ] Task 5 panel: Categories CRUD table + GraphQL panel
- [ ] Settings panel: API source toggle
- [ ] Error handling and loading states throughout

---

## Project Structure (proposed)

```
IIS/
├── docs/
│   ├── PROJECT_REQUIREMENTS.md
│   └── TASKS.md
├── backend/                  # Node.js + Express + TS
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── categories.ts
│   │   │   └── upload.ts
│   │   ├── soap/
│   │   │   ├── categories.wsdl
│   │   │   └── categoriesService.ts
│   │   ├── graphql/
│   │   │   ├── schema.ts
│   │   │   └── resolvers.ts
│   │   ├── utils/
│   │   │   └── validateXml.ts
│   │   └── index.ts
│   ├── schemas/
│   │   ├── category.xsd
│   │   └── category.schema.json
│   └── prisma/
│       └── schema.prisma
├── grpc-server/              # Standalone gRPC server
│   ├── proto/
│   │   └── weather.proto
│   └── src/
│       └── server.ts
└── frontend/                 # Vite + React + TS
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── api/
    │   └── main.tsx
    └── vite.config.ts
```

---

## Dependencies (key npm packages)

**Backend:**
```
express, cors, helmet, dotenv
@prisma/client, prisma
jsonwebtoken, jose
libxmljs2
ajv, ajv-formats
fast-xml-parser
xpath, xmldom
soap (node-soap)
@apollo/server, graphql
@grpc/grpc-js, @grpc/proto-loader
```

**gRPC Server:**
```
@grpc/grpc-js, @grpc/proto-loader
fast-xml-parser, node-fetch
```

**Frontend:**
```
react, react-dom, react-router-dom
axios (or fetch)
@apollo/client, graphql
grpc-web (or @improbable-eng/grpc-web)
react-hook-form
```
