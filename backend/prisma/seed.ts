import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BalikHub Guidance Office Lost & Found System (New Schema)...');

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error('SECURITY VIOLATION: Seeding test accounts with default passwords is strictly prohibited in production.');
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Accounts for all 5 approved roles:
  // - claimant
  // - guidance_encoder
  // - guidance_head
  // - school_administrator
  // - system_admin

  const student = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {
      role: 'claimant',
      userType: 'student',
      schoolId: '2024-00101',
      fullName: 'Juan Dela Cruz (Student / Claimant)'
    },
    create: {
      email: 'student@school.edu',
      passwordHash,
      fullName: 'Juan Dela Cruz (Student / Claimant)',
      role: 'claimant',
      userType: 'student',
      schoolId: '2024-00101',
      phone: '09171234567'
    },
  });

  const encoder = await prisma.user.upsert({
    where: { email: 'encoder@guidance.edu' },
    update: {
      role: 'guidance_encoder',
      userType: 'guidance',
      schoolId: 'EMP-2022-088',
      fullName: 'Clara Reyes (Guidance Encoder)'
    },
    create: {
      email: 'encoder@guidance.edu',
      passwordHash,
      fullName: 'Clara Reyes (Guidance Encoder)',
      role: 'guidance_encoder',
      userType: 'guidance',
      schoolId: 'EMP-2022-088',
      phone: '09201112233'
    },
  });

  const guidanceHead = await prisma.user.upsert({
    where: { email: 'head@guidance.edu' },
    update: {
      role: 'guidance_head',
      userType: 'guidance',
      schoolId: 'EMP-2018-005',
      fullName: 'Dr. Maria Elena Santos (Guidance Head)'
    },
    create: {
      email: 'head@guidance.edu',
      passwordHash,
      fullName: 'Dr. Maria Elena Santos (Guidance Head)',
      role: 'guidance_head',
      userType: 'guidance',
      schoolId: 'EMP-2018-005',
      phone: '09185556677'
    },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'schooladmin@school.edu' },
    update: {
      role: 'school_administrator',
      userType: 'admin',
      schoolId: 'ADM-2015-012',
      fullName: 'Engr. Roberto D. Lim (School Administrator)'
    },
    create: {
      email: 'schooladmin@school.edu',
      passwordHash,
      fullName: 'Engr. Roberto D. Lim (School Administrator)',
      role: 'school_administrator',
      userType: 'admin',
      schoolId: 'ADM-2015-012',
      phone: '09173334455'
    },
  });

  const systemAdmin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {
      role: 'system_admin',
      userType: 'admin',
      schoolId: 'ADM-2020-001',
      fullName: 'System Administrator (Technical Admin)'
    },
    create: {
      email: 'admin@school.edu',
      passwordHash,
      fullName: 'System Administrator (Technical Admin)',
      role: 'system_admin',
      userType: 'admin',
      schoolId: 'ADM-2020-001',
      phone: '09190001122'
    },
  });

  console.log('Seeded accounts for all 5 approved roles:');
  console.log('- Claimant:             student@school.edu (ID: 2024-00101)');
  console.log('- Guidance Encoder:     encoder@guidance.edu (ID: EMP-2022-088)');
  console.log('- Guidance Head:        head@guidance.edu (ID: EMP-2018-005)');
  console.log('- School Administrator: schooladmin@school.edu (ID: ADM-2015-012)');
  console.log('- System Admin:         admin@school.edu (ID: ADM-2020-001)');

  const itemCount = await prisma.item.count();
  if (itemCount > 0) {
    console.log(`Preserving existing database contents (${itemCount} items found). Skipping item wipe.`);
    return;
  }

  // 3. Seed Finders (securely storing finder info without requiring user accounts)
  const finderMaria = await prisma.finder.create({
    data: {
      name: 'Maria Santos',
      type: 'student',
      schoolId: '2023-04921',
      contactNumber: '09181112233',
      email: 'maria.santos@student.school.edu',
      department: 'College of Computer Studies',
      notes: 'Surrendered item immediately after 2nd period class.'
    }
  });

  const finderSecurity = await prisma.finder.create({
    data: {
      name: 'Officer Rodrigo Dalisay',
      type: 'staff',
      schoolId: 'SEC-2021-014',
      contactNumber: '09228889900',
      department: 'Campus Security & Safety Division',
      notes: 'Found during routine evening campus perimeter inspection.'
    }
  });

  const finderVisitor = await prisma.finder.create({
    data: {
      name: 'Arthur Pendelton',
      type: 'visitor',
      contactNumber: '09175554321',
      notes: 'Parent attending parent-teacher orientation.'
    }
  });

  // 4. Seed Items Recorded by Guidance Encoder
  const now = new Date();
  const dayMs = 86400000;

  // Item 1: MacBook Air (claim pending for student)
  const receivedAt1 = new Date(now.getTime() - dayMs * 5);
  const holdingEnd1 = new Date(receivedAt1.getTime() + dayMs * 60);
  const pubDate1 = new Date(receivedAt1.getTime() + dayMs * 1);
  const awardDate1 = new Date(pubDate1);
  awardDate1.setMonth(awardDate1.getMonth() + 6);

  const item1 = await prisma.item.create({
    data: {
      control_no: 'CTRL-2026-0001',
      received_at: receivedAt1,
      received_by: encoder.id,
      finder_id: finderMaria.id,
      special_handling_type: 'High-Value Electronics',
      storage_location: 'Guidance Safe - Vault Shelf A',
      school_holding_end_date: holdingEnd1,
      city_publication_date: pubDate1,
      earliest_award_date: awardDate1,
      encoderId: encoder.id,
      category: 'Electronics',
      color: 'Space Gray',
      publicDescription: 'Apple MacBook Air 13-inch found on the 2nd floor library study table.',
      dateFound: new Date(now.getTime() - dayMs * 5),
      areaFound: 'College Library - 2nd Floor Study Area',
      status: 'claim_pending',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      privateDetails: {
        create: {
          details: JSON.stringify({
            condition: 'Good',
            estimatedValueBand: 'Valuable (> ₱10,000)',
            specialHandlingType: 'High-Value Electronics',
            storageLocation: 'Guidance Safe - Vault Shelf A',
            finderName: finderMaria.name,
            finderContact: finderMaria.contactNumber,
            finderType: finderMaria.type,
            privateVerificationDetails: 'Serial number C02XG4... Has an anime sticker (Demon Slayer) on bottom chassis.'
          })
        }
      }
    }
  });

  // Track status history for Item 1
  await prisma.itemStatusHistory.createMany({
    data: [
      {
        itemId: item1.id,
        fromStatus: null,
        toStatus: 'received',
        changedBy: encoder.id,
        reason: 'Item surrendered to Guidance desk and logged.'
      },
      {
        itemId: item1.id,
        fromStatus: 'received',
        toStatus: 'verified',
        changedBy: encoder.id,
        reason: 'Physical inspection completed and serial recorded.'
      },
      {
        itemId: item1.id,
        fromStatus: 'verified',
        toStatus: 'published',
        changedBy: encoder.id,
        reason: 'Published to school lost & found bulletin.'
      },
      {
        itemId: item1.id,
        fromStatus: 'published',
        toStatus: 'claim_pending',
        changedBy: student.id,
        reason: 'Claim submitted by Juan Dela Cruz.'
      }
    ]
  });

  // Claim for Item 1
  const claim1 = await prisma.claim.create({
    data: {
      itemId: item1.id,
      claimantId: student.id,
      status: 'under_verification',
      proofDetails: 'This is my laptop. I can recite the serial number and describe the Demon Slayer sticker on the bottom.',
      processedBy: encoder.fullName
    }
  });

  // Claim Verification for Item 1
  await prisma.claimVerification.create({
    data: {
      claimId: claim1.id,
      verifiedBy: encoder.id,
      verificationType: 'physical_match',
      questionsAnswers: JSON.stringify({
        q1: 'What sticker is on the bottom of the laptop?',
        a1: 'Demon Slayer (Tanjiro)',
        q2: 'What is the serial number prefix?',
        a2: 'C02XG4'
      }),
      idTypePresented: 'University Student ID',
      idNumberLast4: '0101',
      status: 'passed',
      notes: 'Claimant answers match private details 100%.'
    }
  });

  // Item 2: iPhone 13 (published)
  const receivedAt2 = new Date(now.getTime() - dayMs * 3);
  const holdingEnd2 = new Date(receivedAt2.getTime() + dayMs * 60);
  const pubDate2 = new Date(receivedAt2.getTime() + dayMs * 1);
  const awardDate2 = new Date(pubDate2);
  awardDate2.setMonth(awardDate2.getMonth() + 6);

  await prisma.item.create({
    data: {
      control_no: 'CTRL-2026-0002',
      received_at: receivedAt2,
      received_by: encoder.id,
      finder_id: finderSecurity.id,
      special_handling_type: 'High-Value Electronics',
      storage_location: 'Locker B - Slot 04',
      school_holding_end_date: holdingEnd2,
      city_publication_date: pubDate2,
      earliest_award_date: awardDate2,
      encoderId: encoder.id,
      category: 'Electronics',
      color: 'Black',
      publicDescription: 'Black iPhone 13 with clear silicone case surrendered at the Guidance Office, found near Gymnasium bleachers.',
      dateFound: new Date(now.getTime() - dayMs * 3),
      areaFound: 'School Gymnasium Bleachers',
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80',
      privateDetails: {
        create: {
          details: JSON.stringify({
            condition: 'Good',
            estimatedValueBand: 'Valuable (> ₱10,000)',
            specialHandlingType: 'High-Value Electronics',
            storageLocation: 'Locker B - Slot 04',
            finderName: finderSecurity.name,
            finderContact: finderSecurity.contactNumber,
            finderType: finderSecurity.type,
            privateVerificationDetails: 'Lock screen wallpaper is a golden retriever puppy. Slight crack on upper glass protector.'
          })
        }
      }
    }
  });

  // Item 3: Leather Wallet (Lapsed Holding Period, eligible for disposition)
  const receivedAt3 = new Date(now.getTime() - dayMs * 65); // 65 days ago, lapsed!
  const holdingEnd3 = new Date(receivedAt3.getTime() + dayMs * 60);
  const pubDate3 = new Date(receivedAt3.getTime() + dayMs * 2);
  const awardDate3 = new Date(pubDate3);
  awardDate3.setMonth(awardDate3.getMonth() + 6);

  const item3 = await prisma.item.create({
    data: {
      control_no: 'CTRL-2026-0003',
      received_at: receivedAt3,
      received_by: encoder.id,
      finder_id: finderVisitor.id,
      special_handling_type: 'Cash / Currency',
      storage_location: 'Guidance Safe - Drawer 1',
      school_holding_end_date: holdingEnd3,
      city_publication_date: pubDate3,
      earliest_award_date: awardDate3,
      encoderId: encoder.id,
      category: 'Wallets & Bags',
      color: 'Brown',
      publicDescription: 'Brown leather bi-fold wallet found in Audio-Visual Room (AVR 1).',
      dateFound: new Date(now.getTime() - dayMs * 66),
      areaFound: 'AVR 1 - 3rd Floor Main Building',
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80',
      privateDetails: {
        create: {
          details: JSON.stringify({
            condition: 'Good',
            estimatedValueBand: 'Medium (₱500 - ₱2,000)',
            specialHandlingType: 'Cash / Currency',
            storageLocation: 'Guidance Safe - Drawer 1',
            finderName: finderVisitor.name,
            finderContact: finderVisitor.contactNumber,
            finderType: finderVisitor.type,
            privateVerificationDetails: 'Contains student beep card and 350 pesos cash. No formal government ID.'
          })
        }
      }
    }
  });

  // Disposition Case for Item 3
  await prisma.dispositionCase.create({
    data: {
      itemId: item3.id,
      targetDisposition: 'donated',
      status: 'draft',
      checklistCompleted: false,
      checklist: JSON.stringify({
        physical_inventory_audit: true,
        claim_absence_certified: true,
        notice_posted: true,
        recipient_identified: false,
        property_affidavit_attached: false
      }),
      holdingClockSnapshot: JSON.stringify({
        receivedAt: receivedAt3.toISOString(),
        schoolHoldingDeadline: holdingEnd3.toISOString(),
        isSchoolHoldingLapsed: true
      })
    }
  });

  console.log('Seeding completed successfully with new schema tables & fields!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
