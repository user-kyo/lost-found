import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const availablePosts = await prisma.post.findMany({
    where: { status: 'available' },
    select: { id: true, category: true, color: true, publicDescription: true, dateFound: true, areaFound: true }
  });
  console.log(availablePosts);
}

main().finally(() => prisma.$disconnect());
