import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma único por proceso.
 * Prisma 7 requiere un driver adapter: PrismaPg sobre `pg`.
 * Ver docs/06-arquitectura-tecnica.md.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Evita crear múltiples pools de conexiones con el hot-reload de Next.js
  globalForPrisma.prisma = prisma;
}
