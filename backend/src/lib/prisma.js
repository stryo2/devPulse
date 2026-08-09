import pkg from "@prisma/client";

const { PrismaClient } = pkg;

// nodemon re-imports this module on every restart; without the global each
// restart would leak another connection pool.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

globalForPrisma.prisma = prisma;

export default prisma;
