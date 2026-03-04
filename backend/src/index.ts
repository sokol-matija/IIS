import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import http from "http";
import * as soap from "soap";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { PrismaClient } from "@prisma/client";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import uploadRoutes from "./routes/upload";
import { validateXmlAgainstXsd } from "./utils/validateXml";
import { categoriesService } from "./soap/categoriesService";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const GRPC_HOST = process.env.GRPC_SERVER_HOST || "localhost:50051";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);

// Generate XML from DB categories
app.get("/api/generate-xml", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });

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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<categories>\n${xmlItems}\n</categories>`;

    const generatedDir = path.resolve(__dirname, "../generated");
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    fs.writeFileSync(path.join(generatedDir, "categories.xml"), xml, "utf-8");

    res.json({ message: "XML generated successfully", count: categories.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Validate generated XML against XSD
app.get("/api/validate-xml", (_req, res) => {
  const xmlPath = path.resolve(__dirname, "../generated/categories.xml");

  if (!fs.existsSync(xmlPath)) {
    res.status(404).json({ valid: false, errors: ["categories.xml not found. Generate it first."] });
    return;
  }

  const xmlContent = fs.readFileSync(xmlPath, "utf-8");
  const result = validateXmlAgainstXsd(xmlContent);
  res.json(result);
});

// Weather proxy - calls gRPC server
app.get("/api/weather", (req, res) => {
  const city = (req.query.city as string) || "";

  if (!city) {
    res.status(400).json({ error: "City parameter is required" });
    return;
  }

  const PROTO_PATH = path.resolve(__dirname, "../../grpc-server/proto/weather.proto");

  if (!fs.existsSync(PROTO_PATH)) {
    res.status(500).json({ error: "weather.proto not found" });
    return;
  }

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weatherPkg = (protoDescriptor as any).weather;
  const WeatherService = weatherPkg.WeatherService;

  const client = new WeatherService(GRPC_HOST, grpc.credentials.createInsecure());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).GetTemperature({ city }, (err: Error | null, response: unknown) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response);
  });
});

// Settings endpoint
app.get("/api/settings", (_req, res) => {
  res.json({ useCustomApi: process.env.USE_CUSTOM_API !== "false" });
});

app.put("/api/settings", (req, res) => {
  const { useCustomApi } = req.body;
  process.env.USE_CUSTOM_API = useCustomApi ? "true" : "false";
  res.json({ useCustomApi: process.env.USE_CUSTOM_API !== "false" });
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function startServer() {
  // Apollo GraphQL
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await apolloServer.start();

  app.use(
    "/graphql",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expressMiddleware(apolloServer as any, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
        return { token };
      },
    }) as unknown as express.RequestHandler
  );

  // Create HTTP server
  const server = http.createServer(app);

  // SOAP service
  const wsdlPath = path.resolve(__dirname, "./soap/categories.wsdl");
  if (fs.existsSync(wsdlPath)) {
    const wsdl = fs.readFileSync(wsdlPath, "utf-8");
    soap.listen(server, "/soap", categoriesService, wsdl);
    console.log("SOAP service mounted at /soap");
  }

  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`GraphQL at http://localhost:${PORT}/graphql`);
    console.log(`SOAP at http://localhost:${PORT}/soap?wsdl`);
  });
}

startServer().catch(console.error);
