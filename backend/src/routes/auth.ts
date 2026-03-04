import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router: Router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "iis-super-secret-key-2025";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "iis-refresh-secret-key-2025";

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const payload = { userId: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });

  res.json({ accessToken, refreshToken, role: user.role });
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

export default router;
