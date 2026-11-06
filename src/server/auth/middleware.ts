import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { db } from "../db/client";

// ---------------------------------------------------------------------------
// Augment Express Request with the session user
// ---------------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: Role };
    }
  }
}

// ---------------------------------------------------------------------------
// Pure helper (testable without HTTP)
// ---------------------------------------------------------------------------
export function requireRoleFn(
  allowedRoles: Role[],
  user: { role: Role } | undefined,
  next: (err?: { status: number; code: string; message: string }) => void,
): void {
  if (!user) {
    next({ status: 401, code: "UNAUTHENTICATED", message: "Authentication required." });
    return;
  }
  if (!allowedRoles.includes(user.role)) {
    next({ status: 403, code: "FORBIDDEN", message: "Insufficient permissions." });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// requireAuth middleware — reads the session from the cookie
// ---------------------------------------------------------------------------
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.cookies?.sid;
  if (!token) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } });
    return;
  }

  const session = await db.session.findUnique({
    where: { id: token },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  if (!session) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } });
    return;
  }

  // Expired session: delete it and reject
  if (session.expiresAt <= new Date()) {
    await db.session.delete({ where: { id: token } }).catch(() => {});
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Session expired." } });
    return;
  }

  req.user = session.user;
  next();
}

// ---------------------------------------------------------------------------
// requireRole middleware factory
// ---------------------------------------------------------------------------
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireRoleFn(roles, req.user, (err) => {
      if (err) {
        res.status(err.status).json({ error: { code: err.code, message: err.message } });
        return;
      }
      next();
    });
  };
}
