import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { prisma } from "../lib/prisma";
import { validateXmlAgainstXsd } from "../utils/validateXml";
import { authenticate } from "../middleware/auth";

const router: Router = Router();
const upload = multer({ dest: "/tmp/uploads/" });

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schemaPath = path.resolve(__dirname, "../../schemas/category.schema.json");
const jsonSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
const validateJson = ajv.compile(jsonSchema);

// POST /api/upload
router.post(
  "/",
  authenticate,
  upload.fields([
    { name: "xmlFile", maxCount: 1 },
    { name: "jsonFile", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.xmlFile?.[0] || !files?.jsonFile?.[0]) {
      res.status(400).json({ errors: ["Both XML and JSON files are required"] });
      return;
    }

    const errors: string[] = [];

    const xmlContent = fs.readFileSync(files.xmlFile[0].path, "utf-8");
    const jsonContent = fs.readFileSync(files.jsonFile[0].path, "utf-8");

    // Validate XML against XSD
    const xmlResult = validateXmlAgainstXsd(xmlContent);
    if (!xmlResult.valid) {
      errors.push(...xmlResult.errors.map((e) => `XML: ${e}`));
    }

    // Validate JSON against JSON Schema
    let jsonData: { name?: string; slug?: string; description?: string } | null = null;
    try {
      jsonData = JSON.parse(jsonContent);
    } catch {
      errors.push("JSON: Invalid JSON format");
    }

    if (jsonData && !validateJson(jsonData)) {
      const jsonErrors = validateJson.errors?.map(
        (e) => `JSON: ${e.instancePath} ${e.message}`
      ) || [];
      errors.push(...jsonErrors);
    }

    // Clean up temp files
    fs.unlinkSync(files.xmlFile[0].path);
    fs.unlinkSync(files.jsonFile[0].path);

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    if (req.query.validateOnly === "true") {
      res.json({ valid: true, message: "Validation passed" });
      return;
    }

    try {
      const category = await prisma.category.create({
        data: {
          name: jsonData!.name!,
          slug: jsonData!.slug!,
          description: jsonData!.description || null,
        },
      });
      res.json({ data: category });
    } catch (err: unknown) {
      // Don't expose internal error details
      if (err instanceof Error && err.message.includes("Unique constraint")) {
        res.status(409).json({ errors: ["Category with this slug already exists"] });
      } else {
        // Log error internally but return generic message to client
        console.error("Upload error:", err);
        res.status(500).json({ errors: ["Failed to create category"] });
      }
    }
  }
);

export default router;
