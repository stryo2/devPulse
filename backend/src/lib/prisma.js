import pkg from "@prisma/client";

const { PrismaClient } = pkg;

// Without the global, every nodemon restart leaks a connection pool.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

globalForPrisma.prisma = prisma;

export default prisma;
