import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  tokenVersion?: number;
  jti?: string;
  iat?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Enforce JWT_SECRET is set
const JWT_SECRET: string = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set");
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;

    // Check tokenVersion — instant revocation
    if (decoded.tokenVersion !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { tokenVersion: true },
      });
      if (!user || decoded.tokenVersion !== user.tokenVersion) {
        res.status(401).json({ error: "Token has been revoked" });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

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
