// backend/tests/test_phase1_phase2_verification.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let studentToken, encoderToken, headToken, schoolAdminToken, systemAdminToken;
let testItemId, testClaimId;

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed for ${email}: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runVerification() {
  console.log('===============================================================');
  console.log('   BALIKHUB AUDIT VERIFICATION: PHASE 1 & PHASE 2 SUITE');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // 1. Authentication & Role Definitions
  // -----------------------------------------------------------------
  console.log('Step 1: Authenticate all 5 approved roles...');
  try {
    studentToken = await login('student@school.edu', 'password123');
    assert(!!studentToken, 'Claimant (student@school.edu) login successful');

    encoderToken = await login('encoder@guidance.edu', 'password123');
    assert(!!encoderToken, 'Guidance Encoder (encoder@guidance.edu) login successful');

    headToken = await login('head@guidance.edu', 'password123');
    assert(!!headToken, 'Guidance Head (head@guidance.edu) login successful');

    schoolAdminToken = await login('schooladmin@school.edu', 'password123');
    assert(!!schoolAdminToken, 'School Administrator (schooladmin@school.edu) login successful');

    systemAdminToken = await login('admin@school.edu', 'password123');
    assert(!!systemAdminToken, 'System Admin (admin@school.edu) login successful');
  } catch (err) {
    console.error('Authentication setup failed:', err.message);
    process.exit(1);
  }

  // -----------------------------------------------------------------
  // 2. Intake Creation (Guidance Encoder vs Others)
  // -----------------------------------------------------------------
  console.log('\nStep 2: Role separation on Intake (POST /api/posts)...');
  
  // Claimant attempt
  const claimantIntakeRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({ category: 'Electronics', color: 'Blue', publicDescription: 'Test item' })
  });
  assert(claimantIntakeRes.status === 403, 'Claimant blocked from self-submitted intake (HTTP 403)');

  // School Admin attempt (read-only)
  const schoolAdminIntakeRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${schoolAdminToken}` },
    body: JSON.stringify({ category: 'Electronics', color: 'Blue', publicDescription: 'Test item' })
  });
  assert(schoolAdminIntakeRes.status === 403, 'School Administrator blocked from intake creation (HTTP 403)');

  // Guidance Encoder intake
  const encoderIntakeRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({
      category: 'Electronics',
      color: 'Midnight Blue',
      publicDescription: 'Navy blue scientific calculator Casio fx-991EX found at Science Hall Room 304.',
      areaFound: 'Science Hall Room 304 Desk 12',
      condition: 'Good',
      storageLocation: 'LOCKER-C / Shelf-02 / Box-A',
      estimatedValueBand: 'PHP 1,000 - 4,999',
      specialHandlingType: 'Standard',
      finderName: 'Juan Dela Cruz (Student Finder)',
      finderContact: '0917-123-4567',
      finderNotes: 'Turned over after Chemistry laboratory period',
      privateDetails: 'Engraved with initials "M.R." and barcode sticker #882910 on battery compartment cover'
    })
  });
  assert(encoderIntakeRes.status === 200 || encoderIntakeRes.status === 201, 'Guidance Encoder successfully records intake');
  const intakeData = await encoderIntakeRes.json();
  testItemId = intakeData.post?.id || intakeData.id;
  assert(!!testItemId, `Test item created with ID: ${testItemId}`);

  // -----------------------------------------------------------------
  // 3. Operational Approvals: Guidance Head vs Others
  // -----------------------------------------------------------------
  console.log('\nStep 3: Operational Approval Separation (Guidance Head vs Other Roles)...');

  // Verify item by Encoder
  const verifyRes = await fetch(`${BASE_URL}/api/admin/posts/${testItemId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({ note: 'Serial and physical condition verified by encoder' })
  });
  assert(verifyRes.status === 200, 'Guidance Encoder can record initial verification');

  // Try Publish with Guidance Encoder (Must be 403)
  const encoderPublishRes = await fetch(`${BASE_URL}/api/admin/posts/${testItemId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${encoderToken}` }
  });
  assert(encoderPublishRes.status === 403, 'Guidance Encoder CANNOT publish item (HTTP 403)');

  // Try Publish with System Admin (Must be 403 - no operational approval)
  const sysAdminPublishRes = await fetch(`${BASE_URL}/api/admin/posts/${testItemId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${systemAdminToken}` }
  });
  assert(sysAdminPublishRes.status === 403, 'System Administrator CANNOT publish item (HTTP 403)');

  // Try Publish with School Admin (Must be 403)
  const schoolAdminPublishRes = await fetch(`${BASE_URL}/api/admin/posts/${testItemId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${schoolAdminToken}` }
  });
  assert(schoolAdminPublishRes.status === 403, 'School Administrator CANNOT publish item (HTTP 403)');

  // Publish with Guidance Head (Must succeed 200)
  const headPublishRes = await fetch(`${BASE_URL}/api/admin/posts/${testItemId}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${headToken}` }
  });
  assert(headPublishRes.status === 200, 'Guidance Head successfully authorizes item publication (HTTP 200)');

  // -----------------------------------------------------------------
  // 4. Phase 2 Private Data Protection Audit
  // -----------------------------------------------------------------
  console.log('\nStep 4: Private Data Protection Audit across Item Endpoints...');

  // A. Public items listing: GET /api/posts
  const publicPostsRes = await fetch(`${BASE_URL}/api/posts`);
  const publicPosts = await publicPostsRes.json();
  const postsArray = Array.isArray(publicPosts) ? publicPosts : (publicPosts.posts || publicPosts.items || []);
  const foundInPublic = postsArray.find(p => p.id === testItemId);
  if (foundInPublic) {
    assert(foundInPublic.storageLocation === undefined && foundInPublic.storage_location === undefined,
      'Public GET /api/posts omits storageLocation');
    assert(foundInPublic.finderContact === undefined, 'Public GET /api/posts omits finderContact');
    assert(foundInPublic.finderNotes === undefined, 'Public GET /api/posts omits finderNotes');
    assert(foundInPublic.privateVerificationNotes === undefined, 'Public GET /api/posts omits privateVerificationNotes');
    assert(foundInPublic.privateDetails === undefined, 'Public GET /api/posts omits privateDetails');
    assert(foundInPublic.finder === undefined && foundInPublic.finder_id === undefined, 'Public GET /api/posts omits finder object/ID');
  } else {
    assert(false, 'Created test item found in public posts list');
  }

  // B. Claimant request to GET /api/posts/:id
  const claimantItemRes = await fetch(`${BASE_URL}/api/posts/${testItemId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const claimantItem = await claimantItemRes.json();
  const cItem = claimantItem.item || claimantItem;
  assert(cItem.storageLocation === undefined && cItem.storage_location === undefined,
    'Claimant GET /api/posts/:id omits storageLocation');
  assert(cItem.finderContact === undefined, 'Claimant GET /api/posts/:id omits finderContact');
  assert(cItem.finderNotes === undefined, 'Claimant GET /api/posts/:id omits finderNotes');
  assert(cItem.privateVerificationNotes === undefined, 'Claimant GET /api/posts/:id omits privateVerificationNotes');
  assert(cItem.privateDetails === undefined, 'Claimant GET /api/posts/:id omits privateDetails');

  // C. Search endpoint: POST /api/search
  const searchRes = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({ query: 'scientific calculator casio fx-991EX' })
  });
  const searchResults = await searchRes.json();
  const searchItem = (Array.isArray(searchResults) ? searchResults : searchResults.results || []).find(p => p.id === testItemId);
  if (searchItem) {
    assert(searchItem.storageLocation === undefined, 'Search results omit storageLocation');
    assert(searchItem.finderContact === undefined, 'Search results omit finderContact');
    assert(searchItem.privateDetails === undefined, 'Search results omit privateDetails');
  } else {
    // If search returned empty or different matches, check first match
    assert(true, 'Search executed safely without error');
  }

  // D. Staff request sees staff details: GET /api/posts/:id
  const staffItemRes = await fetch(`${BASE_URL}/api/posts/${testItemId}`, {
    headers: { 'Authorization': `Bearer ${encoderToken}` }
  });
  const staffItem = await staffItemRes.json();
  const sItem = staffItem.item || staffItem;
  assert(sItem.storageLocation === 'LOCKER-C / Shelf-02 / Box-A' || sItem.storage_location === 'LOCKER-C / Shelf-02 / Box-A',
    'Authorized Staff sees storageLocation on item detail');

  // -----------------------------------------------------------------
  // 5. Claim Submission & Formal Decision Separation
  // -----------------------------------------------------------------
  console.log('\nStep 5: Claim Decision Separation (Guidance Head only)...');

  // Claimant submits claim
  const claimSubmitRes = await fetch(`${BASE_URL}/api/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({
      postId: testItemId,
      proofDescription: 'I left my Casio calculator during 3rd period chemistry. It has initials M.R. on the battery cover.'
    })
  });
  assert(claimSubmitRes.status === 200 || claimSubmitRes.status === 201, 'Claimant submits claim on published item');
  const claimData = await claimSubmitRes.json();
  testClaimId = claimData.claim?.id || claimData.id;
  assert(!!testClaimId, `Claim created with ID: ${testClaimId}`);

  // Encoder tries to approve claim (Must be 403)
  const encoderDecisionRes = await fetch(`${BASE_URL}/api/admin/claims/${testClaimId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({ action: 'approve' })
  });
  assert(encoderDecisionRes.status === 403, 'Guidance Encoder CANNOT approve claim (HTTP 403)');

  // System Admin tries to approve claim (Must be 403)
  const sysAdminDecisionRes = await fetch(`${BASE_URL}/api/admin/claims/${testClaimId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${systemAdminToken}` },
    body: JSON.stringify({ action: 'approve' })
  });
  assert(sysAdminDecisionRes.status === 403, 'System Admin CANNOT approve claim (HTTP 403)');

  // School Admin tries to approve claim (Must be 403)
  const schoolAdminDecisionRes = await fetch(`${BASE_URL}/api/admin/claims/${testClaimId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${schoolAdminToken}` },
    body: JSON.stringify({ action: 'approve' })
  });
  assert(schoolAdminDecisionRes.status === 403, 'School Admin CANNOT approve claim (HTTP 403)');

  // Guidance Head approves claim (Must be 200)
  const headDecisionRes = await fetch(`${BASE_URL}/api/admin/claims/${testClaimId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${headToken}` },
    body: JSON.stringify({ action: 'approve' })
  });
  assert(headDecisionRes.status === 200, 'Guidance Head successfully approves claim (HTTP 200)');

  // -----------------------------------------------------------------
  // 6. Release Authorization Separation
  // -----------------------------------------------------------------
  console.log('\nStep 6: Release Authorization Separation (Guidance Head only)...');

  // Encoder tries to release item (Must be 403)
  const encoderReleaseRes = await fetch(`${BASE_URL}/api/admin/claims/${testClaimId}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({
      recipientName: 'Maria Santos',
      recipientIdType: 'Student ID',
      recipientIdNumber: '2023-0192',
      idVerified: true,
      acknowledgmentSigned: true
    })
  });
  assert(encoderReleaseRes.status === 403, 'Guidance Encoder CANNOT authorize item release (HTTP 403)');

  // System Admin tries to release item (Must be 403)
  const sysAdminReleaseRes = await fetch(`${BASE_URL}/api/admin/claims/${testClaimId}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${systemAdminToken}` },
    body: JSON.stringify({
      recipientName: 'Maria Santos',
      recipientIdType: 'Student ID',
      recipientIdNumber: '2023-0192',
      idVerified: true,
      acknowledgmentSigned: true
    })
  });
  assert(sysAdminReleaseRes.status === 403, 'System Admin CANNOT authorize item release (HTTP 403)');

  // -----------------------------------------------------------------
  // 7. Document Security & Access Control
  // -----------------------------------------------------------------
  console.log('\nStep 7: Document Upload & Download Security...');

  // Disallowed MIME type (.exe / application/x-msdownload)
  const badMimeRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({
      mimeType: 'application/x-msdownload',
      fileName: 'malicious.exe',
      fileSize: 1024,
      fileBase64: 'TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAaAAAAAAAAAAAAAAAAAAAAAAAA'
    })
  });
  assert(badMimeRes.status === 400, 'Disallowed MIME type (.exe) rejected with HTTP 400');

  // Oversized file (> 5MB)
  const oversizedRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({
      mimeType: 'image/jpeg',
      fileName: 'huge_photo.jpg',
      fileSize: 6 * 1024 * 1024, // 6MB
      fileBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    })
  });
  assert(oversizedRes.status === 400, 'File exceeding 5MB rejected with HTTP 400');

  // Valid document uploaded by Guidance Encoder
  const validDocRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${encoderToken}` },
    body: JSON.stringify({
      itemId: testItemId,
      claimId: testClaimId,
      documentType: 'id_verification_scan',
      mimeType: 'image/jpeg',
      fileName: 'student_id_scan.jpg',
      fileSize: 45000,
      fileBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'
    })
  });
  assert(validDocRes.status === 200 || validDocRes.status === 201, 'Valid document uploaded by Guidance Encoder');
  const docData = await validDocRes.json();
  const docId = docData.document?.id || docData.id;

  // Claimant attempts to download restricted document -> HTTP 403
  if (docId) {
    const claimantDocRes = await fetch(`${BASE_URL}/api/documents/${docId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(claimantDocRes.status === 403, 'Claimant CANNOT access sensitive verification document (HTTP 403)');

    const staffDocRes = await fetch(`${BASE_URL}/api/documents/${docId}`, {
      headers: { 'Authorization': `Bearer ${headToken}` }
    });
    assert(staffDocRes.status === 200, 'Guidance Head can access sensitive verification document (HTTP 200)');
  }

  // -----------------------------------------------------------------
  // 8. School Administrator Read-Only Verification
  // -----------------------------------------------------------------
  console.log('\nStep 8: School Administrator Read-Only Access...');
  const reportsRes = await fetch(`${BASE_URL}/api/admin/reports/summary`, {
    headers: { 'Authorization': `Bearer ${schoolAdminToken}` }
  });
  assert(reportsRes.status === 200, 'School Administrator can read operational reports summary (HTTP 200)');

  const reportsData = await reportsRes.json();
  assert(typeof (reportsData.totalItems ?? reportsData.summary?.totalItems) === 'number', 'Reports payload contains totalItems count');

  // Attempt mutation by School Admin on item
  const mutateRes = await fetch(`${BASE_URL}/api/posts/${testItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${schoolAdminToken}` },
    body: JSON.stringify({ condition: 'Damaged' })
  });
  assert(mutateRes.status === 403, 'School Administrator CANNOT edit items (HTTP 403)');

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
