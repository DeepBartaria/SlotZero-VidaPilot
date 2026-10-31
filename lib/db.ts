import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton for Next.js.
 * Prevents multiple instances of Prisma Client in development due to hot reloading.
 *
 * Usage anywhere in server code / route handlers / server actions:
 *   import { db } from '@/lib/db';
 *   const users = await db.user.findMany();
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
