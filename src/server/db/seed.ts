import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const password = process.env.SEED_PASSWORD ?? process.env.ADMIN_PASSWORD ?? process.env.DEMO_USER_PASSWORD;
  if (!password) {
    throw new Error("SEED_PASSWORD is not set (see .env.example)");
  }

  // Guard: if database already contains data and FORCE_SEED is not true, do not wipe
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`Database already seeded (${existingUserCount} users present). Skipping seed to preserve data.`);
    return;
  }

  const passwordHash = await argon2.hash(password);

  // Safe replay when empty or when FORCE_SEED=true
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const org1 = await prisma.user.create({
    data: { email: "organizer1@example.test", passwordHash, role: "ORGANIZER" },
  });
  const org2 = await prisma.user.create({
    data: { email: "organizer2@example.test", passwordHash, role: "ORGANIZER" },
  });
  const participants = [];
  for (const n of [1, 2, 3]) {
    participants.push(
      await prisma.user.create({
        data: { email: "participant" + n + "@example.test", passwordHash, role: "PARTICIPANT" },
      }),
    );
  }

  const now = Date.now();
  await prisma.event.createMany({
    data: [
      { title: "Atelier Git (publie)", startsAt: new Date(now + 14 * DAY), capacity: 2, status: "PUBLISHED", organizerId: org1.id },
      { title: "Conference IA (brouillon)", startsAt: new Date(now + 30 * DAY), capacity: 50, status: "DRAFT", organizerId: org1.id },
      { title: "Hackathon (publie)", startsAt: new Date(now + 21 * DAY), capacity: 30, status: "PUBLISHED", organizerId: org2.id },
      { title: "Seminaire securite (brouillon)", startsAt: new Date(now + 40 * DAY), capacity: 20, status: "DRAFT", organizerId: org2.id },
    ],
  });

  console.log("Seed OK: 2 organizers, " + participants.length + " participants, 4 events.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
