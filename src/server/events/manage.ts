import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { db as prisma } from "../db/client";
import { requireAuth, requireRole } from "../auth/middleware";
import { createEventSchema, canPublish } from "./rules";

export const manageRouter = Router();
manageRouter.use(requireAuth);

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const toDto = (e: { id: string; title: string; startsAt: Date; capacity: number; status: string; organizerId: string }) => ({
  id: e.id,
  title: e.title,
  startsAt: e.startsAt,
  capacity: e.capacity,
  status: e.status,
  organizerId: e.organizerId,
});

// FR-02 / BR-01: organizer creates a DRAFT event. Owner always comes from the session.
manageRouter.post("/", requireRole("ORGANIZER"), async (req, res, next: NextFunction) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Invalid event data");
    const ev = await prisma.event.create({
      data: {
        title: parsed.data.title,
        startsAt: new Date(parsed.data.startsAt),
        capacity: parsed.data.capacity,
        status: "DRAFT",
        organizerId: req.user!.id,
      },
    });
    return res.status(201).json(toDto(ev));
  } catch (e) {
    return next(e);
  }
});

// FR-03 / BR-02 / BR-07: owner publishes a DRAFT event whose date is in the future.
manageRouter.post("/:id/publish", requireRole("ORGANIZER"), async (req, res, next: NextFunction) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) return fail(res, 404, "NOT_FOUND", "Event not found");
    const ev = await prisma.event.findFirst({ where: { id: id.data, organizerId: req.user!.id } });
    if (!ev) return fail(res, 404, "NOT_FOUND", "Event not found");
    if (ev.status !== "DRAFT") return fail(res, 409, "ALREADY_PUBLISHED", "The event is already published");
    if (!canPublish(ev, new Date())) return fail(res, 409, "EVENT_IN_PAST", "The event date is not in the future");
    const updated = await prisma.event.update({ where: { id: ev.id }, data: { status: "PUBLISHED" } });
    return res.json(toDto(updated));
  } catch (e) {
    return next(e);
  }
});
