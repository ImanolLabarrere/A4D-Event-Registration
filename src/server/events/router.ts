import { Router } from "express";
import { db } from "../db/client";
import { requireAuth, requireRole } from "../auth/middleware";
import { computeRemainingPlaces } from "./browse";

export const eventsRouter = Router();

// All event routes require authentication
eventsRouter.use(requireAuth);

// ---------------------------------------------------------------------------
// Shape helper — strips private fields
// ---------------------------------------------------------------------------
function formatEvent(event: {
  id: string;
  title: string;
  startsAt: Date;
  capacity: number;
  status: string;
  registrations: { status: string }[];
}) {
  const confirmedCount = event.registrations.filter((r) => r.status === "CONFIRMED").length;
  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    capacity: event.capacity,
    status: event.status,
    confirmedCount,
    remainingPlaces: computeRemainingPlaces(event.capacity, confirmedCount),
  };
}

const withRegistrations = {
  registrations: { where: { status: "CONFIRMED" }, select: { status: true } },
} as const;

// ---------------------------------------------------------------------------
// GET /api/events/mine — organizer only, all own events (draft included)
// MUST be declared before /:id to avoid being shadowed
// ---------------------------------------------------------------------------
eventsRouter.get("/mine", requireRole("ORGANIZER"), async (req, res) => {
  const events = await db.event.findMany({
    where: { organizerId: req.user!.id },
    orderBy: { startsAt: "asc" },
    include: withRegistrations,
  });
  res.json(events.map(formatEvent));
});

// ---------------------------------------------------------------------------
// GET /api/events — authenticated users, future published events only
// ---------------------------------------------------------------------------
eventsRouter.get("/", async (req, res) => {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
    include: withRegistrations,
  });
  res.json(events.map(formatEvent));
});

// ---------------------------------------------------------------------------
// GET /api/events/:id — authenticated users
// Draft: visible only to its owner organizer; anyone else gets 404 (BR-06)
// ---------------------------------------------------------------------------
eventsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const event = await db.event.findUnique({ where: { id }, include: withRegistrations });

  if (!event) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
    return;
  }

  if (event.status === "DRAFT") {
    // A draft is only visible to its own organizer
    if (req.user!.role !== "ORGANIZER" || event.organizerId !== req.user!.id) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Event not found." } });
      return;
    }
  }

  res.json(formatEvent(event));
});

