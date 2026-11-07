import { z } from "zod";

// BR-01: capacity is an integer between 1 and 10000. Server-owned fields are ignored.
export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  startsAt: z.string().datetime({ offset: true }),
  capacity: z.number().int().min(1).max(10000),
});

// BR-02: an event can only be published if its start date is in the future.
export function canPublish(event: { startsAt: Date }, now: Date): boolean {
  return event.startsAt.getTime() > now.getTime();
}
