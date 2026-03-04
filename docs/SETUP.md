# Setup Guide

This guide explains how to install, configure, and run all three sub-projects of the IIS monorepo: the Express backend, the gRPC weather server, and the React frontend.

---

## Prerequisites

- **Node.js 18+** (LTS recommended) — verify with `node --version`
- **npm 9+** — included with Node.js; verify with `npm --version`
- No global tools are required beyond Node.js. All compilers and runtimes (`ts-node`, `prisma`, `vite`) are installed as local dev dependencies.

---

## Repository Structure

```
IIS/
├── backend/              # Express REST + SOAP + GraphQL + Prisma (SQLite)
│   ├── prisma/           # Schema, migrations, seed script
│   ├── schemas/          # category.xsd, category.schema.json
│   ├── src/              # TypeScript source
│   └── .env              # Environment variables (not committed)
├── grpc-server/          # gRPC weather server
│   ├── proto/            # weather.proto definition
│   └── src/              # TypeScript source
├── frontend/             # React 19 + Vite SPA
│   └── src/              # TypeScript + TSX source
├── docs/                 # Project documentation
└── strapi-instance/      # Optional Strapi CMS (Task 5 API toggle)
```

Each sub-project is independent and has its own `package.json`. You must install dependencies and (where applicable) compile each one separately.

---

## Step-by-Step Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd IIS
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install gRPC server dependencies

```bash
cd ../grpc-server
npm install
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Database Setup

The backend uses **SQLite** via Prisma. All data is stored in a single file (`backend/prisma/dev.db`).

### Push the schema to the database

Run this from inside the `backend/` directory:

```bash
npx prisma db push
```

This creates the `dev.db` file and applies the schema (two tables: `Category` and `User`).

### Seed the database

```bash
npm run seed
```

This populates the database with two user accounts and eight sample categories:

| Email | Password | Role |
|---|---|---|
| `admin@iis.hr` | `admin123` | `full-access` |
| `reader@iis.hr` | `reader123` | `read-only` |

You can also run both steps together:

```bash
npm run prisma:setup
```

---

## Environment Variables

The backend requires a `.env` file at `backend/.env`. Copy the example file to get started:

```bash
cp backend/.env.example backend/.env
```

The default values in `.env.example` work out of the box for local development:

```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="iis-super-secret-key-2025"
JWT_REFRESH_SECRET="iis-refresh-secret-key-2025"
USE_CUSTOM_API=true
STRAPI_URL=http://localhost:1337
PORT=3001
GRPC_SERVER_HOST=localhost:50051
```

### Variable Reference

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Prisma SQLite database path, relative to `backend/prisma/` | `file:./dev.db` |
| `JWT_SECRET` | Secret key for signing access tokens (15-minute expiry) | any long random string |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (7-day expiry) | any long random string |
| `USE_CUSTOM_API` | When `true`, categories are served from the local SQLite DB; when `false`, GET requests proxy to Strapi | `true` |
| `STRAPI_URL` | Base URL of the optional Strapi instance (only used when `USE_CUSTOM_API=false`) | `http://localhost:1337` |
| `PORT` | Port the Express backend listens on | `3001` |
| `GRPC_SERVER_HOST` | Address of the gRPC weather server as seen by the backend | `localhost:50051` |

The frontend reads one environment variable from a `.env` file at `frontend/.env`:

```ini
VITE_API_URL=http://localhost:3001
```

Create this file if it does not exist. If omitted, all frontend API calls default to a relative URL (which works only when the frontend is proxied through the backend).

---

## Starting the Services

Open **three separate terminals**, one per service.

### Terminal 1 — gRPC weather server (port 50051)

```bash
cd grpc-server
npm run dev
```

Expected output:
```
gRPC server running on port 50051
```

### Terminal 2 — Express backend (port 3001)

```bash
cd backend
npm run dev
```

Expected output:
```
SOAP service mounted at /soap
Backend running on http://localhost:3001
GraphQL at http://localhost:3001/graphql
SOAP at http://localhost:3001/soap?wsdl
```

### Terminal 3 — React frontend (port 5173)

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v6.x.x  ready in ...ms

  ➜  Local:   http://localhost:5173/
```

### Service summary

| Service | Command | URL |
|---|---|---|
| gRPC server | `npm run dev` in `grpc-server/` | `localhost:50051` (binary gRPC) |
| Express backend | `npm run dev` in `backend/` | `http://localhost:3001` |
| React frontend | `npm run dev` in `frontend/` | `http://localhost:5173` |
| GraphQL playground | — | `http://localhost:3001/graphql` |
| SOAP WSDL | — | `http://localhost:3001/soap?wsdl` |

---

## Building for Production

Each sub-project compiles TypeScript to JavaScript in a `dist/` directory.

```bash
# Backend
cd backend && npm run build

# gRPC server
cd grpc-server && npm run build

# Frontend (TypeScript check + Vite bundle)
cd frontend && npm run build
```

Start compiled services with `npm start` in each directory.

---

## Running Tests

The project uses **Vitest** where tests are present. Run from any sub-project directory:

```bash
npx vitest run
```

---

## Common Errors and Fixes

### Prisma client not generated

**Error:** `Cannot find module '@prisma/client'` or `PrismaClientInitializationError`

**Fix:** Generate the Prisma client:
```bash
cd backend
npx prisma generate
```

This must be re-run after any change to `backend/prisma/schema.prisma`.

---

### Port already in use

**Error:** `EADDRINUSE: address already in use :::3001`

**Fix:** Find and kill the process occupying the port:
```bash
# macOS / Linux
lsof -ti :3001 | xargs kill -9

# or for the gRPC port
lsof -ti :50051 | xargs kill -9
```

---

### CORS errors in the browser console

**Symptom:** `Access to fetch at 'http://localhost:3001/...' has been blocked by CORS policy`

**Checks:**
1. Confirm the backend is running and reachable at `http://localhost:3001`.
2. Confirm `VITE_API_URL` in `frontend/.env` is set to `http://localhost:3001` (not `localhost:3001` without the scheme).
3. The backend applies `cors()` middleware globally — if you have modified `backend/src/index.ts`, ensure the `app.use(cors())` call remains before any route definitions.

---

### gRPC proto file not found

**Error:** `weather.proto not found` returned from `GET /api/weather`

**Explanation:** The backend resolves the proto file at runtime using a path relative to the compiled output:
```typescript
const PROTO_PATH = path.resolve(__dirname, "../../grpc-server/proto/weather.proto");
```
When running with `ts-node` from `backend/src/`, `__dirname` resolves to `backend/src/`, so the path goes up two levels to the repo root and then into `grpc-server/proto/`. This requires that the `grpc-server/` directory sits as a sibling of `backend/` at the repository root. Do not move either directory.

---

### Strapi not running when API toggle is off

**Symptom:** `GET /api/categories` returns `502 Bad Gateway: Failed to proxy to Strapi`

**Explanation:** This is expected behaviour. When `USE_CUSTOM_API` is set to `false` (either via the Settings page in the UI or by editing `.env`), the backend forwards GET category requests to the Strapi instance at `STRAPI_URL`. If Strapi is not running, the proxy fails. Either:
- Keep `USE_CUSTOM_API=true` (the default) to serve from the local SQLite database, or
- Start the Strapi instance located in `strapi-instance/` before toggling off the custom API.
