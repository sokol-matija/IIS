# Database

## Overview

The project uses **SQLite** as the database engine and **Prisma** as the ORM. The database file is stored locally at `backend/prisma/dev.db`.

## Prisma Schema

File: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Category {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  role     String
}
```

## Models

### Category

The primary data entity used across all tasks.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Int | Primary key, auto-increment | Unique identifier |
| `name` | String | Required | Display name (e.g., "Electronics") |
| `slug` | String | Required, unique | URL-friendly identifier (e.g., "electronics") |
| `description` | String? | Optional, nullable | Category description |
| `createdAt` | DateTime | Auto-set on creation | Timestamp of creation |
| `updatedAt` | DateTime | Auto-updated | Timestamp of last modification |

The `slug` field has a unique constraint. Attempting to create two categories with the same slug results in a `409 Conflict` error from the API.

### User

Stores authentication credentials and role assignments.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Int | Primary key, auto-increment | Unique identifier |
| `email` | String | Required, unique | Login email address |
| `password` | String | Required | Plaintext password |
| `role` | String | Required | Either `"full-access"` or `"read-only"` |

**Note:** Passwords are stored in plaintext. This is acceptable for a university course project but should never be done in production.

## SQLite File Location

The database file path is configured via the `DATABASE_URL` environment variable in `backend/.env`:

```
DATABASE_URL="file:./dev.db"
```

This resolves to `backend/prisma/dev.db` relative to the Prisma schema location.

## Seed Data

File: `backend/prisma/seed.ts`

The seed script creates initial data using `upsert` operations (safe to run multiple times).

### Seeded Users

| Email | Password | Role |
|-------|----------|------|
| `admin@iis.hr` | `admin123` | `full-access` |
| `reader@iis.hr` | `reader123` | `read-only` |

### Seeded Categories

| Name | Slug | Description |
|------|------|-------------|
| Electronics | `electronics` | Electronic devices and gadgets |
| Books | `books` | Physical and digital books |
| Clothing | `clothing` | Apparel and fashion items |
| Home & Garden | `home-garden` | Home improvement and garden supplies |
| Sports | `sports` | Sports equipment and accessories |
| Music | `music` | Musical instruments and recordings |
| Food & Beverages | `food-beverages` | Food products and drinks |
| Automotive | `automotive` | Car parts and accessories |

## Common Database Operations

### Initial Setup

Run from the `backend/` directory:

```bash
# Generate Prisma client + run migrations + seed in one command
npm run prisma:setup
```

This runs:
1. `prisma migrate dev --name init` -- creates the SQLite database and applies migrations
2. `ts-node prisma/seed.ts` -- populates initial data

### Individual Commands

```bash
# Generate Prisma client (after schema changes)
npm run prisma:generate

# Run migrations (creates/updates database)
npm run prisma:migrate

# Run seed script
npm run seed
```

### Reset the Database

To completely reset the database (drop all data and re-create):

```bash
cd backend

# Option 1: Reset via Prisma (drops DB, re-runs migrations)
npx prisma migrate reset

# Option 2: Manual reset (delete file, re-run setup)
rm -f prisma/dev.db
npm run prisma:setup
```

`prisma migrate reset` will:
1. Drop the database
2. Re-run all migrations
3. Run the seed script (if configured in `package.json` under `prisma.seed`)

### Inspect the Database

```bash
# Open Prisma Studio (web-based database browser)
cd backend
npx prisma studio
```

This opens a browser UI at `http://localhost:5555` where you can view and edit data.

### Direct SQLite Access

```bash
# Using sqlite3 CLI
sqlite3 backend/prisma/dev.db

# Example queries:
sqlite> SELECT * FROM Category;
sqlite> SELECT * FROM User;
sqlite> .schema
sqlite> .quit
```

## Validation Schemas

In addition to the Prisma schema (which defines the database structure), the project uses separate validation schemas for file upload validation in Task 1.

### XML Schema (XSD)

File: `backend/schemas/category.xsd`

Defines the structure for XML category documents:
- Root element can be `<category>` (single) or `<categories>` (collection)
- Required child elements: `<name>` (string), `<slug>` (string)
- Optional child element: `<description>` (string)

### JSON Schema

File: `backend/schemas/category.schema.json`

Validates JSON category objects:
- Required fields: `name` (non-empty string), `slug` (non-empty string matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`)
- Optional field: `description` (string)
- No additional properties allowed (`additionalProperties: false`)

These schemas are used by the upload endpoint (`POST /api/upload`) and are separate from the Prisma database schema.
