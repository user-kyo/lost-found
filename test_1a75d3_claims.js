import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const claims = await prisma.claim.findMany();
  const claimsForPost = claims.filter(c => c.postId.includes('1a75d3'));
  console.log('Claims for post 1a75d3:', claimsForPost);
}

main().finally(() => prisma.$disconnect());
