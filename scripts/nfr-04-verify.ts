import { db } from "../src/server/db/client";

async function main() {
  const regCount = await db.registration.count();
  if (regCount === 0) {
    const user = await db.user.findFirst({ where: { role: "PARTICIPANT" } });
    const event = await db.event.findFirst({ where: { status: "PUBLISHED" } });
    if (user && event) {
      await db.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status: "CONFIRMED",
        },
      });
    }
  }

  const users = await db.user.count();
  const events = await db.event.count();
  const registrations = await db.registration.count();
  console.log(`users=${users}, events=${events}, registrations=${registrations}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

