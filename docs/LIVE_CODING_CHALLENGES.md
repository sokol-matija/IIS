# IIS Live Coding Exam Challenges

50 live coding challenges based on the IIS project codebase. Each challenge is designed to be completed in under 10 minutes during a live demo.

**Distribution:** 15 Easy / 25 Medium / 10 Hard

---

## JWT & Auth

### Challenge 1 --- Change JWT Access Token Expiry

**File:** `backend/src/routes/auth.ts`
**Estimated time:** 1 min

**Task:**
Change the JWT access token expiry from 15 minutes to 30 minutes.

**Starting point (line 29):**
```ts
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
```

**What the solution looks like:**
```ts
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30m" });
```

**Why this tests understanding:**
Demonstrates knowledge of JWT token lifecycle and the `jsonwebtoken` library's `expiresIn` option.

---

### Challenge 2 --- Change Refresh Token Expiry

**File:** `backend/src/routes/auth.ts`
**Estimated time:** 1 min

**Task:**
Change the refresh token expiry from 7 days to 30 days.

**Starting point (line 30):**
```ts
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
```

**What the solution looks like:**
```ts
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });
```

**Why this tests understanding:**
Tests understanding of refresh token duration and the trade-off between security and user convenience.

---

### Challenge 3 --- Add Username to JWT Payload

**Files:** `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`
**Estimated time:** 5 min

**Task:**
Add the user's `role` is already in the JWT payload. Now also include a `name` field. First add a `name` column to the User model in Prisma, then include it in the JWT payload and the `AuthPayload` interface.

**Starting point (`backend/src/routes/auth.ts`, line 27):**
```ts
const payload = { userId: user.id, email: user.email, role: user.role };
```

**Starting point (`backend/src/middleware/auth.ts`, lines 4-8):**
```ts
export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}
```

**What the solution looks like:**

`backend/src/routes/auth.ts`:
```ts
const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
```

`backend/src/middleware/auth.ts`:
```ts
export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}
```

**Why this tests understanding:**
Tests understanding of how JWT payloads are constructed and how TypeScript interfaces enforce type safety across middleware boundaries.

---

### Challenge 4 --- Change the Token Refresh Threshold in Frontend

**File:** `frontend/src/context/AuthContext.tsx`
**Estimated time:** 2 min

**Task:**
The frontend currently refreshes the token if it expires in less than 1 minute. Change this threshold to 2 minutes.

**Starting point (line 92):**
```ts
if (decoded.exp * 1000 > Date.now() + 60000) {
```

**What the solution looks like:**
```ts
if (decoded.exp * 1000 > Date.now() + 120000) {
```

**Why this tests understanding:**
Demonstrates understanding of JWT expiry checks in the frontend, Unix timestamps in seconds vs milliseconds, and proactive token refresh logic.

---

### Challenge 5 --- Return User Email in Login Response

**File:** `backend/src/routes/auth.ts`
**Estimated time:** 1 min

**Task:**
The login endpoint currently returns `accessToken`, `refreshToken`, and `role`. Also return the user's `email` in the response.

**Starting point (line 32):**
```ts
res.json({ accessToken, refreshToken, role: user.role });
```

**What the solution looks like:**
```ts
res.json({ accessToken, refreshToken, role: user.role, email: user.email });
```

**Why this tests understanding:**
Tests knowledge of Express response construction and understanding what data the client might need.

---

### Challenge 6 --- Add a "read-only" Guard That Blocks DELETE

**File:** `backend/src/middleware/auth.ts`
**Estimated time:** 5 min

**Task:**
Create a new middleware function `requireDeleteAccess` that only allows users with `role === "full-access"` to proceed, and returns a 403 with error message `"Delete permission denied"` otherwise. Apply it to the DELETE route in `backend/src/routes/categories.ts`.

**Starting point (`backend/src/middleware/auth.ts`, lines 51-61):**
```ts
export function requireWriteAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.user.role !== "full-access") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
}
```

**What the solution looks like:**

`backend/src/middleware/auth.ts` (new function):
```ts
export function requireDeleteAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.user.role !== "full-access") {
    res.status(403).json({ error: "Delete permission denied" });
    return;
  }
  next();
}
```

`backend/src/routes/categories.ts` (line 97):
```ts
router.delete("/:id", authenticate, requireDeleteAccess, async (req: Request, res: Response): Promise<void> => {
```

**Why this tests understanding:**
Tests ability to create Express middleware, understand the middleware chain pattern, and apply role-based access control.

---

## REST CRUD

### Challenge 7 --- Add Slug Uniqueness Check Before Create

**File:** `backend/src/routes/categories.ts`
**Estimated time:** 5 min

**Task:**
Before creating a category in the POST endpoint, explicitly check if a category with the same slug already exists and return a 409 error proactively, instead of relying on the Prisma database constraint error.

**Starting point (lines 48-69):**
```ts
router.post("/", authenticate, requireWriteAccess, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required" });
    return;
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug, description: description || null },
    });
    res.status(201).json({ data: category });
  } catch (err: unknown) {
    // ...
  }
});
```

**What the solution looks like:**
```ts
router.post("/", authenticate, requireWriteAccess, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required" });
    return;
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    res.status(409).json({ error: "Category with this slug already exists" });
    return;
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug, description: description || null },
    });
    res.status(201).json({ data: category });
  } catch (err: unknown) {
    // ...
  }
});
```

**Why this tests understanding:**
Tests Prisma query skills and the difference between relying on database constraints vs application-level validation.

---

### Challenge 8 --- Add a Category Count Endpoint

**File:** `backend/src/routes/categories.ts`
**Estimated time:** 4 min

**Task:**
Add a `GET /api/categories/count` endpoint that returns `{ count: N }` where N is the total number of categories in the database. It must be placed before the `/:id` route to avoid route conflicts.

**Starting point (line 30):**
```ts
// GET /api/categories/:id
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
```

**What the solution looks like (insert before line 30):**
```ts
// GET /api/categories/count
router.get("/count", authenticate, async (_req: Request, res: Response): Promise<void> => {
  const count = await prisma.category.count();
  res.json({ count });
});
```

**Why this tests understanding:**
Tests Express route ordering (specific routes before parameterized routes) and Prisma's `count()` method.

---

### Challenge 9 --- Add Pagination to GET /api/categories

**File:** `backend/src/routes/categories.ts`
**Estimated time:** 6 min

**Task:**
Add `page` and `limit` query parameters to the GET /api/categories endpoint. Default to `page=1` and `limit=10`. Return the data along with a `total` count.

**Starting point (lines 12-28):**
```ts
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const useCustomApi = process.env.USE_CUSTOM_API !== "false";

  if (!useCustomApi) {
    // ... Strapi proxy
  }

  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  res.json({ data: categories });
});
```

**What the solution looks like:**
```ts
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const useCustomApi = process.env.USE_CUSTOM_API !== "false";

  if (!useCustomApi) {
    // ... Strapi proxy
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" }, skip, take: limit }),
    prisma.category.count(),
  ]);

  res.json({ data: categories, total, page, limit });
});
```

**Why this tests understanding:**
Tests Prisma pagination with `skip`/`take`, query parameter parsing, and API response design.

---

### Challenge 10 --- Add Name Length Validation to POST

**File:** `backend/src/routes/categories.ts`
**Estimated time:** 3 min

**Task:**
In the POST /api/categories endpoint, add validation that the `name` must be between 2 and 100 characters long. Return a 400 error with an appropriate message if validation fails.

**Starting point (lines 49-54):**
```ts
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required" });
    return;
  }
```

**What the solution looks like:**
```ts
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required" });
    return;
  }

  if (name.length < 2 || name.length > 100) {
    res.status(400).json({ error: "Name must be between 2 and 100 characters" });
    return;
  }
```

**Why this tests understanding:**
Tests input validation best practices in REST APIs and Express request body handling.

---

### Challenge 11 --- Make Description Required in POST

**Files:** `backend/src/routes/categories.ts`, `backend/schemas/category.schema.json`
**Estimated time:** 4 min

**Task:**
Make the `description` field required when creating a category. Update both the REST route validation and the JSON Schema.

**Starting point (`backend/src/routes/categories.ts`, lines 49-54):**
```ts
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required" });
    return;
  }
```

**Starting point (`backend/schemas/category.schema.json`, lines 4):**
```json
  "required": ["name", "slug"],
```

**What the solution looks like:**

`backend/src/routes/categories.ts`:
```ts
  const { name, slug, description } = req.body;

  if (!name || !slug || !description) {
    res.status(400).json({ error: "Name, slug, and description are required" });
    return;
  }
```

`backend/schemas/category.schema.json`:
```json
  "required": ["name", "slug", "description"],
```

**Why this tests understanding:**
Tests coordination between API route validation and JSON Schema validation, showing how both layers need to agree.

---

## XML/XSD Validation

### Challenge 12 --- Add an ID Element to the XSD Schema

**File:** `backend/schemas/category.xsd`
**Estimated time:** 2 min

**Task:**
The generated XML includes an `<id>` element, but the XSD schema does not define it. Add an optional `<id>` element of type `xs:integer` to the category complex type, before the `<name>` element.

**Starting point (lines 3-11):**
```xml
  <xs:element name="category">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string" minOccurs="1" maxOccurs="1"/>
        <xs:element name="slug" type="xs:string" minOccurs="1" maxOccurs="1"/>
        <xs:element name="description" type="xs:string" minOccurs="0" maxOccurs="1"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
```

**What the solution looks like:**
```xml
  <xs:element name="category">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="id" type="xs:integer" minOccurs="0" maxOccurs="1"/>
        <xs:element name="name" type="xs:string" minOccurs="1" maxOccurs="1"/>
        <xs:element name="slug" type="xs:string" minOccurs="1" maxOccurs="1"/>
        <xs:element name="description" type="xs:string" minOccurs="0" maxOccurs="1"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
```

**Why this tests understanding:**
Tests XSD schema definition skills including element types, cardinality, and sequence ordering.

---

### Challenge 13 --- Add Slug Pattern Restriction in XSD

**File:** `backend/schemas/category.xsd`
**Estimated time:** 4 min

**Task:**
Add a restriction to the `slug` element in the XSD so it only allows lowercase letters, numbers, and hyphens (matching the JSON Schema pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`).

**Starting point (line 7):**
```xml
<xs:element name="slug" type="xs:string" minOccurs="1" maxOccurs="1"/>
```

**What the solution looks like:**
```xml
<xs:element name="slug" minOccurs="1" maxOccurs="1">
  <xs:simpleType>
    <xs:restriction base="xs:string">
      <xs:pattern value="[a-z0-9]+(-[a-z0-9]+)*"/>
    </xs:restriction>
  </xs:simpleType>
</xs:element>
```

**Why this tests understanding:**
Tests XSD restriction patterns and how to enforce format constraints at the schema level.

---

### Challenge 14 --- Add Description Validation to validateXml.ts

**File:** `backend/src/utils/validateXml.ts`
**Estimated time:** 4 min

**Task:**
Currently `validateCategoryNode` only checks for `name` and `slug`. Add validation for the `description` element: if it is present, ensure its text content is not longer than 500 characters.

**Starting point (lines 51-69):**
```ts
function validateCategoryNode(el: unknown, errors: string[], index?: number): void {
  const prefix = index !== undefined ? `category[${index}]: ` : "";
  const element = el as any;

  const nameEls = element.getElementsByTagName("name");
  if (nameEls.length === 0) {
    errors.push(`${prefix}Missing required element 'name'`);
  } else if (!nameEls[0]?.textContent?.trim()) {
    errors.push(`${prefix}Element 'name' must not be empty`);
  }

  const slugEls = element.getElementsByTagName("slug");
  if (slugEls.length === 0) {
    errors.push(`${prefix}Missing required element 'slug'`);
  } else if (!slugEls[0]?.textContent?.trim()) {
    errors.push(`${prefix}Element 'slug' must not be empty`);
  }
}
```

**What the solution looks like:**
```ts
function validateCategoryNode(el: unknown, errors: string[], index?: number): void {
  const prefix = index !== undefined ? `category[${index}]: ` : "";
  const element = el as any;

  // ... existing name/slug validation ...

  const descEls = element.getElementsByTagName("description");
  if (descEls.length > 0) {
    const descText = descEls[0]?.textContent || "";
    if (descText.length > 500) {
      errors.push(`${prefix}Element 'description' must not exceed 500 characters`);
    }
  }
}
```

**Why this tests understanding:**
Tests extending an XML validation function with new business rules while preserving existing validation logic.

---

### Challenge 15 --- Add a createdAt Field to Generated XML

**File:** `backend/src/index.ts`
**Estimated time:** 3 min

**Task:**
The XML generation endpoint at `/api/generate-xml` currently outputs `id`, `name`, `slug`, and `description` for each category. Add the `createdAt` field as well.

**Starting point (lines 46-53):**
```ts
    const xmlItems = categories
      .map(
        (c) => `  <category>
    <id>${c.id}</id>
    <name>${escapeXml(c.name)}</name>
    <slug>${escapeXml(c.slug)}</slug>
    <description>${escapeXml(c.description || "")}</description>
  </category>`
      )
      .join("\n");
```

**What the solution looks like:**
```ts
    const xmlItems = categories
      .map(
        (c) => `  <category>
    <id>${c.id}</id>
    <name>${escapeXml(c.name)}</name>
    <slug>${escapeXml(c.slug)}</slug>
    <description>${escapeXml(c.description || "")}</description>
    <createdAt>${c.createdAt.toISOString()}</createdAt>
  </category>`
      )
      .join("\n");
```

**Why this tests understanding:**
Tests understanding of the XML generation pipeline, JavaScript Date-to-string conversion, and the data flow from Prisma to XML.

---

## JSON Schema

### Challenge 16 --- Add maxLength to Name in JSON Schema

**File:** `backend/schemas/category.schema.json`
**Estimated time:** 1 min

**Task:**
Add a `maxLength` of 100 to the `name` property in the JSON Schema.

**Starting point (lines 6-9):**
```json
    "name": {
      "type": "string",
      "minLength": 1
    },
```

**What the solution looks like:**
```json
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
```

**Why this tests understanding:**
Tests knowledge of JSON Schema string constraints and how AJV validates them.

---

### Challenge 17 --- Add a "priority" Field to JSON Schema

**File:** `backend/schemas/category.schema.json`
**Estimated time:** 3 min

**Task:**
Add a new optional field `priority` of type `integer` with `minimum: 1` and `maximum: 10`.

**Starting point (lines 5-18):**
```json
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "slug": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "description": {
      "type": "string"
    }
  },
```

**What the solution looks like:**
```json
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "slug": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "description": {
      "type": "string"
    },
    "priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10
    }
  },
```

**Why this tests understanding:**
Tests ability to extend a JSON Schema with new typed properties and numeric constraints.

---

### Challenge 18 --- Add Description minLength in JSON Schema

**File:** `backend/schemas/category.schema.json`
**Estimated time:** 1 min

**Task:**
Add a `minLength` of 10 to the `description` property in the JSON Schema so that if a description is provided, it must be at least 10 characters.

**Starting point (lines 15-17):**
```json
    "description": {
      "type": "string"
    }
```

**What the solution looks like:**
```json
    "description": {
      "type": "string",
      "minLength": 10
    }
```

**Why this tests understanding:**
Tests JSON Schema validation rules and how optional-but-constrained fields work.

---

## SOAP & XPath

### Challenge 19 --- Extend SOAP XPath to Search by Slug

**File:** `backend/src/soap/categoriesService.ts`
**Estimated time:** 4 min

**Task:**
Currently the SOAP `SearchCategories` XPath query searches only `name` and `description`. Extend it to also search the `slug` field.

**Starting point (lines 42-45):**
```ts
        const xpathQuery = `//category[
          contains(translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}') or
          contains(translate(description, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}')
        ]`;
```

**What the solution looks like:**
```ts
        const xpathQuery = `//category[
          contains(translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}') or
          contains(translate(description, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}') or
          contains(translate(slug, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}')
        ]`;
```

**Why this tests understanding:**
Tests XPath query construction, specifically the `contains()` and `translate()` functions for case-insensitive filtering.

---

### Challenge 20 --- Add a SOAP GetAllCategories Method

**File:** `backend/src/soap/categoriesService.ts`
**Estimated time:** 6 min

**Task:**
Add a new SOAP operation `GetAllCategories` that returns all categories from the generated XML without any filtering. It should sit alongside `SearchCategories` inside `CategoriesPort`.

**Starting point (lines 21-80):**
```ts
export const categoriesService = {
  CategoriesService: {
    CategoriesPort: {
      SearchCategories: (args: SearchArgs) => {
        // ... existing search logic
      },
    },
  },
};
```

**What the solution looks like:**
```ts
export const categoriesService = {
  CategoriesService: {
    CategoriesPort: {
      SearchCategories: (args: SearchArgs) => {
        // ... existing search logic
      },
      GetAllCategories: () => {
        if (!fs.existsSync(XML_PATH)) {
          return { categories: [] };
        }

        const xmlContent = fs.readFileSync(XML_PATH, "utf-8");
        const doc = new DOMParser().parseFromString(xmlContent, "text/xml");
        const nodes = xpath.select("//category", doc as unknown as Node);

        const categories: CategoryResult[] = [];
        if (Array.isArray(nodes)) {
          for (const node of nodes) {
            const el = node as unknown as any;
            const getTextContent = (tagName: string): string => {
              const elements = el.getElementsByTagName(tagName);
              if (elements.length > 0 && elements[0]?.firstChild) {
                return elements[0].firstChild.nodeValue || "";
              }
              return "";
            };
            categories.push({
              id: parseInt(getTextContent("id")) || 0,
              name: getTextContent("name"),
              slug: getTextContent("slug"),
              description: getTextContent("description"),
            });
          }
        }
        return { categories };
      },
    },
  },
};
```

**Why this tests understanding:**
Tests ability to extend a SOAP service with new operations and reuse existing XML/XPath parsing patterns.

---

### Challenge 21 --- Change SOAP SOAPAction Header on Frontend

**File:** `frontend/src/api/soap.ts`
**Estimated time:** 2 min

**Task:**
Change the SOAPAction header namespace from `http://iis.hr/categories` to `http://iis.hr/services/categories`.

**Starting point (lines 21-28):**
```ts
  const res = await fetch(`${API_URL}/soap`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://iis.hr/categories/SearchCategories",
    },
    body: soapEnvelope,
  });
```

**What the solution looks like:**
```ts
  const res = await fetch(`${API_URL}/soap`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://iis.hr/services/categories/SearchCategories",
    },
    body: soapEnvelope,
  });
```

**Why this tests understanding:**
Tests understanding of SOAP protocol headers and how the frontend constructs SOAP requests.

---

### Challenge 22 --- Add escapeXml for Ampersand in Frontend SOAP Client

**File:** `frontend/src/api/soap.ts`
**Estimated time:** 2 min

**Task:**
The `escapeXml` function on the frontend currently escapes `&`, `<`, and `>`. Add escaping for double quotes (`"`) and single quotes (`'`) to match the backend's escapeXml function.

**Starting point (lines 61-66):**
```ts
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

**What the solution looks like:**
```ts
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

**Why this tests understanding:**
Tests understanding of XML escaping requirements and XSS/injection prevention in SOAP message construction.

---

## gRPC & Weather

### Challenge 23 --- Add a humidity Field to the Proto

**File:** `grpc-server/proto/weather.proto`
**Estimated time:** 2 min

**Task:**
Add a `humidity` field (type `string`, field number 4) to the `WeatherStation` message.

**Starting point (lines 17-21):**
```proto
message WeatherStation {
  string city = 1;
  string temperature = 2;
  string description = 3;
}
```

**What the solution looks like:**
```proto
message WeatherStation {
  string city = 1;
  string temperature = 2;
  string description = 3;
  string humidity = 4;
}
```

**Why this tests understanding:**
Tests Protocol Buffers message definition and field numbering conventions.

---

### Challenge 24 --- Map Humidity from XML Source in gRPC Server

**Files:** `grpc-server/proto/weather.proto`, `grpc-server/src/server.ts`
**Estimated time:** 5 min

**Task:**
After adding `humidity` to the proto (Challenge 23), update the `parseWeatherData` function to also extract the `Vlpiped` (humidity) field from the Croatian weather XML and map it to the `humidity` field.

**Starting point (`grpc-server/src/server.ts`, lines 10-14):**
```ts
interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}
```

**Starting point (lines 45-54):**
```ts
    .map((s) => ({
      city: String(s.GradIme || ""),
      temperature: String(s.Temp ?? "N/A"),
      description: String(s.Vrijeme || "N/A"),
    }));
```

**What the solution looks like:**

Interface:
```ts
interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
  humidity: string;
}
```

Map:
```ts
    .map((s) => ({
      city: String(s.GradIme || ""),
      temperature: String(s.Temp ?? "N/A"),
      description: String(s.Vrijeme || "N/A"),
      humidity: String(s.Vlaga ?? "N/A"),
    }));
```

**Why this tests understanding:**
Tests end-to-end gRPC field addition: proto definition, TypeScript interface, and data mapping from an external XML source.

---

### Challenge 25 --- Display Humidity in Frontend Weather Table

**File:** `frontend/src/pages/Task4Page.tsx`
**Estimated time:** 3 min

**Task:**
After adding `humidity` to the gRPC response, update the Task4Page weather table to display a "Humidity" column.

**Starting point (lines 5-9):**
```ts
interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}
```

**Starting point (table header, lines 65-69):**
```tsx
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Temperature</th>
                <th style={thStyle}>Description</th>
              </tr>
```

**What the solution looks like:**

Interface:
```ts
interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
  humidity: string;
}
```

Table header:
```tsx
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Temperature</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Humidity</th>
              </tr>
```

Table body (add after line 76):
```tsx
                  <td style={tdStyle}>{s.humidity}</td>
```

**Why this tests understanding:**
Tests how a new field flows from gRPC proto -> server -> backend proxy -> frontend display.

---

### Challenge 26 --- Change gRPC Server Port

**File:** `grpc-server/src/server.ts`
**Estimated time:** 2 min

**Task:**
Change the gRPC server port from `50051` to `50052`, and also update the backend's `GRPC_HOST` default to match.

**Starting point (`grpc-server/src/server.ts`, line 92):**
```ts
  const PORT = "0.0.0.0:50051";
```

**Starting point (`backend/src/index.ts`, line 28):**
```ts
const GRPC_HOST = process.env.GRPC_SERVER_HOST || "localhost:50051";
```

**What the solution looks like:**

`grpc-server/src/server.ts`:
```ts
  const PORT = "0.0.0.0:50052";
```

`backend/src/index.ts`:
```ts
const GRPC_HOST = process.env.GRPC_SERVER_HOST || "localhost:50052";
```

**Why this tests understanding:**
Tests understanding of how the backend acts as a proxy to the gRPC server and how connection strings must match between services.

---

### Challenge 27 --- Add a "No Results" Message for Weather Search

**File:** `frontend/src/pages/Task4Page.tsx`
**Estimated time:** 3 min

**Task:**
When the weather search completes but returns zero stations, show a message "No weather stations found for this city" instead of leaving the area blank. Currently the empty-state only shows when no search has been performed yet.

**Starting point (lines 83-85):**
```tsx
        {stations.length === 0 && !loading && !error && (
          <p style={{ color: "#999", fontSize: 14 }}>Enter a city name to search.</p>
        )}
```

**What the solution looks like:**
Add a `searched` state variable, set it to `true` after a search completes, then:
```tsx
        {stations.length === 0 && !loading && !error && !searched && (
          <p style={{ color: "#999", fontSize: 14 }}>Enter a city name to search.</p>
        )}
        {stations.length === 0 && !loading && !error && searched && (
          <p style={{ color: "#ff9800", fontSize: 14 }}>No weather stations found for this city.</p>
        )}
```

**Why this tests understanding:**
Tests React state management and UI feedback for different application states (initial vs no-results).

---

## GraphQL

### Challenge 28 --- Add a categoriesCount Query to GraphQL

**Files:** `backend/src/graphql/schema.ts`, `backend/src/graphql/resolvers.ts`
**Estimated time:** 5 min

**Task:**
Add a new `categoriesCount` query to the GraphQL schema that returns the total number of categories as an `Int!`.

**Starting point (`backend/src/graphql/schema.ts`, lines 23-26):**
```graphql
  type Query {
    categories: [Category!]!
    category(id: Int!): Category
  }
```

**Starting point (`backend/src/graphql/resolvers.ts`, lines 31-39):**
```ts
  Query: {
    categories: async (_: unknown, __: unknown, context: GqlContext) => {
      getUser(context);
      return prisma.category.findMany({ orderBy: { id: "asc" } });
    },
    category: async (_: unknown, args: { id: number }, context: GqlContext) => {
      getUser(context);
      return prisma.category.findUnique({ where: { id: args.id } });
    },
  },
```

**What the solution looks like:**

Schema:
```graphql
  type Query {
    categories: [Category!]!
    category(id: Int!): Category
    categoriesCount: Int!
  }
```

Resolver:
```ts
    categoriesCount: async (_: unknown, __: unknown, context: GqlContext) => {
      getUser(context);
      return prisma.category.count();
    },
```

**Why this tests understanding:**
Tests extending a GraphQL schema with a new query type and implementing its resolver with Prisma.

---

### Challenge 29 --- Add a searchCategories GraphQL Query

**Files:** `backend/src/graphql/schema.ts`, `backend/src/graphql/resolvers.ts`
**Estimated time:** 7 min

**Task:**
Add a `searchCategories(term: String!)` query that filters categories by name (case-insensitive `contains`).

**Starting point (`backend/src/graphql/schema.ts`, lines 23-26):**
```graphql
  type Query {
    categories: [Category!]!
    category(id: Int!): Category
  }
```

**What the solution looks like:**

Schema:
```graphql
  type Query {
    categories: [Category!]!
    category(id: Int!): Category
    searchCategories(term: String!): [Category!]!
  }
```

Resolver:
```ts
    searchCategories: async (_: unknown, args: { term: string }, context: GqlContext) => {
      getUser(context);
      return prisma.category.findMany({
        where: {
          name: { contains: args.term },
        },
        orderBy: { id: "asc" },
      });
    },
```

**Why this tests understanding:**
Tests GraphQL query arguments, Prisma filtering with `contains`, and extending the resolver map.

---

### Challenge 30 --- Remove Authentication from GraphQL Categories Query

**File:** `backend/src/graphql/resolvers.ts`
**Estimated time:** 2 min

**Task:**
Make the `categories` query public (no authentication required) while keeping the `category` query protected.

**Starting point (lines 32-35):**
```ts
    categories: async (_: unknown, __: unknown, context: GqlContext) => {
      getUser(context);
      return prisma.category.findMany({ orderBy: { id: "asc" } });
    },
```

**What the solution looks like:**
```ts
    categories: async () => {
      return prisma.category.findMany({ orderBy: { id: "asc" } });
    },
```

**Why this tests understanding:**
Tests understanding of per-resolver authentication in GraphQL and the difference between public and protected queries.

---

### Challenge 31 --- Add createdAt and updatedAt to GraphQL CategoryInput

**File:** `backend/src/graphql/schema.ts`
**Estimated time:** 2 min

**Task:**
The `Category` type already has `createdAt` and `updatedAt` fields but the mutation response does not explicitly resolve them. Verify the fields exist in the type definition and add a `createdAfter` argument to the `categories` query to filter categories created after a given date.

**Starting point (lines 23-26):**
```graphql
  type Query {
    categories: [Category!]!
    category(id: Int!): Category
  }
```

**What the solution looks like:**
```graphql
  type Query {
    categories(createdAfter: String): [Category!]!
    category(id: Int!): Category
  }
```

Resolver update:
```ts
    categories: async (_: unknown, args: { createdAfter?: string }, context: GqlContext) => {
      getUser(context);
      const where = args.createdAfter
        ? { createdAt: { gte: new Date(args.createdAfter) } }
        : {};
      return prisma.category.findMany({ where, orderBy: { id: "asc" } });
    },
```

**Why this tests understanding:**
Tests optional GraphQL arguments, Prisma date filtering with `gte`, and how schema and resolvers must align.

---

## Prisma/Database

### Challenge 32 --- Add an isActive Field to the Category Model

**File:** `backend/prisma/schema.prisma`
**Estimated time:** 2 min

**Task:**
Add an `isActive` boolean field with a default value of `true` to the Category model.

**Starting point (lines 10-17):**
```prisma
model Category {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**What the solution looks like:**
```prisma
model Category {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Why this tests understanding:**
Tests Prisma schema definition, field types, and default values.

---

### Challenge 33 --- Add a Unique Constraint on Category Name

**File:** `backend/prisma/schema.prisma`
**Estimated time:** 1 min

**Task:**
Currently only `slug` has a `@unique` constraint. Add a `@unique` constraint to `name` as well.

**Starting point (lines 12-13):**
```prisma
  name        String
  slug        String   @unique
```

**What the solution looks like:**
```prisma
  name        String   @unique
  slug        String   @unique
```

**Why this tests understanding:**
Tests understanding of Prisma unique constraints and their effect on database-level validation.

---

### Challenge 34 --- Add a Role Enum to the Prisma Schema

**File:** `backend/prisma/schema.prisma`
**Estimated time:** 3 min

**Task:**
Currently the `role` field in the User model is a plain `String`. Add a comment documenting the expected values: `"full-access"` and `"read-only"`. (Note: SQLite does not support native enums, so a comment is the best approach.)

**Starting point (lines 19-24):**
```prisma
model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  role     String
}
```

**What the solution looks like:**
```prisma
model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  role     String // "full-access" | "read-only"
}
```

**Why this tests understanding:**
Tests understanding of Prisma limitations with SQLite and the importance of documenting conventions when enums are not available.

---

### Challenge 35 --- Change Database Provider from SQLite to PostgreSQL

**File:** `backend/prisma/schema.prisma`
**Estimated time:** 2 min

**Task:**
Change the datasource provider from `sqlite` to `postgresql` and update the URL environment variable reference.

**Starting point (lines 5-8):**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**What the solution looks like:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Why this tests understanding:**
Tests knowledge of Prisma datasource configuration and the portability of Prisma schemas across database providers.

---

## React Frontend

### Challenge 36 --- Change the Sidebar Title

**File:** `frontend/src/components/Layout.tsx`
**Estimated time:** 1 min

**Task:**
Change the sidebar header title from "IIS Project" to "IIS Demo App".

**Starting point (line 29):**
```tsx
          <h2 style={{ margin: 0, fontSize: 18 }}>IIS Project</h2>
```

**What the solution looks like:**
```tsx
          <h2 style={{ margin: 0, fontSize: 18 }}>IIS Demo App</h2>
```

**Why this tests understanding:**
Tests basic React JSX modification and navigation through component files.

---

### Challenge 37 --- Add a "Task 6" Navigation Item

**File:** `frontend/src/components/Layout.tsx`
**Estimated time:** 2 min

**Task:**
Add a new navigation item "Task 6 - Reports" that links to `/task6`.

**Starting point (lines 4-11):**
```ts
const navItems = [
  { to: "/task1", label: "Task 1 - Upload" },
  { to: "/task2", label: "Task 2 - SOAP" },
  { to: "/task3", label: "Task 3 - XML Validate" },
  { to: "/task4", label: "Task 4 - Weather" },
  { to: "/task5", label: "Task 5 - CRUD" },
  { to: "/settings", label: "Settings" },
];
```

**What the solution looks like:**
```ts
const navItems = [
  { to: "/task1", label: "Task 1 - Upload" },
  { to: "/task2", label: "Task 2 - SOAP" },
  { to: "/task3", label: "Task 3 - XML Validate" },
  { to: "/task4", label: "Task 4 - Weather" },
  { to: "/task5", label: "Task 5 - CRUD" },
  { to: "/task6", label: "Task 6 - Reports" },
  { to: "/settings", label: "Settings" },
];
```

**Why this tests understanding:**
Tests understanding of React Router navigation configuration via data-driven nav arrays.

---

### Challenge 38 --- Show CreatedAt in CategoryTable

**File:** `frontend/src/components/CategoryTable.tsx`
**Estimated time:** 4 min

**Task:**
Add a "Created At" column to the CategoryTable that displays the `createdAt` field formatted as a locale date string.

**Starting point (table header, lines 22-27):**
```tsx
        <tr style={{ background: "#1a1a2e", color: "#fff" }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Slug</th>
          <th style={thStyle}>Description</th>
          {(onEdit || onDelete) && <th style={thStyle}>Actions</th>}
        </tr>
```

**Starting point (table body, lines 39-43):**
```tsx
              <td style={tdStyle}>{cat.id}</td>
              <td style={tdStyle}>{cat.name}</td>
              <td style={tdStyle}>{cat.slug}</td>
              <td style={tdStyle}>{cat.description || "-"}</td>
```

**What the solution looks like:**

Header:
```tsx
        <tr style={{ background: "#1a1a2e", color: "#fff" }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Slug</th>
          <th style={thStyle}>Description</th>
          <th style={thStyle}>Created At</th>
          {(onEdit || onDelete) && <th style={thStyle}>Actions</th>}
        </tr>
```

Body:
```tsx
              <td style={tdStyle}>{cat.id}</td>
              <td style={tdStyle}>{cat.name}</td>
              <td style={tdStyle}>{cat.slug}</td>
              <td style={tdStyle}>{cat.description || "-"}</td>
              <td style={tdStyle}>{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "-"}</td>
```

Also update colSpan from 5 to 6 on line 33.

**Why this tests understanding:**
Tests React table rendering, JavaScript date formatting, and handling optional fields.

---

### Challenge 39 --- Add a Confirmation Before Logout

**File:** `frontend/src/components/Layout.tsx`
**Estimated time:** 3 min

**Task:**
Add a `window.confirm()` dialog before calling `logout()` when the user clicks the Logout button.

**Starting point (lines 62-76):**
```tsx
            <button
              onClick={logout}
              style={{
                width: "100%",
                padding: "8px",
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
```

**What the solution looks like:**
```tsx
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to logout?")) {
                  logout();
                }
              }}
              style={{
                width: "100%",
                padding: "8px",
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
```

**Why this tests understanding:**
Tests wrapping event handlers in React and using browser confirm dialogs for destructive actions.

---

### Challenge 40 --- Disable Create Button While Form is Submitting

**File:** `frontend/src/pages/Task5Page.tsx`
**Estimated time:** 3 min

**Task:**
Add a `submitting` state to the Task5Page so the "Create Category" / "Update Category" button is disabled while the form is being submitted, preventing double submissions.

**Starting point (lines 54-75):**
```ts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = await getToken();
    if (!token) return;

    try {
      if (formMode === "create") {
        await createCategory(token, { name, slug, description });
      } else if (editId !== null) {
        await updateCategory(token, editId, { name, slug, description });
      }
      // ... reset form
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  };
```

**What the solution looks like:**
Add `const [submitting, setSubmitting] = useState(false);` and wrap handleSubmit:
```ts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const token = await getToken();
    if (!token) { setSubmitting(false); return; }

    try {
      // ... existing logic
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };
```
Then add `disabled={!canWrite || submitting}` to the submit button.

**Why this tests understanding:**
Tests React form state management and preventing double-submit patterns.

---

### Challenge 41 --- Change the Default GraphQL Query in Task5

**File:** `frontend/src/pages/Task5Page.tsx`
**Estimated time:** 1 min

**Task:**
Change the default GraphQL query in the query panel to also include `createdAt` and `updatedAt` fields.

**Starting point (lines 29-31):**
```ts
  const [gqlQuery, setGqlQuery] = useState(
    `{\n  categories {\n    id\n    name\n    slug\n    description\n  }\n}`
  );
```

**What the solution looks like:**
```ts
  const [gqlQuery, setGqlQuery] = useState(
    `{\n  categories {\n    id\n    name\n    slug\n    description\n    createdAt\n    updatedAt\n  }\n}`
  );
```

**Why this tests understanding:**
Tests understanding of GraphQL query syntax and which fields are available in the schema.

---

### Challenge 42 --- Add Error Styling to Login Form

**File:** `frontend/src/context/AuthContext.tsx`
**Estimated time:** 3 min

**Task:**
In the `login` function, when a 401 response is received, throw an error with the message "Invalid email or password" instead of using the generic error from the server.

**Starting point (lines 60-79):**
```ts
  const login = useCallback(async (emailInput: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    // ...
  }, []);
```

**What the solution looks like:**
```ts
  const login = useCallback(async (emailInput: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput, password }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Invalid email or password");
      }
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    // ...
  }, []);
```

**Why this tests understanding:**
Tests HTTP status code handling and user-friendly error messaging in React auth flows.

---

## Role-based Access

### Challenge 43 --- Add a New "admin" Role Check

**File:** `backend/src/middleware/auth.ts`
**Estimated time:** 5 min

**Task:**
Modify `requireWriteAccess` to allow both `"full-access"` and a new `"admin"` role to have write access.

**Starting point (lines 51-61):**
```ts
export function requireWriteAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.user.role !== "full-access") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
}
```

**What the solution looks like:**
```ts
export function requireWriteAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const allowedRoles = ["full-access", "admin"];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
}
```

**Why this tests understanding:**
Tests extending role-based access control with multiple allowed roles using an array-based approach.

---

### Challenge 44 --- Also Update GraphQL requireWrite for Admin Role

**File:** `backend/src/graphql/resolvers.ts`
**Estimated time:** 3 min

**Task:**
The GraphQL `requireWrite` function only checks for `"full-access"`. Update it to also allow `"admin"` role, consistent with Challenge 43.

**Starting point (lines 24-28):**
```ts
function requireWrite(user: AuthPayload): void {
  if (user.role !== "full-access") {
    throw new GraphQLError("Insufficient permissions", { extensions: { code: "FORBIDDEN" } });
  }
}
```

**What the solution looks like:**
```ts
function requireWrite(user: AuthPayload): void {
  const allowedRoles = ["full-access", "admin"];
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError("Insufficient permissions", { extensions: { code: "FORBIDDEN" } });
  }
}
```

**Why this tests understanding:**
Tests that role checks must be updated consistently across REST middleware and GraphQL resolvers.

---

### Challenge 45 --- Show Role Badge Color for Admin in Frontend

**File:** `frontend/src/components/Layout.tsx`
**Estimated time:** 3 min

**Task:**
Currently the role is shown in green for `"full-access"` and orange for everything else. Add a blue color for the `"admin"` role.

**Starting point (lines 33-35):**
```tsx
              <div style={{ color: role === "full-access" ? "#4caf50" : "#ff9800" }}>
                {role}
              </div>
```

**What the solution looks like:**
```tsx
              <div style={{
                color: role === "full-access" ? "#4caf50" : role === "admin" ? "#2196f3" : "#ff9800"
              }}>
                {role}
              </div>
```

**Why this tests understanding:**
Tests conditional styling in React with multiple role variants using ternary chains.

---

### Challenge 46 --- Allow Admin to Write in Task5 Frontend

**File:** `frontend/src/pages/Task5Page.tsx`
**Estimated time:** 2 min

**Task:**
Currently `canWrite` is only true for `"full-access"` role. Also allow `"admin"` to have write access.

**Starting point (line 16):**
```ts
  const canWrite = role === "full-access";
```

**What the solution looks like:**
```ts
  const canWrite = role === "full-access" || role === "admin";
```

**Why this tests understanding:**
Tests understanding of how frontend role checks gate UI actions and how they must match backend permissions.

---

## API Toggle

### Challenge 47 --- Make PUT Also Proxy to Strapi When Toggle is Off

**File:** `backend/src/routes/categories.ts`
**Estimated time:** 7 min

**Task:**
Currently only the GET /api/categories endpoint checks the `USE_CUSTOM_API` toggle and proxies to Strapi. Add the same toggle check to the PUT endpoint so that when the toggle is off, the update is proxied to Strapi via `PUT ${STRAPI_URL}/api/categories/${id}`.

**Starting point (lines 72-94):**
```ts
router.put("/:id", authenticate, requireWriteAccess, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { name, slug, description } = req.body;

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
      },
    });
    res.json({ data: category });
  } catch {
    res.status(404).json({ error: "Category not found" });
  }
});
```

**What the solution looks like:**
```ts
router.put("/:id", authenticate, requireWriteAccess, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const useCustomApi = process.env.USE_CUSTOM_API !== "false";

  if (!useCustomApi) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: req.body }),
      });
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(502).json({ error: "Failed to proxy to Strapi" });
    }
    return;
  }

  const { name, slug, description } = req.body;
  // ... existing Prisma update logic
});
```

**Why this tests understanding:**
Tests the API toggle pattern, how the proxy pattern works, and how to forward requests to an external API.

---

### Challenge 48 --- Add Current API Mode to Settings Response

**File:** `backend/src/index.ts`
**Estimated time:** 3 min

**Task:**
Extend the `GET /api/settings` response to also include the `STRAPI_URL` that is configured, so the frontend can display which Strapi instance it would proxy to.

**Starting point (lines 127-129):**
```ts
app.get("/api/settings", (_req, res) => {
  res.json({ useCustomApi: process.env.USE_CUSTOM_API !== "false" });
});
```

**What the solution looks like:**
```ts
app.get("/api/settings", (_req, res) => {
  res.json({
    useCustomApi: process.env.USE_CUSTOM_API !== "false",
    strapiUrl: process.env.STRAPI_URL || "http://localhost:1337",
  });
});
```

**Why this tests understanding:**
Tests understanding of environment variables, API response design, and the settings pattern used in this project.

---

## Environment Config

### Challenge 49 --- Change the Default Backend Port

**File:** `backend/src/index.ts`
**Estimated time:** 1 min

**Task:**
Change the default backend port from `3001` to `4000`.

**Starting point (line 27):**
```ts
const PORT = process.env.PORT || 3001;
```

**What the solution looks like:**
```ts
const PORT = process.env.PORT || 4000;
```

**Why this tests understanding:**
Tests understanding of environment variable fallbacks and how the server port is configured.

---

### Challenge 50 --- Change the Default JWT Secret

**File:** `backend/src/routes/auth.ts`
**Estimated time:** 2 min

**Task:**
The default JWT secrets are hardcoded with the year 2025. Update both `JWT_SECRET` and `JWT_REFRESH_SECRET` to use a more descriptive default, and add a console warning at startup if the env vars are not set.

**Starting point (lines 9-10):**
```ts
const JWT_SECRET = process.env.JWT_SECRET || "iis-super-secret-key-2025";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "iis-refresh-secret-key-2025";
```

**What the solution looks like:**
```ts
const JWT_SECRET = process.env.JWT_SECRET || "iis-super-secret-key-2025";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "iis-refresh-secret-key-2025";

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET not set, using default. Set it in .env for production!");
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.warn("WARNING: JWT_REFRESH_SECRET not set, using default. Set it in .env for production!");
}
```

**Why this tests understanding:**
Tests understanding of security best practices for JWT secrets and the importance of environment-based configuration over hardcoded defaults.
