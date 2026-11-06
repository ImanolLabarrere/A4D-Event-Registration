import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

describe("TEST-214 / AC-212: database rejects capacity <= 0 (BR-01)", () => {
  it("raises a constraint violation on capacity 0", async () => {
    const user = await prisma.user.create({
      data: { email: `t214-${Date.now()}@example.test`, passwordHash: "x", role: "ORGANIZER" },
    });
    await expect(
      prisma.event.create({
        data: { title: "Bad", startsAt: new Date("2027-01-01T10:00:00Z"), capacity: 0, organizerId: user.id },
      }),
    ).rejects.toThrow();
    await prisma.user.delete({ where: { id: user.id } });
  });
});
