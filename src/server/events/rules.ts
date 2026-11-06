import { z } from "zod";

// STUB (red phase): intentionally wrong, replaced in the green commit.
export const createEventSchema = z.object({});

export function canPublish(_event: { startsAt: Date }, _now: Date): boolean {
  return false;
}
