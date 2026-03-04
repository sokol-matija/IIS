# IIS Project Requirements
**Course:** Interoperabilnost informacijskih sustava (IIS) 2025./2026.
**Assigned Endpoint #58:** Kategorije entiteta — Strapi REST API
**Base URL:** `https://{instance}/api/categories`
**Entity Domain:** Categories (GET · POST · PUT · DELETE)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React + TypeScript |
| Backend | Node.js + TypeScript (Express or Fastify) |
| Database | PostgreSQL (or SQLite for local dev) |
| ORM | Prisma |
| SOAP | `soap` (npm: strong-soap or node-soap) |
| gRPC | `@grpc/grpc-js` (server) + `grpc-web` (browser client) |
| GraphQL | Apollo Server |
| JWT | `jsonwebtoken` + `jose` |
| XML validation (XSD) | `libxmljs2` |
| JSON Schema validation | `ajv` |
| XML parsing | `fast-xml-parser` |

---

## Entity: Category

| Field | Type | Required |
|-------|------|----------|
| `id` | integer | auto |
| `name` | string | yes |
| `slug` | string | yes |
| `description` | string | no |
| `createdAt` | datetime | auto |
| `updatedAt` | datetime | auto |

---

## Task 1 — REST API with XML/JSON Upload & Validation
**Points:** LO2–2, LO3–2, LO5–2

POST endpoint that accepts both XML and JSON files containing Category data:
- **XML** → validate against `category.xsd` using `libxmljs2` → save to DB
- **JSON** → validate against `category.schema.json` using `ajv` → save to DB
- On validation failure: return structured error messages
- On success: return saved entity

**Deliverables:**
- `schemas/category.xsd`
- `schemas/category.schema.json`
- `POST /api/upload` (multipart: xml file + json file)

---

## Task 2 — SOAP Interface with XPath Filtering
**Points:** LO2–4, LO3–2, LO5–4

- Backend generates `categories.xml` from the DB (or Strapi REST data)
- Exposes a SOAP web service via `node-soap`
- SOAP method `SearchCategories(term)` uses XPath (`xpath` npm) to filter the XML
- Returns matched categories as SOAP response

**Deliverables:**
- `categories.wsdl`
- `GET /api/generate-xml` → writes `categories.xml` to disk
- SOAP server mounted at `/soap/categories`
- Method: `SearchCategories(term: string) → Category[]`

---

## Task 3 — XML Schema Validation (Jakarta XML equivalent)
**Points:** LO2–4, LO5–2, LO7–2

Using `libxmljs2` (TypeScript equivalent of Jakarta XML/JAXB validation):
- Validate the `categories.xml` file from Task 2 against `category.xsd`
- Return detailed validation messages if the XML is invalid
- Integrated into the Task 2 pipeline (validate before XPath search)

**Deliverables:**
- `validateXml(xmlPath, xsdPath)` utility using `libxmljs2`
- Validation errors exposed via the SOAP response or a dedicated REST endpoint

---

## Task 4 — gRPC Weather Service (DHMZ)
**Points:** LO2–4, LO3–2, LO5–2

gRPC server that:
- Fetches `https://vrijeme.hr/hrvatska_n.xml` on each request
- Parses XML with `fast-xml-parser`
- Filters stations by city name (partial/case-insensitive match)
- Returns all matching cities with their current temperature

Browser client uses `grpc-web` (proxied via Envoy or `@improbable-eng/grpc-web`)

**Deliverables:**
- `weather.proto`
- gRPC server (`grpc-server/`)
- React UI component calling the gRPC service via grpc-web

---

## Task 5 — Custom REST API + JWT + GraphQL + Toggle
**Points:** LO3–8, LO4–12, LO5–12, LO6–2, LO7–8

Custom Categories API backed by the application DB:

**Auth:**
- `POST /auth/login` → `{ accessToken, refreshToken }`
- `POST /auth/refresh` → `{ accessToken }`
- Access token: short-lived (15min), Refresh token: long-lived (7d)

**REST (JWT-protected):**
- `GET    /api/categories`
- `GET    /api/categories/:id`
- `POST   /api/categories`
- `PUT    /api/categories/:id`
- `DELETE /api/categories/:id`

**GraphQL** (Apollo Server, JWT-protected):
- `Query: { categories, category(id) }`
- `Mutation: { createCategory, updateCategory, deleteCategory }`

**Toggle** (env var in `.env`):
```
USE_CUSTOM_API=true   # use local DB API
USE_CUSTOM_API=false  # proxy to public Strapi API
```
Frontend reads this toggle and switches the base URL accordingly.

---

## Task 6 — React Client Application
**Points:** LO1–2, LO3–4, LO7–4

React + TypeScript web UI with:

**Auth:**
- Login form → JWT stored in memory (access) + httpOnly cookie (refresh)
- Two roles: `read-only` (GET only) | `full-access` (all operations)
- Role enforced in UI: write buttons disabled/hidden for read-only

**Pages / Panels:**
- Task 1: File upload UI (XML + JSON), show validation results
- Task 2: SOAP search form + results table
- Task 3: XML validation status panel
- Task 4: City name input → temperature results (via gRPC-web)
- Task 5: Categories CRUD table + GraphQL query panel
- Settings: API toggle switch (custom vs public Strapi)

---

## Architecture

```
Browser (Vite + React + TS)
    │
    ├── HTTP/REST  →  Express API (Node.js + TS)
    │                  ├── /auth (JWT)
    │                  ├── /api/categories (CRUD, Task 5)
    │                  ├── /api/upload (XML+JSON validate, Task 1)
    │                  ├── /api/generate-xml (Task 2)
    │                  ├── /graphql (Apollo Server, Task 5)
    │                  └── /soap/categories (node-soap, Tasks 2+3)
    │
    └── gRPC-web   →  gRPC Server (Node.js + TS)
                       └── GetTemperature(city) → DHMZ XML
```

---

## Points Summary

| Task | Description | Points |
|------|-------------|--------|
| 1 | REST upload + XSD/JSON Schema validation | 6 |
| 2 | SOAP + XPath filtering | 10 |
| 3 | XML Schema validation (libxmljs2) | 8 |
| 4 | gRPC + DHMZ weather | 8 |
| 5 | Custom REST + JWT + GraphQL + toggle | 42 |
| 6 | React client + roles | 10 |
| **Total** | | **84** |
