import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany();
  const postFound = posts.find(p => p.id.includes('1a75d3'));
  console.log(postFound ? 'Found post: ' + JSON.stringify(postFound) : 'Post not found in DB');

  const claims = await prisma.claim.findMany();
  const claimFound = claims.find(c => c.id.includes('1a75d3'));
  console.log(claimFound ? 'Found claim: ' + JSON.stringify(claimFound) : 'Claim not found in DB');
}

main().finally(() => prisma.$disconnect());
