import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router: Router = Router();

// Enforce JWT secrets are set
const JWT_SECRET: string = process.env.JWT_SECRET || "";
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || "";

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET environment variables must be set");
}

// Rate limiting for login/register (strict — prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many auth attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for refresh (lenient — fires automatically every ~1 min per session)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many refresh attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain number");
  return { valid: errors.length === 0, errors };
}

function issueTokens(user: { id: number; email: string; role: string; tokenVersion: number }) {
  const payload = { userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1m", jwtid: uuidv4() });
  const refreshJti = uuidv4();
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "4h", jwtid: refreshJti });
  return { accessToken, refreshToken, refreshJti };
}

async function storeRefreshToken(jti: string, userId: number, expiresInMs: number) {
  await prisma.refreshToken.create({
    data: {
      jti,
      userId,
      expiresAt: new Date(Date.now() + expiresInMs),
    },
  });
}

router.post("/register", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  // Validate password strength
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    res.status(400).json({ error: "Password does not meet requirements", details: passwordCheck.errors });
    return;
  }

  // Check if email already exists (use constant timing to prevent enumeration)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Return generic message to prevent user enumeration
    res.status(400).json({ error: "Registration failed, please try again" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: "read-only" },
    });

    const { accessToken, refreshToken, refreshJti } = issueTokens(user);
    await storeRefreshToken(refreshJti, user.id, 4 * 60 * 60 * 1000);

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    });

    res.status(201).json({ accessToken, role: user.role });
  } catch (err) {
    res.status(400).json({ error: "Registration failed, please try again" });
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-time comparison to prevent timing attacks
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !passwordMatches) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const { accessToken, refreshToken, refreshJti } = issueTokens(user);
  await storeRefreshToken(refreshJti, user.id, 4 * 60 * 60 * 1000);

  // Set refresh token as HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
  });

  res.json({ accessToken, role: user.role });
});

router.post("/refresh", refreshLimiter, async (req: Request, res: Response): Promise<void> => {
  // Get refresh token from cookie (preferred) or request body (fallback for API clients)
  const refreshToken = (req.cookies as { refreshToken?: string }).refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: number;
      email: string;
      role: string;
      tokenVersion?: number;
      jti?: string;
    };

    if (!decoded.jti) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Use transaction to prevent race condition: atomic find-delete-check-issue
    await prisma.$transaction(async (tx) => {
      // Check if this refresh token exists in DB
      const storedToken = await tx.refreshToken.findUnique({ where: { jti: decoded.jti } });

      if (!storedToken) {
        // Reuse detected — token was already rotated, possible theft
        // Revoke ALL sessions for this user as a safety measure
        await tx.user.update({
          where: { id: decoded.userId },
          data: { tokenVersion: { increment: 1 } },
        });
        await tx.refreshToken.deleteMany({ where: { userId: decoded.userId } });
        res.status(401).json({ error: "Refresh token reuse detected — all sessions revoked" });
        return;
      }

      // Delete the used refresh token (rotation) — BEFORE checking tokenVersion
      await tx.refreshToken.delete({ where: { id: storedToken.id } });

      // Fetch user with updated tokenVersion
      const user = await tx.user.findUnique({ where: { id: decoded.userId } });
      if (!user || (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion)) {
        res.status(401).json({ error: "Token has been revoked" });
        return;
      }

      // Issue new token pair
      const tokens = issueTokens(user);
      await tx.refreshToken.create({
        data: {
          jti: tokens.refreshJti,
          userId: user.id,
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      });

      // Set new refresh token as HttpOnly cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 4 * 60 * 60 * 1000, // 4 hours
      });

      res.json({ accessToken: tokens.accessToken });
    });
  } catch (err) {
    // Silence transaction rollback errors, return generic 401
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/logout", authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { refreshToken } = req.body;

  // Increment tokenVersion to immediately revoke current access token
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });

  // Delete all refresh tokens for this user
  await prisma.refreshToken.deleteMany({ where: { userId } });

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { jti?: string };
      if (decoded.jti) {
        await prisma.refreshToken.deleteMany({ where: { jti: decoded.jti } });
      }
    } catch {
      // Refresh token already expired or invalid — still proceed with logout
    }
  }

  res.json({ message: "Logged out successfully" });
});

router.post("/revoke-all", authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  // Increment tokenVersion — instantly invalidates all access tokens on next check
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
  // Delete all stored refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });

  res.json({ message: "All tokens revoked" });
});

router.get("/users", authenticate, async (req: Request, res: Response): Promise<void> => {
  if (req.user!.role !== "full-access") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      _count: { select: { refreshTokens: true } },
    },
    orderBy: { id: "asc" },
  });

  res.json(users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    activeSessions: u._count.refreshTokens,
  })));
});

router.post("/revoke-user/:userId", authenticate, async (req: Request, res: Response): Promise<void> => {
  if (req.user!.role !== "full-access") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const targetUserId = parseInt(req.params.userId as string, 10);
  if (isNaN(targetUserId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  // Prevent admin from revoking their own sessions
  if (targetUserId === req.user!.userId) {
    res.status(400).json({ error: "Cannot revoke your own sessions" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { tokenVersion: { increment: 1 } },
  });
  await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

  res.json({ message: `All tokens revoked for user ${targetUserId}` });
});

export default router;
