# Architecture

## System Overview

```
+---------------------------------------------------+
|              Browser (port 5173)                   |
|       Vite + React 19 + TypeScript + SPA           |
|                                                   |
|  Pages: Login, Task1-5, Settings                   |
|  Auth: JWT in memory, refresh token in localStorage|
+------|-----------|-----------|---------------------+
       |           |           |
       | HTTP      | HTTP      | HTTP
       | (REST,    | (GraphQL) | (SOAP XML)
       | JSON)     |           |
       v           v           v
+----- Vite Dev Proxy (all -> localhost:3001) -------+
       |           |           |
       v           v           v
+---------------------------------------------------+
|           Express Backend (port 3001)              |
|           Node.js + TypeScript                     |
|                                                   |
|  /auth/*            JWT login + refresh            |
|  /api/categories    REST CRUD (Prisma)             |
|  /api/upload        Multipart XML+JSON validation  |
|  /api/generate-xml  DB -> XML file                 |
|  /api/validate-xml  XSD validation                 |
|  /api/weather       gRPC proxy to weather server   |
|  /api/settings      API source toggle              |
|  /graphql           Apollo Server (categories)     |
|  /soap              SOAP service (node-soap)       |
|                                                   |
|  Database: SQLite via Prisma ORM                   |
+------|--------------------------------------------+
       |
       | gRPC (protobuf)
       | localhost:50051
       v
+---------------------------------------------------+
|          gRPC Server (port 50051)                  |
|          Node.js + TypeScript                      |
|                                                   |
|  weather.proto -> WeatherService.GetTemperature    |
|  Fetches https://vrijeme.hr/hrvatska_n.xml         |
|  Parses XML, filters by city, returns stations     |
+---------------------------------------------------+
```

## Port Map

| Service         | Port  | Protocol       | URL                                |
|-----------------|-------|----------------|------------------------------------|
| Frontend (Vite) | 5173  | HTTP           | `http://localhost:5173`            |
| Backend (Express) | 3001 | HTTP          | `http://localhost:3001`            |
| GraphQL         | 3001  | HTTP (POST)    | `http://localhost:3001/graphql`    |
| SOAP            | 3001  | HTTP (POST)    | `http://localhost:3001/soap`       |
| WSDL            | 3001  | HTTP (GET)     | `http://localhost:3001/soap?wsdl`  |
| gRPC Server     | 50051 | HTTP/2 (gRPC)  | `localhost:50051`                  |
| Strapi (optional) | 1337 | HTTP          | `http://localhost:1337`            |

## How the Three Services Connect

1. **Frontend -> Backend**: The Vite dev server proxies all `/api`, `/auth`, `/graphql`, and `/soap` requests from port 5173 to the Express backend on port 3001. This is configured in `frontend/vite.config.ts`.

2. **Backend -> gRPC Server**: When the frontend calls `GET /api/weather?city=Zagreb`, the Express backend acts as a gRPC client. It loads `weather.proto`, creates a gRPC client connection to `localhost:50051`, calls `GetTemperature`, and returns the response as JSON. The gRPC server address is configurable via `GRPC_SERVER_HOST` env var.

3. **Backend -> SQLite**: All category data is stored in a local SQLite database at `backend/prisma/dev.db`, accessed through the Prisma ORM.

4. **Backend -> Strapi (optional)**: When `USE_CUSTOM_API=false`, the `GET /api/categories` endpoint proxies to an external Strapi instance at `STRAPI_URL` instead of querying the local database.

## Data Flow by Task

### Task 1 -- REST Upload with XML/JSON Validation

```
Browser                        Backend
  |                               |
  |  POST /api/upload             |
  |  (multipart: xmlFile,        |
  |   jsonFile)                   |
  |------------------------------>|
  |                               |-- Parse XML file
  |                               |-- Validate XML against category.xsd
  |                               |-- Parse JSON file
  |                               |-- Validate JSON against category.schema.json (Ajv)
  |                               |-- If valid: INSERT into Category table
  |  { data: category }          |
  |<------------------------------|
```

### Task 2 -- SOAP Interface with XPath Filtering

```
Browser                        Backend
  |                               |
  |  GET /api/generate-xml        |
  |------------------------------>|-- SELECT * FROM Category
  |  { message, count }          |-- Write categories.xml to disk
  |<------------------------------|
  |                               |
  |  POST /soap                   |
  |  (SOAP envelope with term)   |
  |------------------------------>|-- Read categories.xml from disk
  |                               |-- Validate XML against XSD
  |                               |-- Apply XPath query to filter by term
  |  SOAP response with matches  |
  |<------------------------------|
```

### Task 3 -- XML Schema Validation

```
Browser                        Backend
  |                               |
  |  GET /api/generate-xml        |
  |------------------------------>|-- Write categories.xml
  |<------------------------------|
  |                               |
  |  GET /api/validate-xml        |
  |------------------------------>|-- Read categories.xml
  |                               |-- Validate structure against XSD rules
  |  { valid: bool, errors: [] } |
  |<------------------------------|
```

### Task 4 -- gRPC Weather Service

```
Browser              Backend                 gRPC Server          vrijeme.hr
  |                     |                        |                     |
  | GET /api/weather    |                        |                     |
  | ?city=Zagreb        |                        |                     |
  |---------  --------->|                        |                     |
  |                     | GetTemperature(Zagreb) |                     |
  |                     |----------------------->|                     |
  |                     |                        | GET hrvatska_n.xml  |
  |                     |                        |-------------------->|
  |                     |                        |<--------------------|
  |                     |                        |-- Parse XML         |
  |                     |                        |-- Filter by city    |
  |                     | { stations: [...] }    |                     |
  |                     |<-----------------------|                     |
  | { stations: [...] } |                        |                     |
  |<--------------------|                        |                     |
```

### Task 5 -- REST CRUD + GraphQL

```
Browser                        Backend
  |                               |
  | POST /auth/login              |
  |------------------------------>|-- Verify credentials against User table
  | { accessToken, refreshToken } |-- Sign JWT tokens
  |<------------------------------|
  |                               |
  | GET /api/categories           |
  | Authorization: Bearer <jwt>   |
  |------------------------------>|-- Verify JWT (authenticate middleware)
  |                               |-- SELECT * FROM Category
  | { data: [...] }              |
  |<------------------------------|
  |                               |
  | POST /graphql                 |
  | Authorization: Bearer <jwt>   |
  | { query: "{ categories {...}}" }
  |------------------------------>|-- Extract token from context
  |                               |-- Verify JWT
  |                               |-- Execute GraphQL resolver
  | { data: { categories: [...] }}|
  |<------------------------------|
```

## Environment Variables

| Variable            | Default                       | Description                                      |
|---------------------|-------------------------------|--------------------------------------------------|
| `DATABASE_URL`      | `file:./dev.db`              | Prisma database connection string (SQLite path)  |
| `JWT_SECRET`        | `iis-super-secret-key-2025`  | Secret for signing JWT access tokens             |
| `JWT_REFRESH_SECRET`| `iis-refresh-secret-key-2025`| Secret for signing JWT refresh tokens            |
| `USE_CUSTOM_API`    | `true`                       | `true` = local DB, `false` = proxy to Strapi     |
| `STRAPI_URL`        | `http://localhost:1337`      | Strapi instance URL (used when toggle is false)  |
| `PORT`              | `3001`                       | Express server port                              |
| `GRPC_SERVER_HOST`  | `localhost:50051`            | gRPC weather server address                      |
| `VITE_API_URL`      | `""` (empty)                 | Frontend API base URL (empty = same origin proxy)|

## Key Files

```
IIS/
├── docs/                        # Documentation
├── backend/                     # Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts             # Server entry point, mounts all services
│   │   ├── routes/
│   │   │   ├── auth.ts          # POST /auth/login, POST /auth/refresh
│   │   │   ├── categories.ts    # CRUD /api/categories (JWT-protected)
│   │   │   └── upload.ts        # POST /api/upload (XML+JSON validation)
│   │   ├── soap/
│   │   │   ├── categories.wsdl  # WSDL definition
│   │   │   └── categoriesService.ts  # SOAP SearchCategories implementation
│   │   ├── graphql/
│   │   │   ├── schema.ts        # GraphQL type definitions
│   │   │   └── resolvers.ts     # GraphQL resolvers (JWT-protected)
│   │   ├── middleware/
│   │   │   └── auth.ts          # authenticate, requireRole, requireWriteAccess
│   │   └── utils/
│   │       └── validateXml.ts   # XML structural validation
│   ├── schemas/
│   │   ├── category.xsd         # XML Schema for categories
│   │   └── category.schema.json # JSON Schema for categories
│   ├── prisma/
│   │   ├── schema.prisma        # Database models (Category, User)
│   │   └── seed.ts              # Seeds users + sample categories
│   └── generated/               # Runtime-generated XML files
│       └── categories.xml       # Generated by /api/generate-xml
├── grpc-server/                 # Standalone gRPC weather server
│   ├── proto/
│   │   └── weather.proto        # Protocol Buffers definition
│   └── src/
│       └── server.ts            # gRPC server implementation
└── frontend/                    # Vite + React SPA
    ├── vite.config.ts           # Dev server + proxy config
    └── src/
        ├── App.tsx              # Router + protected routes
        ├── store/
        │   └── authStore.ts     # Zustand auth state (access token, role, getToken)
        ├── context/
        │   └── AuthContext.tsx  # Compat shim — re-exports useAuthStore as useAuth
        ├── hooks/
        │   └── useGenerateXmlMutation.ts  # Shared TanStack Query mutation hook
        ├── lib/
        │   └── utils.ts         # Shared utilities (cn, etc.)
        ├── api/
        │   ├── auth.ts          # loginApi, refreshApi (fetch wrappers)
        │   ├── categories.ts    # REST client for categories
        │   ├── settings.ts      # Settings API client
        │   └── soap.ts          # SOAP client (builds XML envelope)
        ├── pages/
        │   ├── LoginPage.tsx    # Login form
        │   ├── Task1Page.tsx    # File upload + validation
        │   ├── Task2Page.tsx    # SOAP search
        │   ├── Task3Page.tsx    # XML validation
        │   ├── Task4Page.tsx    # Weather (gRPC proxy)
        │   ├── Task5Page.tsx    # CRUD + GraphQL
        │   └── SettingsPage.tsx # API source toggle
        ├── components/
        │   ├── Layout.tsx       # Sidebar navigation + outlet
        │   ├── CategoryTable.tsx # Reusable category table
        │   ├── RoleGuard.tsx    # Conditionally renders children by role
        │   └── ui/              # shadcn/ui primitives (button, input, badge, …)
        └── __tests__/           # Vitest unit tests
```
