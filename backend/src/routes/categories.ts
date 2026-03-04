import { Router } from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, requireWriteAccess } from "../middleware/auth";

const router: Router = Router();
const prisma = new PrismaClient();

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

// GET /api/categories
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const useCustomApi = process.env.USE_CUSTOM_API !== "false";

  if (!useCustomApi) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/categories`);
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(502).json({ error: "Failed to proxy to Strapi" });
    }
    return;
  }

  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  res.json({ data: categories });
});

// GET /api/categories/:id
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json({ data: category });
});

// POST /api/categories
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
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      res.status(409).json({ error: "Category with this slug already exists" });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

// PUT /api/categories/:id
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

// DELETE /api/categories/:id
router.delete("/:id", authenticate, requireWriteAccess, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const category = await prisma.category.delete({ where: { id } });
    res.json({ data: category });
  } catch {
    res.status(404).json({ error: "Category not found" });
  }
});

export default router;
