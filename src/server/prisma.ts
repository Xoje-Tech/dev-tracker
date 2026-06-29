import { PrismaClient } from "@prisma/client";
import { env } from "./config/env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Enable WAL mode for better SQLite concurrency
async function enableWalMode(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;");
  } catch {
    // WAL mode may already be set or not supported
  }
}

enableWalMode();
