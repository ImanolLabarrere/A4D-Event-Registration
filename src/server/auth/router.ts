import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../db/client";
import { generateSessionToken, sessionExpiresAt } from "./token";
import { requireAuth } from "./middleware";

export const authRouter = Router();

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().min(1).max(254),
  password: z.string().min(1).max(200),
});

const COOKIE_NAME = "sid";
const IS_PROD = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid input." } });
    return;
  }

  const { email, password } = parsed.data;
  const normalised = email.trim().toLowerCase();

  const user = await db.user.findUnique({ where: { email: normalised } });

  // Use constant-time comparison: always call argon2.verify even on unknown email
  const dummyHash =
    "$argon2id$v=19$m=65536,t=3,p=4$aaaaaaaaaaaaaaaa$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const hash = user?.passwordHash ?? dummyHash;
  const valid = await argon2.verify(hash, password).catch(() => false);

  if (!user || !valid) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    return;
  }

  // Create session
  const token = generateSessionToken();
  const expiresAt = sessionExpiresAt();
  await db.session.create({ data: { id: token, userId: user.id, expiresAt } });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: IS_PROD,
    expires: expiresAt,
  });

  res.status(200).json({ id: user.id, email: user.email, role: user.role });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
authRouter.post("/logout", async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_NAME];
  if (token) {
    await db.session.delete({ where: { id: token } }).catch(() => {});
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
authRouter.get("/me", requireAuth, (req, res) => {
  res.status(200).json({ id: req.user!.id, email: req.user!.email, role: req.user!.role });
});
