# API Reference

All endpoints are served by the Express backend on port 3001. In development, the Vite dev server proxies requests from port 5173.

---

## REST Endpoints

### Authentication

#### POST /auth/login

Authenticate a user and receive JWT tokens.

| Property | Value |
|----------|-------|
| Auth required | No |
| Request body | `{ email: string, password: string }` |
| Success response | `{ accessToken: string, refreshToken: string, role: string }` |
| Error response | `{ error: string }` |

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@iis.hr", "password": "admin123"}'
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "role": "full-access"
}
```

**Error (401):**
```json
{ "error": "Invalid credentials" }
```

---

#### POST /auth/refresh

Exchange a refresh token for a new access token.

| Property | Value |
|----------|-------|
| Auth required | No |
| Request body | `{ refreshToken: string }` |
| Success response | `{ accessToken: string }` |

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIs..."}'
```

---

### Categories CRUD

All category endpoints require a valid JWT access token in the `Authorization` header.

#### GET /api/categories

List all categories. When `USE_CUSTOM_API=false`, proxies to Strapi.

| Property | Value |
|----------|-------|
| Auth required | Yes (any role) |
| Request body | None |
| Success response | `{ data: Category[] }` |

```bash
curl http://localhost:3001/api/categories \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and gadgets",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### GET /api/categories/:id

Get a single category by ID.

| Property | Value |
|----------|-------|
| Auth required | Yes (any role) |
| URL params | `id` (integer) |
| Success response | `{ data: Category }` |
| Error response | `{ error: "Category not found" }` (404) |

```bash
curl http://localhost:3001/api/categories/1 \
  -H "Authorization: Bearer <accessToken>"
```

---

#### POST /api/categories

Create a new category.

| Property | Value |
|----------|-------|
| Auth required | Yes (`full-access` only) |
| Request body | `{ name: string, slug: string, description?: string }` |
| Success response | `{ data: Category }` (201) |
| Error responses | `{ error: "Name and slug are required" }` (400), `{ error: "Category with this slug already exists" }` (409) |

```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Toys", "slug": "toys", "description": "Children toys"}'
```

---

#### PUT /api/categories/:id

Update an existing category. Only provided fields are updated (partial update).

| Property | Value |
|----------|-------|
| Auth required | Yes (`full-access` only) |
| URL params | `id` (integer) |
| Request body | `{ name?: string, slug?: string, description?: string }` |
| Success response | `{ data: Category }` |
| Error response | `{ error: "Category not found" }` (404) |

```bash
curl -X PUT http://localhost:3001/api/categories/1 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```

---

#### DELETE /api/categories/:id

Delete a category.

| Property | Value |
|----------|-------|
| Auth required | Yes (`full-access` only) |
| URL params | `id` (integer) |
| Success response | `{ data: Category }` (the deleted category) |
| Error response | `{ error: "Category not found" }` (404) |

```bash
curl -X DELETE http://localhost:3001/api/categories/3 \
  -H "Authorization: Bearer <accessToken>"
```

---

### XML Generation and Validation

#### GET /api/generate-xml

Reads all categories from the database and writes `categories.xml` to `backend/generated/`.

| Property | Value |
|----------|-------|
| Auth required | No |
| Success response | `{ message: "XML generated successfully", count: number }` |

```bash
curl http://localhost:3001/api/generate-xml
```

**Response (200):**
```json
{ "message": "XML generated successfully", "count": 8 }
```

The generated XML looks like:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<categories>
  <category>
    <id>1</id>
    <name>Electronics</name>
    <slug>electronics</slug>
    <description>Electronic devices and gadgets</description>
  </category>
  ...
</categories>
```

---

#### GET /api/validate-xml

Validates the generated `categories.xml` against the XSD schema structure.

| Property | Value |
|----------|-------|
| Auth required | No |
| Success response | `{ valid: true, errors: [] }` |
| Failure response | `{ valid: false, errors: ["..."] }` |

```bash
curl http://localhost:3001/api/validate-xml
```

**Response (200, valid):**
```json
{ "valid": true, "errors": [] }
```

**Response (200, invalid):**
```json
{ "valid": false, "errors": ["category[0]: Missing required element 'name'"] }
```

**Response (404, file not found):**
```json
{ "valid": false, "errors": ["categories.xml not found. Generate it first."] }
```

---

### File Upload

#### POST /api/upload

Upload XML and JSON files for validation and category creation. Uses `multipart/form-data`.

| Property | Value |
|----------|-------|
| Auth required | No |
| Content-Type | `multipart/form-data` |
| Form fields | `xmlFile` (file, .xml), `jsonFile` (file, .json) |
| Success response | `{ data: Category }` |
| Error response | `{ errors: string[] }` |

The XML file is validated against `backend/schemas/category.xsd` (structural check: must have `name` and `slug` elements). The JSON file is validated against `backend/schemas/category.schema.json` using Ajv (must have `name` and `slug` strings, `slug` matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`).

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "xmlFile=@category.xml" \
  -F "jsonFile=@category.json"
```

Example `category.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<category>
  <name>Pets</name>
  <slug>pets</slug>
  <description>Pet supplies</description>
</category>
```

Example `category.json`:
```json
{
  "name": "Pets",
  "slug": "pets",
  "description": "Pet supplies"
}
```

**Response (200, success):**
```json
{
  "data": {
    "id": 9,
    "name": "Pets",
    "slug": "pets",
    "description": "Pet supplies",
    "createdAt": "2025-03-01T12:00:00.000Z",
    "updatedAt": "2025-03-01T12:00:00.000Z"
  }
}
```

**Response (400, validation errors):**
```json
{
  "errors": [
    "XML: Missing required element 'name'",
    "JSON: /slug must match pattern \"^[a-z0-9]+(?:-[a-z0-9]+)*$\""
  ]
}
```

---

### Weather Proxy

#### GET /api/weather

Proxies a gRPC call to the weather server. Returns weather data from Croatian stations.

| Property | Value |
|----------|-------|
| Auth required | No |
| Query params | `city` (string, required) |
| Success response | `{ stations: WeatherStation[] }` |

```bash
curl "http://localhost:3001/api/weather?city=Zagreb"
```

**Response (200):**
```json
{
  "stations": [
    {
      "city": "Zagreb-Maksimir",
      "temperature": "18.2",
      "description": "Pretezno oblacno"
    }
  ]
}
```

---

### Settings

#### GET /api/settings

Get the current API source toggle state.

| Property | Value |
|----------|-------|
| Auth required | No |
| Success response | `{ useCustomApi: boolean }` |

```bash
curl http://localhost:3001/api/settings
```

---

#### PUT /api/settings

Toggle the API source at runtime.

| Property | Value |
|----------|-------|
| Auth required | No |
| Request body | `{ useCustomApi: boolean }` |
| Success response | `{ useCustomApi: boolean }` |

```bash
curl -X PUT http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{"useCustomApi": false}'
```

---

## GraphQL API

Endpoint: `POST /graphql`

Authentication: Pass JWT access token in the `Authorization: Bearer <token>` header. All queries and mutations require authentication. Mutations additionally require the `full-access` role.

### Schema

```graphql
type Category {
  id: Int!
  name: String!
  slug: String!
  description: String
  createdAt: String!
  updatedAt: String!
}

input CategoryInput {
  name: String!
  slug: String!
  description: String
}

input CategoryUpdateInput {
  name: String
  slug: String
  description: String
}

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

### Example Queries

**List all categories:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"query": "{ categories { id name slug description } }"}'
```

**Response:**
```json
{
  "data": {
    "categories": [
      { "id": 1, "name": "Electronics", "slug": "electronics", "description": "Electronic devices and gadgets" },
      { "id": 2, "name": "Books", "slug": "books", "description": "Physical and digital books" }
    ]
  }
}
```

**Get a single category:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"query": "{ category(id: 1) { id name slug description createdAt } }"}'
```

### Example Mutations

**Create a category:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"query": "mutation { createCategory(input: { name: \"Toys\", slug: \"toys\", description: \"Children toys\" }) { id name slug } }"}'
```

**Update a category:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"query": "mutation { updateCategory(id: 1, input: { description: \"New description\" }) { id name description } }"}'
```

**Delete a category:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"query": "mutation { deleteCategory(id: 5) { id name } }"}'
```

### GraphQL Error Codes

| Code | Meaning |
|------|---------|
| `UNAUTHENTICATED` | No token provided or token is invalid/expired |
| `FORBIDDEN` | User role lacks write permissions (not `full-access`) |

---

## SOAP Service

Endpoint: `POST /soap`
WSDL: `GET /soap?wsdl`

The SOAP service provides a `SearchCategories` operation that searches the generated `categories.xml` file using XPath.

### WSDL Structure

- **Service:** `CategoriesService`
- **Port:** `CategoriesPort`
- **Binding:** document/literal
- **Target namespace:** `http://iis.hr/categories`
- **Operation:** `SearchCategories`
  - **Input:** `SearchCategoriesRequest` with a `term` (string) element
  - **Output:** `SearchCategoriesResponse` with 0..N `categories` elements, each containing `id` (int), `name` (string), `slug` (string), `description` (string, optional)

### How It Works

1. The client sends a SOAP envelope with a search `term`.
2. The server reads `backend/generated/categories.xml` from disk.
3. It validates the XML structure.
4. It applies an XPath query that performs case-insensitive matching on `name` and `description` fields.
5. Matching categories are returned in the SOAP response.

### XPath Query Used

```xpath
//category[
  contains(
    translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),
    '<term>'
  ) or
  contains(
    translate(description, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),
    '<term>'
  )
]
```

### Example SOAP Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://iis.hr/categories">
  <soap:Body>
    <tns:SearchCategoriesRequest>
      <tns:term>electr</tns:term>
    </tns:SearchCategoriesRequest>
  </soap:Body>
</soap:Envelope>
```

```bash
curl -X POST http://localhost:3001/soap \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: http://iis.hr/categories/SearchCategories" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://iis.hr/categories">
  <soap:Body>
    <tns:SearchCategoriesRequest>
      <tns:term>electr</tns:term>
    </tns:SearchCategoriesRequest>
  </soap:Body>
</soap:Envelope>'
```

### Example SOAP Response

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://iis.hr/categories">
  <soap:Body>
    <tns:SearchCategoriesResponse>
      <categories>
        <id>1</id>
        <name>Electronics</name>
        <slug>electronics</slug>
        <description>Electronic devices and gadgets</description>
      </categories>
    </tns:SearchCategoriesResponse>
  </soap:Body>
</soap:Envelope>
```

**Important:** You must call `GET /api/generate-xml` before using the SOAP service, otherwise the XML file will not exist and the service will return an empty result.

---

## gRPC Service

The gRPC weather service runs as a separate process on port 50051. The Express backend proxies gRPC calls through `GET /api/weather`.

### Proto Definition

File: `grpc-server/proto/weather.proto`

```protobuf
syntax = "proto3";

package weather;

service WeatherService {
  rpc GetTemperature (TemperatureRequest) returns (TemperatureResponse);
}

message TemperatureRequest {
  string city = 1;
}

message TemperatureResponse {
  repeated WeatherStation stations = 1;
}

message WeatherStation {
  string city = 1;
  string temperature = 2;
  string description = 3;
}
```

### How It Works

1. The gRPC server receives a `GetTemperature` call with a city name.
2. It fetches the live weather XML from `https://vrijeme.hr/hrvatska_n.xml` (DHMZ -- Croatian Meteorological Service).
3. The XML is parsed with `fast-xml-parser`, extracting `Hrvatska > Grad[]` elements.
4. Stations are filtered by partial, case-insensitive city name match.
5. Matching stations with city, temperature, and weather description are returned.

### REST Proxy

The browser does not call gRPC directly. Instead, the Express backend at `GET /api/weather?city=<name>` creates a gRPC client, calls `GetTemperature`, and returns the response as JSON. See the Weather Proxy section above.
