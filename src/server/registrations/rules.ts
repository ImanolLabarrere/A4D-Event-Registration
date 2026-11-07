export type RegistrationDecision = "OK" | "PAST" | "DUPLICATE" | "FULL";

// Precedence: PAST (BR-05) > DUPLICATE (BR-03) > FULL (BR-04).
export function decideRegistration(input: {
  capacity: number;
  confirmedCount: number;
  startsAt: Date;
  now: Date;
  alreadyRegistered: boolean;
}): RegistrationDecision {
  if (input.startsAt.getTime() <= input.now.getTime()) return "PAST";
  if (input.alreadyRegistered) return "DUPLICATE";
  if (input.confirmedCount >= input.capacity) return "FULL";
  return "OK";
}
