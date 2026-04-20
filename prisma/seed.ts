import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "[seed] DATABASE_URL is not set. Run migrations with a real database first.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  // Start the seller store-id counter at 100.
  // Safe to run repeatedly; RESTART only takes effect on the next nextval().
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "User_storeId_seq" RESTART WITH 100`,
  );
  console.log("[seed] User_storeId_seq restarted at 100");
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
