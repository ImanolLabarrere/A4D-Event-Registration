import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password) {
    throw new Error("SEED_PASSWORD is not set (see .env.example)");
  }
  const passwordHash = await argon2.hash(password);

  // Le seed est rejouable : on repart d'une base de démo propre.
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

  console.log("Seed OK : 2 organisateurs, " + participants.length + " participants, 4 evenements.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
