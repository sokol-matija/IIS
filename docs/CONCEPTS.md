# IIS Concepts — How Everything Works

This document explains *why* each technology exists, *how* it actually works under the hood, and *where* you see it in this project. Read it like a book, not a reference card.

---

## Table of Contents

1. [XML — The Universal Language](#1-xml--the-universal-language)
2. [XSD — Teaching XML What It Should Look Like](#2-xsd--teaching-xml-what-it-should-look-like)
3. [JSON Schema — The JSON Equivalent of XSD](#3-json-schema--the-json-equivalent-of-xsd)
4. [REST — Resources and Verbs](#4-rest--resources-and-verbs)
5. [SOAP — Remote Procedure Calls Over HTTP](#5-soap--remote-procedure-calls-over-http)
6. [WSDL — The Contract Behind SOAP](#6-wsdl--the-contract-behind-soap)
7. [XPath — Navigating XML Like a File System](#7-xpath--navigating-xml-like-a-file-system)
8. [GraphQL — Ask for Exactly What You Need](#8-graphql--ask-for-exactly-what-you-need)
9. [gRPC and Protocol Buffers — Speed Over Readability](#9-grpc-and-protocol-buffers--speed-over-readability)
10. [JWT — Stateless Identity Tokens](#10-jwt--stateless-identity-tokens)
11. [Prisma and ORM — The Database Abstraction Layer](#11-prisma-and-orm--the-database-abstraction-layer)
12. [How the Protocols Compare](#12-how-the-protocols-compare)

---

## 1. XML — The Universal Language

### What it is

XML (eXtensible Markup Language) is a text format for representing structured data using nested tags. The word "extensible" means that unlike HTML (which has a fixed set of tags like `<p>`, `<div>`), you invent your own tags.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<category>
  <name>Electronics</name>
  <slug>electronics</slug>
  <description>Consumer electronic devices</description>
</category>
```

### The mental model

Think of XML as a tree. Every document has exactly one root element, which contains child elements, which may contain their own children. This mirrors the way data actually nests: an order contains line items, each line item has a product and a quantity.

The key properties:
- **Elements** are the `<tag>content</tag>` pairs
- **Attributes** are metadata inside the opening tag: `<item id="3">`
- **Nesting** creates parent-child relationships
- **The document is self-describing** — the tag names tell you what the data means

### Why it exists

XML was designed in 1998 to solve a specific problem: computers needed to exchange data across different systems, languages, and platforms. Before XML there was EDI (Electronic Data Interchange), which was proprietary and platform-specific. XML gave everyone a common grammar.

The key insight XML brought: **separate structure from presentation**. HTML mixes meaning and display. XML carries only meaning — what you do with it is up to the consumer.

### Why XML is still relevant despite JSON

JSON is shorter and easier to read. But XML has advantages for certain use cases:
- **Namespace support** — multiple vocabularies can coexist in one document without collision
- **Attribute vs element distinction** — metadata vs data, encoded structurally
- **Mature validation tooling** — XSD schemas, XSLT transformations, XPath querying
- **Document-centric data** — mixed content (text with embedded elements) is natural in XML
- Enterprise and government systems, banking, healthcare (HL7 FHIR), and web services (SOAP) are still heavily XML-based

### In this project

XML appears in three places:
1. **Task 1** — the uploaded `category.xml` file, which is validated against a schema
2. **Task 2** — `categories.xml` is generated from the database and then queried via XPath inside the SOAP service
3. **Task 2 (SOAP)** — the SOAP envelope itself is XML. Every request and response travels as XML.

---

## 2. XSD — Teaching XML What It Should Look Like

### What it is

XSD (XML Schema Definition) is a schema language for XML. A schema is a formal description of what a valid document looks like: which elements are allowed, in what order, how many times, and what their content must be.

```xml
<!-- backend/schemas/category.xsd -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="category">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string" minOccurs="1"/>
        <xs:element name="slug" type="xs:string" minOccurs="1"/>
        <xs:element name="description" type="xs:string" minOccurs="0"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

This says: a valid `<category>` must have a `<name>` (required), a `<slug>` (required), and optionally a `<description>`.

### The mental model

Think of XSD as a contract. If you give someone an XSD file and an XML file, they can independently verify whether the XML satisfies the contract — without knowing anything about your application. This is valuable for integration: two companies can exchange XML documents and validate them against a shared schema before processing.

The XSD language itself is XML. This means schema files can be validated, edited with XML tools, and transformed with XSLT.

### What XSD can express

- **Required vs optional elements** (`minOccurs`, `maxOccurs`)
- **Element ordering** (`xs:sequence` — ordered, `xs:all` — any order, `xs:choice` — one of)
- **Data types** — `xs:string`, `xs:integer`, `xs:date`, `xs:boolean`, and more
- **String constraints** — regular expression patterns, min/max length, enumerated values
- **Complex nesting** — elements that contain other elements
- **Reuse** — named types can be referenced from multiple element definitions

### The validation process

1. Parse the XML document into a DOM tree
2. Find the root element
3. Check it matches the schema's root element declaration
4. Recursively verify that child elements match, are in the right order, appear the right number of times, and contain the right types

If any check fails, the validator reports an error with the path to the failing element.

### In this project

The file `backend/schemas/category.xsd` defines the valid structure for a category document. The validator is in `backend/src/utils/validateXml.ts`. It is called in three places:

- **Task 1 upload** — validates the uploaded XML file before saving to the database
- **Task 2 SOAP service** — validates `categories.xml` before processing it with XPath
- **Task 3 validation** — the dedicated validation endpoint reads `categories.xml` and validates it

The validator in this project is a structural validator written in JavaScript (not a full XSD processor). It checks element names and required children, but does not enforce data type constraints or complex XSD patterns. A full XSD validator would use a library like `libxmljs` or a Java JAXB processor.

---

## 3. JSON Schema — The JSON Equivalent of XSD

### What it is

JSON Schema is a vocabulary for validating JSON documents. Like XSD for XML, it lets you define what a valid JSON object looks like — which properties are required, what their types must be, and what patterns or ranges they must satisfy.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "slug"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "slug": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "description": { "type": "string" }
  },
  "additionalProperties": false
}
```

This says: the object must have `name` (a non-empty string) and `slug` (a string matching kebab-case), may have `description`, and must not have any other properties.

### The mental model

JSON Schema and XSD solve the same conceptual problem, but JSON Schema is simpler because JSON has fewer structural concepts (no attributes, no namespaces, no mixed content). JSON Schema is itself a JSON document, which makes it easy to work with in JavaScript environments.

### Key JSON Schema keywords

| Keyword | Purpose |
|---|---|
| `type` | Data type: `"string"`, `"number"`, `"boolean"`, `"object"`, `"array"`, `"null"` |
| `required` | Array of property names that must be present |
| `properties` | Object defining schemas for each named property |
| `pattern` | Regular expression that a string must match |
| `minLength` / `maxLength` | String length bounds |
| `minimum` / `maximum` | Number bounds |
| `additionalProperties` | Whether properties not listed in `properties` are allowed |
| `enum` | An array of the only allowed values |
| `$ref` | Reference to another schema definition |

### AJV — the validator

In this project, JSON Schema validation uses **AJV** (Another JSON Validator). AJV compiles the schema into a validation function once at startup, which is then called for each document. The compiled approach is much faster than interpreting the schema on every validation.

```typescript
// backend/src/routes/upload.ts
const Ajv = require("ajv");
const ajv = new Ajv();
const validateJson = ajv.compile(jsonSchema); // compiled once

// Later, per request:
if (!validateJson(jsonData)) {
  const errors = validateJson.errors.map(e => `JSON: ${e.instancePath} ${e.message}`);
}
```

### In this project

The file `backend/schemas/category.schema.json` validates the uploaded JSON file in Task 1. The `slug` property must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` — this is a regular expression enforcing kebab-case (lowercase letters, numbers, hyphens; no spaces, no uppercase).

---

## 4. REST — Resources and Verbs

### What it is

REST (Representational State Transfer) is an architectural style for designing networked APIs. It is not a protocol — it is a set of constraints. An API that follows these constraints is called RESTful.

The core idea: **the web already has a great transport protocol (HTTP) and a great vocabulary (verbs + URLs). Design your API to use them naturally.**

### The constraints

1. **Client-server** — the UI and data storage are separate concerns
2. **Stateless** — each request contains all information needed to process it; the server stores no session state
3. **Cacheable** — responses can be marked cacheable so clients can reuse them
4. **Uniform interface** — a consistent way to identify and interact with resources

The uniform interface is the most important part. It means:
- Resources are identified by URLs: `/categories`, `/categories/42`
- Representations (JSON, XML) are separate from resources
- HTTP verbs define operations: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`

### HTTP verbs and their meaning

| Verb | Meaning | Idempotent? | Body? |
|---|---|---|---|
| `GET` | Retrieve a resource | Yes | No |
| `POST` | Create a new resource | No | Yes |
| `PUT` | Replace a resource entirely | Yes | Yes |
| `PATCH` | Partially update a resource | No | Yes |
| `DELETE` | Remove a resource | Yes | No |

**Idempotent** means: calling the same operation twice has the same effect as calling it once. `DELETE /categories/42` called twice still results in category 42 being gone. `POST /categories` called twice creates two categories.

### HTTP status codes

Status codes tell the client what happened. The first digit indicates the class:
- `2xx` — success: `200 OK`, `201 Created`, `204 No Content`
- `4xx` — client error: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- `5xx` — server error: `500 Internal Server Error`

### In this project

The REST API lives in `backend/src/routes/categories.ts`:

```
GET    /api/categories        → list all categories
GET    /api/categories/:id    → get one category
POST   /api/categories        → create (requires full-access JWT)
PUT    /api/categories/:id    → update (requires full-access JWT)
DELETE /api/categories/:id    → delete (requires full-access JWT)
```

The frontend calls these from `frontend/src/api/categories.ts`.

### REST vs the alternatives

REST is good for CRUD over resources. It is less good when:
- You need a specific operation that doesn't map to a verb/resource (e.g., "send email", "merge accounts") — SOAP was designed for this
- You need to fetch a complex graph of related data in one call — GraphQL was designed for this
- You need high-throughput binary communication between services — gRPC was designed for this

---

## 5. SOAP — Remote Procedure Calls Over HTTP

### What it is

SOAP (Simple Object Access Protocol) is a protocol for exchanging structured information between services. Unlike REST (which is an architectural style), SOAP is a formal protocol with a strict specification. Every SOAP message follows the same envelope structure.

The name is historical — it was designed to enable "remote procedure calls" (calling functions on a remote machine as if they were local). The word "simple" is ironic to anyone who has worked with it.

### The envelope structure

Every SOAP message is an XML document with this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tns="http://iis.hr/categories">

  <soap:Header>
    <!-- Optional metadata: auth tokens, routing, tracing -->
  </soap:Header>

  <soap:Body>
    <!-- The actual request or response -->
    <tns:SearchCategoriesRequest>
      <tns:term>electronics</tns:term>
    </tns:SearchCategoriesRequest>
  </soap:Body>

</soap:Envelope>
```

The `Envelope` is the outer wrapper. The `Header` carries metadata (authentication tokens, routing info, transaction IDs). The `Body` carries the actual payload — the operation being called and its parameters.

### Why XML namespaces matter here

The `xmlns:soap` and `xmlns:tns` attributes declare namespaces. A namespace is a URI that uniquely identifies a set of element names. `soap:Envelope` means "the `Envelope` element from the SOAP namespace". `tns:term` means "the `term` element from our own namespace (target namespace = `tns`)". This prevents name collisions when XML from different systems is combined.

### The SOAPAction header

SOAP requests include a `SOAPAction` HTTP header:

```
SOAPAction: "http://iis.hr/categories/SearchCategories"
```

This tells the server which operation is being called before it parses the body. Some SOAP frameworks use this for routing; others ignore it. In this project it is required by the `soap` npm package to match the WSDL operation binding.

### Request and response

A SOAP request is an HTTP POST to a single endpoint (e.g., `/soap`). The response is also an XML envelope. If something goes wrong, the response contains a `<soap:Fault>` element instead of the expected body:

```xml
<soap:Body>
  <soap:Fault>
    <faultcode>soap:Server</faultcode>
    <faultstring>Category not found</faultstring>
  </soap:Fault>
</soap:Body>
```

### Why SOAP exists

SOAP was dominant from ~2000–2010. It was designed for enterprise integration where:
- Formal contracts (WSDL) were required for legal or compliance reasons
- Built-in security (WS-Security header) was needed
- Reliability, transactions, and orchestration (WS-* standards) mattered
- Multiple transport protocols were in use (HTTP, SMTP, JMS)

REST displaced SOAP for web APIs because REST is far simpler. But SOAP is still common in banking, insurance, healthcare (HL7), government, and any domain where formal contracts between systems are contractually required.

### In this project

The SOAP service is in `backend/src/soap/`. The `node-soap` library reads the WSDL and automatically routes incoming SOAP requests to the `categoriesService` object. The frontend in `frontend/src/api/soap.ts` builds the envelope by hand (as a template literal string) and parses the response with `DOMParser`.

---

## 6. WSDL — The Contract Behind SOAP

### What it is

WSDL (Web Services Description Language) is an XML format that describes a SOAP service. It defines:
- What operations exist (e.g., `SearchCategories`)
- What parameters each operation takes and what it returns
- Where the service is located (the endpoint URL)
- How to bind the abstract operations to a concrete protocol (HTTP, SOAP)

WSDL is to SOAP what an API documentation page is to REST — except WSDL is machine-readable and tools can automatically generate client code from it.

### The structure of a WSDL

```xml
<definitions name="CategoriesService" ...>

  <!-- 1. Data types (using XSD) -->
  <types>
    <xs:schema>
      <xs:element name="SearchCategoriesRequest">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="term" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
      <!-- response type... -->
    </xs:schema>
  </types>

  <!-- 2. Messages (input/output wrappers) -->
  <message name="SearchCategoriesInput">
    <part name="parameters" element="tns:SearchCategoriesRequest"/>
  </message>
  <message name="SearchCategoriesOutput">
    <part name="parameters" element="tns:SearchCategoriesResponse"/>
  </message>

  <!-- 3. Port type (abstract interface) -->
  <portType name="CategoriesPort">
    <operation name="SearchCategories">
      <input message="tns:SearchCategoriesInput"/>
      <output message="tns:SearchCategoriesOutput"/>
    </operation>
  </portType>

  <!-- 4. Binding (concrete protocol) -->
  <binding name="CategoriesSoapBinding" type="tns:CategoriesPort">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="SearchCategories">
      <soap:operation soapAction="http://iis.hr/categories/SearchCategories"/>
      <!-- input/output encoding -->
    </operation>
  </binding>

  <!-- 5. Service (endpoint location) -->
  <service name="CategoriesService">
    <port name="CategoriesPort" binding="tns:CategoriesSoapBinding">
      <soap:address location="http://localhost:3001/soap"/>
    </port>
  </service>

</definitions>
```

### Reading a WSDL

Work backwards from the bottom:
1. **Service** tells you where to call (the URL)
2. **Binding** tells you how to call it (SOAP over HTTP, with SOAPAction)
3. **Port type** tells you what you can do (the operations)
4. **Messages** tell you what data goes in and comes out
5. **Types** tell you the shape of that data (using XSD)

### In this project

The WSDL lives at `backend/src/soap/categories.wsdl`. It is served at `GET /soap?wsdl` — any SOAP client can fetch this URL to understand how to call the service. The `node-soap` library reads this WSDL at startup and uses it to parse incoming requests and validate their structure.

---

## 7. XPath — Navigating XML Like a File System

### What it is

XPath (XML Path Language) is a query language for selecting nodes from an XML document. It treats an XML document like a file system: you navigate through it using path-like expressions to select elements, attributes, or text.

### The tree model

Before XPath makes sense, you need to understand that XPath sees an XML document as a tree of **nodes**:
- **Element nodes** — `<name>Electronics</name>`
- **Text nodes** — `Electronics` (the content of an element)
- **Attribute nodes** — `id="42"` inside an element
- **Document node** — the invisible root above the root element

XPath expressions navigate this tree.

### Basic path expressions

```
/                       → document root
/categories             → root element <categories>
/categories/category    → all <category> children of <categories>
//category              → all <category> elements anywhere in the document
//category/name         → all <name> elements inside any <category>
//category/@id          → the id attribute of all <category> elements
```

The `//` is the key shortcut: it means "anywhere in the document, regardless of depth". In contrast, `/categories/category` requires that exact path.

### Predicates — filtering with []

Square brackets add conditions:

```
//category[name="Electronics"]          → categories where <name> is exactly "Electronics"
//category[position() = 1]             → only the first category
//category[last()]                     → only the last category
//category[@id > 5]                    → categories with id attribute > 5
//category[description]                → categories that have a <description> child
```

### XPath functions

XPath has built-in functions for strings, numbers, and node sets:

| Function | Description | Example |
|---|---|---|
| `contains(a, b)` | True if string `a` contains `b` | `contains(name, 'tron')` |
| `starts-with(a, b)` | True if `a` starts with `b` | `starts-with(slug, 'el')` |
| `normalize-space(s)` | Strips leading/trailing whitespace | |
| `translate(s, from, to)` | Replace characters (used for case-insensitive search) | see below |
| `count(nodes)` | Number of nodes in a set | `count(//category)` |
| `string-length(s)` | Length of a string | |
| `not(expr)` | Logical NOT | `not(description)` |

### The translate() trick for case-insensitive search

XPath 1.0 has no `lower-case()` function (that's XPath 2.0). The workaround is `translate()`, which replaces each character in the first argument that appears in the second argument with the corresponding character in the third argument:

```xpath
translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')
```

This converts the `name` element's content to lowercase. Combined with `contains()`:

```xpath
contains(
  translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),
  'electronics'
)
```

This matches "Electronics", "ELECTRONICS", "eLeCTRoNiCS" — all become "electronics" before the `contains` check.

### In this project

The XPath query in `backend/src/soap/categoriesService.ts`:

```typescript
const xpathQuery = `//category[
  contains(translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}') or
  contains(translate(description, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}')
]`;
```

This selects all `<category>` elements anywhere in the document where either the `<name>` or `<description>` child element (case-insensitively) contains the search term.

An empty term (e.g., `""`) matches everything because `contains(anything, "")` is always true in XPath. This is how "Show All" works — it sends an empty term.

---

## 8. GraphQL — Ask for Exactly What You Need

### What it is

GraphQL is a query language for APIs, developed by Facebook in 2012 and open-sourced in 2015. Unlike REST (where the server defines what each endpoint returns), GraphQL lets the **client** declare exactly what data it wants. The server returns precisely that — no more, no less.

### The problem it solves

Imagine a mobile app showing a list of categories. It only needs `id` and `name`. With REST:

```
GET /api/categories
→ [{ id, name, slug, description, createdAt, updatedAt, ... }]
```

The server returns every field. The client discards most of it. This is called **over-fetching**.

Now imagine the same app needs, for each category, the count of products in it. With REST you'd need a second request: `GET /api/categories/:id/products`. This is **under-fetching** (two round trips for one screen).

GraphQL solves both:

```graphql
{
  categories {
    id
    name
  }
}
```

The client asks for only `id` and `name`. The server returns only those. If you later need `description`, you add it to the query — no API version needed.

### The type system

GraphQL has a schema that defines all types and operations:

```graphql
type Category {
  id: Int!
  name: String!
  slug: String!
  description: String
}

type Query {
  categories: [Category!]!
  category(id: Int!): Category
}

type Mutation {
  createCategory(name: String!, slug: String!, description: String): Category!
  updateCategory(id: Int!, name: String, slug: String, description: String): Category!
  deleteCategory(id: Int!): Boolean!
}
```

- `!` means non-nullable (required)
- `[Category!]!` means a non-null list of non-null Category objects
- `Query` types define read operations
- `Mutation` types define write operations

### Resolvers

A resolver is a function that provides the data for a field. When GraphQL receives a query, it executes the resolver for each requested field:

```typescript
// backend/src/graphql/resolvers.ts
const resolvers = {
  Query: {
    categories: async (_: unknown, __: unknown, context: GqlContext) => {
      const user = getUser(context); // verify JWT
      return prisma.category.findMany();
    },
  },
  Mutation: {
    createCategory: async (_: unknown, args: { name: string; slug: string }, context: GqlContext) => {
      requireWrite(getUser(context)); // verify full-access role
      return prisma.category.create({ data: args });
    },
  },
};
```

### A GraphQL request

All GraphQL operations go to a single endpoint (`POST /graphql`) with a JSON body:

```json
{
  "query": "{ categories { id name } }"
}
```

The response is always JSON with a `data` key (and optionally an `errors` key):

```json
{
  "data": {
    "categories": [
      { "id": 1, "name": "Electronics" },
      { "id": 2, "name": "Books" }
    ]
  }
}
```

### GraphQL vs REST vs SOAP

| | REST | SOAP | GraphQL |
|---|---|---|---|
| Transport | HTTP | HTTP (or others) | HTTP |
| Format | JSON (typically) | XML | JSON |
| Multiple endpoints | Yes (`/users`, `/posts`) | One per service | Single (`/graphql`) |
| Client controls response shape | No | No | Yes |
| Type system | Informal | XSD in WSDL | Built-in schema |
| Best for | Simple CRUD | Enterprise integration | Complex, varied data needs |

### In this project

The GraphQL server uses **Apollo Server** mounted on `POST /graphql`. The schema is in `backend/src/graphql/schema.ts` and resolvers in `backend/src/graphql/resolvers.ts`. The frontend's Task 5 page has a built-in query editor that lets you run arbitrary GraphQL queries directly.

---

## 9. gRPC and Protocol Buffers — Speed Over Readability

### What it is

gRPC (Google Remote Procedure Call) is a high-performance framework for calling functions on remote services. Where REST uses text (JSON over HTTP/1.1), gRPC uses binary encoding (Protocol Buffers over HTTP/2). The trade-off: much faster and more efficient, but not human-readable.

### Protocol Buffers (protobuf)

Protocol Buffers is the serialization format used by gRPC. You define your data structures in a `.proto` file:

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
  string city        = 1;
  string temperature = 2;
  string description = 3;
}
```

The `= 1`, `= 2` numbers are **field tags** — they identify fields in the binary encoding. This is what allows protobuf to be so compact: instead of repeating the field name ("temperature") in every record, it encodes a tiny integer (2).

### How binary encoding works

JSON: `{"city":"Zagreb","temperature":"18.5","description":"Sunny"}`
→ 57 bytes, human-readable

Protobuf encodes the same data as a byte sequence using field tags and length-delimited encoding. The result might be ~20 bytes — less than half the size. For high-volume services processing millions of messages, this matters enormously.

### HTTP/2

gRPC runs over HTTP/2, which provides:
- **Multiplexing** — multiple requests over a single TCP connection simultaneously
- **Header compression** — repeated headers (like `Content-Type`) are compressed
- **Streaming** — server can push responses before the client has finished sending the request
- **Binary framing** — data is sent in frames, not plain text

HTTP/1.1 (which REST typically uses) sends one request per connection (or keeps a connection alive but still serializes). HTTP/2 parallelizes everything.

### Why browsers can't call gRPC directly

Browsers have no API for raw HTTP/2 binary frames. The `fetch` API and `XMLHttpRequest` are designed for HTTP/1.1 semantics. There is a project called gRPC-Web that works around this, but standard gRPC requires a proxy.

This is why the architecture in this project includes a **REST-to-gRPC proxy**: the browser calls a regular REST endpoint (`GET /api/weather`), the Express backend translates the request into a gRPC call, and returns the decoded response as JSON.

```
Browser  →  REST (HTTP/1.1 JSON)  →  Express  →  gRPC (HTTP/2 protobuf)  →  gRPC server
```

### The generated client

You never write gRPC wire encoding by hand. The `proto` file is the source of truth, and tools generate client and server code from it. In this project, the `@grpc/grpc-js` and `@grpc/proto-loader` libraries load the `.proto` file at runtime and create typed clients.

### Streaming

gRPC supports four communication patterns:
1. **Unary** — one request, one response (like REST). Used in this project.
2. **Server streaming** — one request, stream of responses (e.g., live data feed)
3. **Client streaming** — stream of requests, one response (e.g., file upload)
4. **Bidirectional streaming** — both sides stream simultaneously (e.g., chat)

### In this project

The gRPC server is in `grpc-server/src/server.ts`. It implements `GetTemperature(city)` by fetching the Croatian weather XML from `https://vrijeme.hr/hrvatska_n.xml`, parsing it, filtering stations by city name, and returning the results. The Express backend acts as the gRPC client in `backend/src/index.ts`.

---

## 10. JWT — Stateless Identity Tokens

### What it is

JWT (JSON Web Token, pronounced "jot") is a compact, self-contained token that encodes identity and claims. "Self-contained" means all the information needed to verify the token is inside the token itself — the server does not need to query a database to validate it.

### The structure

A JWT looks like this:

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AaWlzLmhyIiwicm9sZSI6ImZ1bGwtYWNjZXNzIiwiZXhwIjoxNzA5MzEzMzAwfQ.SIGNATURE
```

It is three Base64-encoded segments separated by dots:

```
HEADER.PAYLOAD.SIGNATURE
```

**Header** — algorithm and token type:
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** — claims (data about the user):
```json
{
  "userId": 1,
  "email": "admin@iis.hr",
  "role": "full-access",
  "iat": 1709312400,
  "exp": 1709313300
}
```

`iat` = issued at (Unix timestamp). `exp` = expiry (Unix timestamp). The server rejects tokens after `exp`.

**Signature** — a cryptographic hash of `header.payload` using a secret key:
```
HMAC-SHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

### Why the signature is critical

Anyone can decode a JWT — it is Base64, not encrypted. You can paste a JWT at `jwt.io` and read the payload. The security comes from the signature: you cannot change the payload without knowing the secret key, because the signature would no longer match. If an attacker changes `"role": "read-only"` to `"role": "full-access"`, the signature becomes invalid and the server rejects the token.

### The two-token pattern

A single long-lived token is a security risk: if stolen, it grants access until it expires. The solution is two tokens:

| | Access Token | Refresh Token |
|---|---|---|
| Expiry | Short (15 minutes) | Long (7 days) |
| Secret | `JWT_SECRET` | `JWT_REFRESH_SECRET` |
| Storage | Memory (Zustand store) | `localStorage` |
| Used for | Every API call | Only to get a new access token |

The flow:
1. User logs in → receives both tokens
2. Every API call uses the access token in `Authorization: Bearer <token>`
3. When the access token expires, the frontend automatically calls `POST /auth/refresh` with the refresh token to get a new access token
4. If the refresh token expires (or is invalid), the user is logged out

### Why access token in memory, not localStorage

Storing tokens in `localStorage` exposes them to XSS attacks: if any JavaScript on the page can run `localStorage.getItem("token")`, an attacker's injected script can steal it. Memory (a JavaScript variable in Zustand) is harder to steal because it is not accessible via the DOM or `localStorage` APIs.

The refresh token is in `localStorage` because it needs to survive page refreshes. This is an acceptable trade-off: the refresh token is less dangerous (it can only be used to get an access token, not to call APIs directly) and is typically validated against a server-side list of issued tokens in production (token rotation).

### Statelessness

The key advantage over sessions: the server stores nothing. With sessions, the server maintains a session store (Redis, database) mapping session IDs to user data. With JWT, the token carries all user data. Any server can validate any JWT using only the shared secret. This makes horizontal scaling trivial — you can add servers without synchronizing session state.

### In this project

The auth flow is in `backend/src/routes/auth.ts`. The frontend stores the access token in Zustand (`authStore.ts`) and the refresh token in `localStorage`. The `getToken()` function in authStore handles silent refresh automatically — components never need to think about token expiry.

---

## 11. Prisma and ORM — The Database Abstraction Layer

### What is an ORM

ORM (Object-Relational Mapper) is a layer between your code and your database that lets you work with database tables as if they were JavaScript objects. Instead of writing SQL:

```sql
SELECT * FROM "Category" WHERE id = 42;
```

You write TypeScript:

```typescript
const category = await prisma.category.findUnique({ where: { id: 42 } });
```

The ORM generates and executes the SQL for you.

### Why use an ORM

- **Type safety** — Prisma generates TypeScript types from your schema. If you access a field that doesn't exist, you get a compile error, not a runtime error.
- **SQL injection prevention** — parameterized queries are used automatically.
- **Database portability** — switching from SQLite to PostgreSQL requires only a one-line change in the schema file.
- **Migrations** — the schema is the source of truth; Prisma generates SQL migration files automatically when you change the schema.

### The Prisma schema

```prisma
// backend/prisma/schema.prisma
model Category {
  id          Int     @id @default(autoincrement())
  name        String
  slug        String  @unique
  description String?
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  role     String @default("read-only")
}
```

`@id` — this field is the primary key. `@default(autoincrement())` — auto-increment integer. `@unique` — must be unique across all rows. `String?` — nullable (the `?` makes it optional).

### Key Prisma operations

```typescript
// Create
await prisma.category.create({ data: { name, slug, description } });

// Read all
await prisma.category.findMany();

// Read one
await prisma.category.findUnique({ where: { id: 42 } });

// Update
await prisma.category.update({ where: { id: 42 }, data: { name: "New Name" } });

// Delete
await prisma.category.delete({ where: { id: 42 } });

// Filtered query
await prisma.category.findMany({
  where: { name: { contains: "elec" } },
  orderBy: { name: "asc" },
});
```

### SQLite in this project

SQLite is a serverless database — the entire database is a single file (`backend/prisma/dev.db`). There is no database server process. The application reads and writes the file directly. This makes development simple: no installation, no configuration. For production, the schema would be unchanged but the `DATABASE_URL` would point to PostgreSQL or MySQL.

---

## 12. How the Protocols Compare

This is the question professors love: "Why did you use SOAP here instead of REST?"

### Decision matrix

| Concern | REST | SOAP | GraphQL | gRPC |
|---|---|---|---|---|
| Human-readable | Yes (JSON) | Partially (XML) | Yes (JSON) | No (binary) |
| Formal contract | No | Yes (WSDL+XSD) | Yes (schema) | Yes (proto) |
| Client-defined queries | No | No | Yes | No |
| Generated clients | No | Yes (from WSDL) | Partial | Yes (from proto) |
| Streaming | No | No | Subscriptions | Yes (native) |
| Performance | Medium | Low | Medium | High |
| Typical use | Web APIs | Enterprise/legacy | Mobile/BFF | Microservices |

### Why SOAP for Task 2 (not REST)

The course requirement is to demonstrate SOAP + XPath. But the design choice also reflects real-world reasoning:

1. **Formal contract** — the WSDL guarantees both sides agree on the message format. Any client that reads the WSDL can generate code to call the service without human coordination.
2. **XML-native querying** — the data is already in XML (`categories.xml`). XPath is the natural query language for XML data. Using SOAP keeps the entire pipeline in the XML world.
3. **Standardized error handling** — `soap:Fault` is a standardized way to communicate errors, including error codes and detail messages.

### Why GraphQL for Task 5 (not just REST)

The project already has REST for CRUD. GraphQL is added to demonstrate:
1. **Schema introspection** — clients can discover the API shape at runtime
2. **Single endpoint** — one `POST /graphql` replaces multiple REST endpoints
3. **Flexible queries** — the frontend can request only the fields it needs (useful when displaying category lists vs. full detail views)

### Why gRPC for Task 4 (not REST)

1. **Binary efficiency** — weather data is fetched frequently and the binary encoding is more efficient than JSON
2. **Streaming potential** — gRPC was designed for live data streams; a weather service could stream real-time updates
3. **Strong contract** — the `.proto` file is the definitive contract between the frontend proxy and the weather server
4. **Service-to-service** — gRPC is the natural choice for server-to-server communication; browsers can't use it directly, which is why the REST proxy exists

### The full picture

Every protocol in this project answers the same question ("how does one piece of software talk to another?") but makes different trade-offs:

```
REST        simple, flexible, no formal contract
SOAP        formal, verbose, enterprise-grade contracts and errors
GraphQL     client-driven, flexible queries, strong schema
gRPC        fast, binary, streaming, service-to-service
```

None is universally better. Real systems use multiple protocols: a public API might be REST, internal microservices might use gRPC, and a legacy integration might require SOAP. The skill is knowing which to reach for and why.

---

*End of concepts document. For implementation details, see TASKS_EXPLAINED.md. For the API reference, see API.md.*
