import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Returning null-ish via Proxy would complicate types; instead,
    // throw on first use so callers can surface a clear error.
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        throw new Error(
          `Cannot use prisma.${String(prop)} — DATABASE_URL is not set. ` +
            `Add it to .env and run \`bunx prisma migrate dev\`.`,
        );
      },
    });
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
