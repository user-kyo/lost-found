/**
 * Test script for Step 5: High-Priority Database Schema Updates
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:3000/api';

async function runTests() {
  console.log('====================================================');
  console.log('TESTING STEP 5: HIGH-PRIORITY DATABASE SCHEMA UPDATES');
  console.log('====================================================\n');

  // --- STAGE 1: Schema Table Verification in SQLite ---
  console.log('--- STAGE 1: SQLite Table Renames & Existence ---');
  const tableRows = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tableRows.map(t => t.name.toLowerCase());
  console.log('Existing tables in SQLite:', tableNames.join(', '));

  // Check Removed Tables
  const removedTables = ['chat_threads', 'chat_messages', 'user_reports', 'user_blocks'];
  for (const table of removedTables) {
    const exists = tableNames.includes(table);
    if (!exists) {
      console.log(`✔ REMOVED TABLE CONFIRMED: '${table}' does not exist.`);
    } else {
      throw new Error(`FAILED: Table '${table}' should have been removed!`);
    }
  }

  // Check Renamed Tables
  const renamedTables = ['items', 'item_private_details', 'item_flags', 'releases'];
  for (const table of renamedTables) {
    const exists = tableNames.includes(table);
    if (exists) {
      console.log(`✔ RENAMED TABLE CONFIRMED: '${table}' exists in DB.`);
    } else {
      throw new Error(`FAILED: Table '${table}' does not exist!`);
    }
  }

  // Check New Tables
  const newTables = ['finders', 'claim_verifications', 'disposition_cases', 'item_status_history', 'documents'];
  for (const table of newTables) {
    const exists = tableNames.includes(table);
    if (exists) {
      console.log(`✔ NEW TABLE CONFIRMED: '${table}' exists in DB.`);
    } else {
      throw new Error(`FAILED: Table '${table}' does not exist!`);
    }
  }

  // --- STAGE 2: Items Table New Fields Verification ---
  console.log('\n--- STAGE 2: Items Table New Fields Verification ---');
  const itemCols = await prisma.$queryRawUnsafe("PRAGMA table_info('items')");
  const itemColNames = itemCols.map(c => c.name);
  console.log('Columns in items table:', itemColNames.join(', '));

  const expectedNewFields = [
    'control_no',
    'received_at',
    'received_by',
    'finder_id',
    'special_handling_type',
    'storage_location',
    'school_holding_end_date',
    'city_publication_date',
    'earliest_award_date',
    'final_disposition'
  ];

  for (const field of expectedNewFields) {
    if (itemColNames.includes(field)) {
      console.log(`✔ NEW FIELD CONFIRMED: items.${field} exists.`);
    } else {
      throw new Error(`FAILED: Field '${field}' is missing from items table!`);
    }
  }

  // --- STAGE 3: API Workflows - Auth & Staff Intake ---
  console.log('\n--- STAGE 3: Auth & Intake with Finder and New Fields ---');
  // 1. Login as Guidance Encoder
  const encoderLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'encoder@guidance.edu', password: 'password123' })
  });
  const encoderAuth = await encoderLoginRes.json();
  const encoderToken = encoderAuth.token;
  console.log('Logged in as Guidance Encoder:', encoderAuth.user.fullName);

  // 2. Intake found item with manual finder info
  const testControlNo = `CTRL-2026-TEST-${Date.now().toString().slice(-4)}`;
  const intakePayload = {
    control_no: testControlNo,
    category: 'Electronics',
    color: 'Midnight Blue',
    publicDescription: 'Samsung Galaxy Tab S9 FE with S-Pen attached found at Gymnasium bleachers.',
    dateFound: new Date().toISOString(),
    areaFound: 'School Gymnasium Section B',
    condition: 'Good',
    estimatedValueBand: 'Valuable (> ₱10,000)',
    specialHandlingType: 'High-Value Electronics',
    storageLocation: 'Guidance Safe - Slot E2',
    finderName: 'Elena Rostova',
    finderContact: '09194445566',
    finderType: 'Visitor',
    finderNotes: 'Guest speaker at career day event.',
    privateDetails: 'Lock screen is a watercolor mountain landscape. S-Pen has a small rubber grip.'
  };

  const createItemRes = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${encoderToken}`
    },
    body: JSON.stringify(intakePayload)
  });
  const createdData = await createItemRes.json();
  if (!createItemRes.ok) throw new Error(`Create item failed: ${JSON.stringify(createdData)}`);
  
  const createdItem = createdData.item || createdData.post;
  console.log('✔ Item created successfully with ID:', createdItem.id);
  console.log('  - Control No:', createdItem.control_no);
  console.log('  - Special Handling:', createdItem.special_handling_type);
  console.log('  - Storage Location:', createdItem.storage_location);
  console.log('  - Received At:', createdItem.received_at);
  console.log('  - School Holding End Date:', createdItem.school_holding_end_date);
  console.log('  - Finder ID:', createdItem.finder_id);
  console.log('  - Finder Name:', createdItem.finderName);

  if (!createdItem.control_no || !createdItem.finder_id) {
    throw new Error('FAILED: control_no or finder_id not properly populated on item!');
  }

  // --- STAGE 4: Finders Endpoint & DB Verification ---
  console.log('\n--- STAGE 4: Finder Secure Storage Verification ---');
  const findersRes = await fetch(`${API_BASE}/finders`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const finders = await findersRes.json();
  const matchedFinder = finders.find(f => f.name === 'Elena Rostova');
  if (matchedFinder) {
    console.log('✔ Finder securely recorded in finders table:', matchedFinder.name, `(${matchedFinder.type})`);
  } else {
    throw new Error('FAILED: Finder Elena Rostova not found in finders table!');
  }

  // --- STAGE 5: Status Transitions & item_status_history Audit Trail ---
  console.log('\n--- STAGE 5: Status Transitions & Audit Trail ---');
  // 1. Verify item
  const verifyRes = await fetch(`${API_BASE}/admin/items/${createdItem.id}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${encoderToken}`
    },
    body: JSON.stringify({ note: 'Physical tablet inspected and serial recorded.' })
  });
  const verifiedData = await verifyRes.json();
  console.log('✔ Item verified, status:', verifiedData.item.status);

  // 2. Publish item
  const publishRes = await fetch(`${API_BASE}/admin/items/${createdItem.id}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${encoderToken}`
    },
    body: JSON.stringify({ note: 'Item published to bulletin.' })
  });
  const publishedData = await publishRes.json();
  console.log('✔ Item published, city_publication_date:', publishedData.item.city_publication_date);
  console.log('  Earliest award date (+6 mos):', publishedData.item.earliest_award_date);

  // 3. Check item_status_history endpoint
  const historyRes = await fetch(`${API_BASE}/items/${createdItem.id}/history`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const history = await historyRes.json();
  console.log(`✔ Status history audit trail contains ${history.length} events:`);
  history.forEach(h => {
    console.log(`  - [${h.createdAt.slice(11, 19)}] ${h.fromStatus || 'NULL'} -> ${h.toStatus} (${h.reason}) by ${h.changer?.fullName}`);
  });

  if (history.length < 3) {
    throw new Error('FAILED: Expected at least 3 status history entries (received, verified, published)!');
  }

  // --- STAGE 6: Claim, Verification, Release & Documents ---
  console.log('\n--- STAGE 6: Claim, Verification, Release, & Documents ---');
  // 1. Login as Student
  const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@school.edu', password: 'password123' })
  });
  const studentAuth = await studentLoginRes.json();
  const studentToken = studentAuth.token;

  // 2. Submit Claim
  const claimRes = await fetch(`${API_BASE}/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      itemId: createdItem.id,
      proofDetails: 'This is my Samsung Tab S9 FE. The lock screen is watercolor mountains and S-Pen has a green rubber grip.'
    })
  });
  const claimData = await claimRes.json();
  console.log('✔ Claim submitted with ID:', claimData.claim.id);

  // 3. Add Claim Verification record
  const verifRes = await fetch(`${API_BASE}/claims/${claimData.claim.id}/verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${encoderToken}`
    },
    body: JSON.stringify({
      verificationType: 'interview_and_unlock',
      questionsAnswers: { lockScreenDescription: 'Watercolor mountains', sPenGrip: 'Green rubber grip' },
      idTypePresented: 'University Student ID',
      idNumberLast4: '0101',
      status: 'passed',
      notes: 'Student correctly recited distinguishing features and unlocked tablet.'
    })
  });
  const verifData = await verifRes.json();
  console.log('✔ Claim verification check recorded in claim_verifications table:', verifData.verification.id);

  // 4. Release item to student
  const releaseRes = await fetch(`${API_BASE}/admin/claims/${claimData.claim.id}/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${encoderToken}`
    },
    body: JSON.stringify({
      recipientName: 'Juan Dela Cruz',
      recipientSchoolId: '2024-00101',
      idTypePresented: 'University Student ID',
      idNumber: '2024-00101',
      acknowledgmentConfirmed: true,
      acknowledgmentNote: 'Physical possession received in pristine condition.'
    })
  });
  const releaseData = await releaseRes.json();
  console.log('✔ Official release executed, Release ID:', releaseData.log.id);
  console.log('  Item final status:', releaseData.item.status);

  // 5. Verify Scanned Waiver Document in documents table
  const docsRes = await fetch(`${API_BASE}/items/${createdItem.id}/documents`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const docs = await docsRes.json();
  console.log(`✔ Documents table contains ${docs.length} attached document(s):`);
  docs.forEach(d => {
    console.log(`  - Type: ${d.documentType}, File: ${d.fileName}, URL: ${d.fileUrl}`);
  });

  if (docs.length === 0) {
    throw new Error('FAILED: Expected scanned release waiver document in documents table!');
  }

  console.log('\n====================================================');
  console.log('ALL STEP 5 SCHEMA UPDATE REQUIREMENTS VERIFIED 100%!');
  console.log('====================================================');
}

runTests()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
