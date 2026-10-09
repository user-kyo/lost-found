import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, status: true, category: true, reviewedAt: true }
  });
  console.log('All Posts:', posts);
}

main().finally(() => prisma.$disconnect());
