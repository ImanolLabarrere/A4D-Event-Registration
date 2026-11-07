import { Router, type Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { requireAuth, requireRole } from "../auth/middleware";

export const myRegistrationsRouter = Router();

myRegistrationsRouter.use(requireAuth);
myRegistrationsRouter.use(requireRole("PARTICIPANT"));

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

// ---------------------------------------------------------------------------
// GET /api/registrations — List the session user's registrations (newest first)
// ---------------------------------------------------------------------------
myRegistrationsRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const registrations = await db.registration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            title: true,
            startsAt: true,
          },
        },
      },
    });

    const result = registrations.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: r.event.title,
      eventStartsAt: r.event.startsAt,
      status: r.status,
      createdAt: r.createdAt,
    }));

    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
});

// ---------------------------------------------------------------------------
// GET /api/registrations/:id — Detail of a specific registration owned by user
// ---------------------------------------------------------------------------
myRegistrationsRouter.get("/:id", async (req, res, next) => {
  try {
    const idParse = z.string().uuid().safeParse(req.params.id);
    if (!idParse.success) {
      return fail(res, 404, "NOT_FOUND", "Registration not found");
    }

    const regId = idParse.data;
    const userId = req.user!.id;

    const reg = await db.registration.findUnique({
      where: { id: regId },
      include: {
        event: {
          select: {
            title: true,
            startsAt: true,
          },
        },
      },
    });

    // BR-09: A registration belonging to someone else is indistinguishable from 404
    if (!reg || reg.userId !== userId) {
      return fail(res, 404, "NOT_FOUND", "Registration not found");
    }

    return res.status(200).json({
      id: reg.id,
      eventId: reg.eventId,
      eventTitle: reg.event.title,
      eventStartsAt: reg.event.startsAt,
      status: reg.status,
      createdAt: reg.createdAt,
    });
  } catch (e) {
    return next(e);
  }
});
