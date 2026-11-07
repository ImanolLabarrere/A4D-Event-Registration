import { Router, type Response } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { requireAuth, requireRole } from "../auth/middleware";
import { decideRegistration } from "./rules";

export const registrationsRouter = Router();
registrationsRouter.use(requireAuth);

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

// FR-05 / BR-03 / BR-04 / BR-05 / BR-06: register the session user for a published event.
// The event row is locked (SELECT ... FOR UPDATE) so concurrent requests are serialized (NFR-03).
registrationsRouter.post("/:id/registrations", requireRole("PARTICIPANT"), async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) return fail(res, 404, "NOT_FOUND", "Event not found");
    const eventId = id.data;
    const userId = req.user!.id;

    const outcome = await db.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`;
        if (locked.length === 0) return { kind: "NOT_FOUND" as const };
        const ev = await tx.event.findUnique({ where: { id: eventId } });
        if (!ev || ev.status !== "PUBLISHED") return { kind: "NOT_FOUND" as const };

        const existing = await tx.registration.findFirst({ where: { eventId, userId } });
        const confirmedCount = await tx.registration.count({ where: { eventId, status: "CONFIRMED" } });
        const decision = decideRegistration({
          capacity: ev.capacity,
          confirmedCount,
          startsAt: ev.startsAt,
          now: new Date(),
          alreadyRegistered: existing !== null,
        });
        if (decision !== "OK") return { kind: decision };

        const reg = await tx.registration.create({ data: { eventId, userId, status: "CONFIRMED" } });
        return { kind: "OK" as const, reg };
      },
      { maxWait: 10000, timeout: 10000 },
    );

    if (outcome.kind === "OK") {
      return res.status(201).json({
        id: outcome.reg.id,
        eventId: outcome.reg.eventId,
        status: outcome.reg.status,
        createdAt: outcome.reg.createdAt,
      });
    }
    if (outcome.kind === "NOT_FOUND") return fail(res, 404, "NOT_FOUND", "Event not found");
    if (outcome.kind === "PAST") return fail(res, 409, "EVENT_IN_PAST", "The event has already started");
    if (outcome.kind === "DUPLICATE") return fail(res, 409, "ALREADY_REGISTERED", "You are already registered for this event");
    return fail(res, 409, "EVENT_FULL", "The event is full");
  } catch (e) {
    return next(e);
  }
});
