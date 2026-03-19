# Authentication and Authorization

## Overview

The project uses JWT (JSON Web Tokens) for authentication with a two-token strategy: a short-lived access token and a long-lived refresh token. Authorization is role-based with two roles: `full-access` and `read-only`.

## JWT Flow

```
1. Login
   Client                             Server
     |  POST /auth/login               |
     |  { email, password }            |
     |-------------------------------->|
     |                                 |-- Look up user by email
     |                                 |-- Verify password (plaintext comparison)
     |                                 |-- Sign access token (15min, JWT_SECRET)
     |                                 |-- Sign refresh token (7d, JWT_REFRESH_SECRET)
     |  { accessToken, refreshToken,   |
     |    role }                        |
     |<--------------------------------|

2. Access Protected Resource
     |  GET /api/categories            |
     |  Authorization: Bearer <access> |
     |-------------------------------->|
     |                                 |-- Verify JWT with JWT_SECRET
     |                                 |-- Attach user to req.user
     |                                 |-- Check role if write operation
     |  { data: [...] }               |
     |<--------------------------------|

3. Token Refresh (when access token expires)
     |  POST /auth/refresh             |
     |  { refreshToken }               |
     |-------------------------------->|
     |                                 |-- Verify with JWT_REFRESH_SECRET
     |                                 |-- Sign new access token
     |  { accessToken }               |
     |<--------------------------------|
```

## Token Details

| Token | Secret | Expiry | Contains |
|-------|--------|--------|----------|
| Access Token | `JWT_SECRET` | 15 minutes | `{ userId, email, role }` |
| Refresh Token | `JWT_REFRESH_SECRET` | 7 days | `{ userId, email, role }` |

### JWT Payload Structure

```json
{
  "userId": 1,
  "email": "admin@iis.hr",
  "role": "full-access",
  "iat": 1709312400,
  "exp": 1709313300
}
```

## Roles

| Role | Permissions |
|------|-------------|
| `full-access` | All operations: read, create, update, delete |
| `read-only` | Read operations only: list categories, get by ID, GraphQL queries |

### Seeded Users

| Email | Password | Role |
|-------|----------|------|
| `admin@iis.hr` | `admin123` | `full-access` |
| `reader@iis.hr` | `reader123` | `read-only` |

These users are created by the seed script at `backend/prisma/seed.ts`.

## Endpoint Protection Matrix

### REST Endpoints

| Endpoint | Method | Auth Required | Role Required |
|----------|--------|--------------|---------------|
| `/auth/login` | POST | No | -- |
| `/auth/refresh` | POST | No | -- |
| `/api/categories` | GET | Yes | Any |
| `/api/categories/:id` | GET | Yes | Any |
| `/api/categories` | POST | Yes | `full-access` |
| `/api/categories/:id` | PUT | Yes | `full-access` |
| `/api/categories/:id` | DELETE | Yes | `full-access` |
| `/api/upload` | POST | No | -- |
| `/api/generate-xml` | GET | No | -- |
| `/api/validate-xml` | GET | No | -- |
| `/api/weather` | GET | No | -- |
| `/api/settings` | GET | No | -- |
| `/api/settings` | PUT | No | -- |

### GraphQL Operations

| Operation | Type | Auth Required | Role Required |
|-----------|------|--------------|---------------|
| `categories` | Query | Yes | Any |
| `category(id)` | Query | Yes | Any |
| `createCategory` | Mutation | Yes | `full-access` |
| `updateCategory` | Mutation | Yes | `full-access` |
| `deleteCategory` | Mutation | Yes | `full-access` |

## Backend Middleware

The authentication middleware is defined in `backend/src/middleware/auth.ts`.

### `authenticate`

Extracts the Bearer token from the `Authorization` header, verifies it with `JWT_SECRET`, and attaches the decoded payload to `req.user`.

```typescript
// Usage in routes:
router.get("/", authenticate, async (req, res) => {
  // req.user is available here
  // { userId, email, role }
});
```

Error responses:
- `401 { error: "No token provided" }` -- missing or malformed Authorization header
- `401 { error: "Invalid or expired token" }` -- JWT verification failed

### `requireWriteAccess`

Checks that the authenticated user has `role === "full-access"`. Must be used after `authenticate`.

```typescript
// Usage in routes:
router.post("/", authenticate, requireWriteAccess, async (req, res) => {
  // Only full-access users reach here
});
```

Error responses:
- `401 { error: "Not authenticated" }` -- no user on request
- `403 { error: "Insufficient permissions" }` -- user role is not `full-access`

### `requireRole(role)`

Generic role check (not currently used in routes, but available). Returns middleware that checks `req.user.role === role`.

### GraphQL Auth

GraphQL resolvers handle auth independently. The token is extracted from the `Authorization` header in the Apollo Server context function (`backend/src/index.ts`, lines 158-162). Each resolver calls `getUser(context)` to verify the token and `requireWrite(user)` for mutations.

```typescript
// In backend/src/graphql/resolvers.ts:
function getUser(context: GqlContext): AuthPayload {
  if (!context.token) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" }
    });
  }
  return jwt.verify(context.token, JWT_SECRET) as AuthPayload;
}
```

## Frontend Token Storage

Defined in `frontend/src/store/authStore.ts`. `frontend/src/context/AuthContext.tsx` remains as a compatibility shim that re-exports `useAuthStore` as `useAuth`.

| Token | Storage | Reason |
|-------|---------|--------|
| Access token | Zustand store (memory) | More secure; lost on page refresh |
| Refresh token | `localStorage` | Persists across page refreshes; used to silently re-authenticate |

### Automatic Token Refresh

`useAuthStore` provides a `getToken()` function that components use to get a valid access token. Before returning the current token, it checks:

1. If the access token exists and expires in more than 60 seconds, return it directly.
2. If the token is about to expire (or missing), attempt a refresh using the stored refresh token.
3. If refresh fails, log the user out.

This logic is in `frontend/src/store/authStore.ts` (lines 60-79).

### On Mount Behavior

When the app loads, `AuthProvider` (in `context/AuthContext.tsx`) calls `refreshApi` using a stored refresh token to silently restore the session. Auth state lives in Zustand, not in React Context.

## Example: Calling a Protected Endpoint

### From curl

```bash
# 1. Login to get tokens
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@iis.hr", "password": "admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# 2. Call a protected endpoint
curl http://localhost:3001/api/categories \
  -H "Authorization: Bearer $TOKEN"

# 3. Create a category (requires full-access)
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Toys", "slug": "toys"}'
```

### From the Frontend

```typescript
// In a React component (preferred):
const { getToken } = useAuthStore();

// Or via the legacy alias (still works):
// const { getToken } = useAuth();

const token = await getToken(); // auto-refreshes if needed
const res = await fetch("/api/categories", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();
```

## Security Notes

- Passwords are stored in **plaintext** in the database. This is a university project; production systems should use bcrypt or argon2.
- JWT secrets have hardcoded defaults. In production, these should be strong random values set via environment variables.
- CORS is configured to allow all origins (`cors()` with no options).
- The SOAP and upload endpoints do not require authentication. This is intentional for the course requirements (Tasks 1-3 focus on data format interoperability, not auth).
