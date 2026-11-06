import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma client for the application.
 * Tests can override DATABASE_URL via the setup file.
 */
export const db = new PrismaClient();
