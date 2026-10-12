import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Citizen
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@gmail.com' },
    update: {},
    create: {
      email: 'citizen@gmail.com',
      passwordHash,
      fullName: 'Juan Dela Cruz',
      role: 'citizen',
      idType: 'National ID',
      idLast4: '1234',
    },
  });
  console.log(`Created user with id: ${citizen.id} (Role: citizen)`);

  // Seed Admin / LGU Staff
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      passwordHash,
      fullName: 'Maria LGU',
      role: 'admin',
    },
  });
  console.log(`Created user with id: ${admin.id} (Role: admin)`);

  const citizen2 = await prisma.user.upsert({
    where: { email: 'citizen2@gmail.com' },
    update: {},
    create: {
      email: 'citizen2@gmail.com',
      passwordHash,
      fullName: 'Pedro Penduko',
      role: 'citizen',
      idType: 'Driver License',
      idLast4: '5678',
    },
  });
  console.log(`Created user with id: ${citizen2.id} (Role: citizen)`);

  // Clear existing demo data
  await prisma.handoverLog.deleteMany();
  await prisma.userReport.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.reviewAction.deleteMany();
  await prisma.postFlag.deleteMany();
  await prisma.postPrivateDetail.deleteMany();
  await prisma.post.deleteMany();

  // Seed Posts
  const postsData = [
    {
      finderId: citizen.id,
      category: 'Electronics',
      color: 'Black',
      publicDescription: 'Found a black iPhone with a blue case at Rizal Park near the monument.',
      dateFound: new Date(),
      areaFound: 'Rizal Park',
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80',
      privateDetails: { create: { details: 'The iPhone has a crack on the top right corner and the wallpaper is a golden retriever.' } }
    },
    {
      finderId: citizen.id,
      category: 'Wallet/Purse',
      color: 'Brown',
      publicDescription: 'Leather wallet found at the jeepney stop along Taft Avenue.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 1)),
      areaFound: 'Taft Avenue',
      status: 'claim_pending',
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80',
      privateDetails: { create: { details: 'Contains student ID and 500 pesos' } }
    },
    {
      finderId: admin.id,
      category: 'Keys',
      color: 'Silver',
      publicDescription: 'A bunch of keys with a red carabiner left at the City Hall lobby.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 2)),
      areaFound: 'City Hall',
      status: 'returned',
    },
    {
      finderId: citizen.id,
      category: 'Bag/Backpack',
      color: 'Blue',
      publicDescription: 'Navy blue JanSport backpack left on a bench near the university library.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 3)),
      areaFound: 'University Library',
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
      privateDetails: { create: { details: 'Has a calculus textbook and a metal water bottle inside.' } }
    },
    {
      finderId: admin.id,
      category: 'ID/Documents',
      color: 'White',
      publicDescription: 'Company ID badge for a "Tech Solutions Inc" employee found near the coffee shop.',
      dateFound: new Date(),
      areaFound: 'Main Street Coffee Shop',
      status: 'available',
    },
    {
      finderId: citizen2.id,
      category: 'Jewelry',
      color: 'Gold',
      publicDescription: 'Gold watch with a metal band found in the men\'s restroom at the mall.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 5)),
      areaFound: 'Central Mall',
      status: 'returned',
      imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=80',
      privateDetails: { create: { details: 'Casio brand, slightly scratched on the back' } }
    },
    {
      finderId: citizen.id,
      category: 'Electronics',
      color: 'White',
      publicDescription: 'AirPods Pro case (with both earbuds) found on the grass in the quadrangle.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 1)),
      areaFound: 'Campus Quadrangle',
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=400&q=80',
    },
    {
      finderId: admin.id,
      category: 'Clothing',
      color: 'Red',
      publicDescription: 'Red Nike zip-up hoodie left at the gym locker room.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 7)),
      areaFound: 'Community Gym',
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80',
    },
    {
      finderId: citizen2.id,
      category: 'Umbrella',
      color: 'Black',
      publicDescription: 'Large black folding umbrella found on the bus.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 2)),
      areaFound: 'Bus Transit Route 5',
      status: 'available',
    },
    {
      finderId: citizen.id,
      category: 'Glasses',
      color: 'Black',
      publicDescription: 'Prescription reading glasses in a hard case left on a restaurant table.',
      dateFound: new Date(new Date().setDate(new Date().getDate() - 4)),
      areaFound: 'Downtown Diner',
      status: 'claim_pending',
      imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=400&q=80',
    }
  ];

  const createdPosts = [];
  for (const data of postsData) {
    const post = await prisma.post.create({ data });
    createdPosts.push(post);
  }

  // Seed Claims
  const claim1 = await prisma.claim.create({
    data: {
      postId: createdPosts[0].id,
      ownerId: citizen2.id,
      status: 'submitted',
      ownerNote: 'This is my iPhone! I lost it yesterday while jogging. The lock screen is a picture of my dog.'
    }
  });

  const claim2 = await prisma.claim.create({
    data: {
      postId: createdPosts[1].id,
      ownerId: citizen2.id,
      status: 'chat_open',
      ownerNote: 'I lost my brown wallet around Taft. Does it have an ID for Pedro?'
    }
  });
  
  const claim3 = await prisma.claim.create({
    data: {
      postId: createdPosts[9].id, // Glasses
      ownerId: admin.id,
      status: 'approved',
      ownerNote: 'These are my reading glasses. The case has a sticker of a star on it.'
    }
  });

  // Seed Chat
  await prisma.chatThread.create({
    data: {
      claimId: claim2.id,
      status: 'open',
      messages: {
        create: [
          { senderId: citizen2.id, body: 'Hi, I think this wallet is mine. Does it contain an ID named Pedro?' },
          { senderId: admin.id, body: 'Yes it does! Please bring a secondary ID to the City Hall to claim it.', isStaff: true }
        ]
      }
    }
  });
  
  // Seed Handover for returned item
  await prisma.handoverLog.create({
    data: {
      claimId: claim2.id, // Using claim2 for relation purposes even though it's mock
      postId: createdPosts[2].id, // Keys
      adminId: admin.id,
      claimantName: 'Maria LGU',
      claimantIdType: 'Employee ID',
      finderId: admin.id,
      questionsAsked: 'Can you describe the keychain?',
      result: 'approved',
      notes: 'Successfully returned to owner.'
    }
  });

  console.log(`Seeded ${createdPosts.length} Posts, 3 Claims, and Chats.`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
