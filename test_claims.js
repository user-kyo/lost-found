import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const claims = await prisma.claim.findMany();
  console.log('All claims in DB:', claims);
}

main().finally(() => prisma.$disconnect());
