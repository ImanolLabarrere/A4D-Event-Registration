// STUB (red phase): intentionally wrong, replaced in the green commit.
export type RegistrationDecision = "OK" | "PAST" | "DUPLICATE" | "FULL";

export function decideRegistration(_input: {
  capacity: number;
  confirmedCount: number;
  startsAt: Date;
  now: Date;
  alreadyRegistered: boolean;
}): RegistrationDecision {
  return "OK";
}
