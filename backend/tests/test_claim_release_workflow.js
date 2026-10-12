// test_claim_release_workflow.js
const BASE_URL = 'http://localhost:3000';

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

async function runTest() {
  console.log('🚀 Starting Claim, Verification, and Release Process Test (Step 3)...\n');

  // 0. Authenticate
  console.log('🔑 Authenticating as Guidance Staff, Guidance Head, and Student...');
  const staffToken = await login('encoder@guidance.edu', 'password123');
  const headToken = await login('head@guidance.edu', 'password123');
  const studentToken = await login('student@school.edu', 'password123');
  console.log('✅ Tokens obtained.\n');

  // Step 1: Create and publish a test item
  console.log('1️⃣ Creating and Publishing an Intake Item...');
  const intakeRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      category: 'Electronics',
      color: 'Space Gray',
      publicDescription: 'Apple iPad 10th Gen in space gray casing found at Library 2nd floor.',
      areaFound: 'Library 2nd Floor Study Nook',
      condition: 'Like New',
      storageLocation: 'OFFICE-SAFE / Locker-01',
      estimatedValueBand: 'PHP 10,000+ (Premium)',
      specialHandlingType: 'High Value',
      finderName: 'Librarian Assistant',
      privateDetails: 'Locked with 6-digit PIN, sticker of Totoro on back cover'
    })
  });
  const intakeData = await intakeRes.json();
  const itemId = intakeData.post.id;
  console.log('Created Item ID:', itemId);

  // Transition received -> verified -> published
  await fetch(`${BASE_URL}/api/admin/posts/${itemId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ note: 'Serial number verified on device' })
  });

  const publishRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${headToken}` },
    body: JSON.stringify({ note: 'Published for student claims' })
  });
  const pubData = await publishRes.json();
  console.log('Item Status after publish:', pubData.post.status);
  console.log('✅ Item published.\n');

  // Step 2: Student submits first claim (published -> claim_pending)
  console.log('2️⃣ Submitting First Claim Request...');
  const claim1Res = await fetch(`${BASE_URL}/api/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      postId: itemId,
      proofDetails: 'My iPad has a Totoro sticker and a small scratch on the camera lens.'
    })
  });

  if (!claim1Res.ok) {
    const err = await claim1Res.text();
    throw new Error(`First claim failed unexpectedly: ${err}`);
  }
  const claim1Data = await claim1Res.json();
  const claimId = claim1Data.claim.id;
  console.log('Claim 1 Created ID:', claimId);
  console.log('Item Status after Claim 1:', claim1Data.post.status);

  if (claim1Data.post.status !== 'claim_pending') {
    throw new Error(`Expected item status 'claim_pending', got '${claim1Data.post.status}'`);
  }
  console.log('✅ First claim placed item in "claim_pending" status.\n');

  // Step 3: Test Enforcing Limit: Attempting second claim on the same item while claim_pending MUST FAIL
  console.log('3️⃣ Testing Enforcing Claim Limit (Only 1 Active Claim Allowed per Item)...');
  const claim2Res = await fetch(`${BASE_URL}/api/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      postId: itemId,
      proofDetails: 'Second claim attempt for the same iPad.'
    })
  });

  console.log('Second Claim HTTP Status:', claim2Res.status);
  const claim2Data = await claim2Res.json();
  console.log('Second Claim Error Response:', claim2Data.error);

  if (claim2Res.status !== 409) {
    throw new Error(`Expected HTTP 409 Conflict for duplicate active claim, got ${claim2Res.status}`);
  }
  if (!claim2Data.error || !claim2Data.error.includes('already pending')) {
    throw new Error(`Expected duplicate claim error message, got: ${claim2Data.error}`);
  }
  console.log('✅ Claim Limit Verified: Blocked duplicate active claim on item with 409 Conflict!\n');

  // Step 4: Guidance Staff approves claim first (Task 1 prerequisite)
  console.log('4️⃣ Testing Claim Approval Prerequisite...');
  // First verify that attempting release without approval is rejected
  const unapprovedReleaseRes = await fetch(`${BASE_URL}/api/admin/claims/${claimId}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${headToken}` },
    body: JSON.stringify({ recipientName: 'Juan Dela Cruz', idNumber: '2024-00101' })
  });
  if (unapprovedReleaseRes.status !== 400) {
    throw new Error(`Expected HTTP 400 rejecting release of unapproved claim, got ${unapprovedReleaseRes.status}`);
  }
  console.log('✅ Prerequisite Guardrail Verified: Releasing unapproved submitted claim is blocked with HTTP 400!');

  // Now properly approve claim by Guidance Head
  const approveRes = await fetch(`${BASE_URL}/api/admin/claims/${claimId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${headToken}` },
    body: JSON.stringify({ action: 'approve', verificationNotes: 'Identity and ownership verified' })
  });
  if (!approveRes.ok) {
    throw new Error(`Claim approval failed: ${approveRes.status}`);
  }
  console.log('✅ Claim approved by Guidance Head.\n');

  // Step 5: Guidance Staff executes physical release with complete required details
  console.log('5️⃣ Testing Guidance Staff Release Mechanism...');
  const releasePayload = {
    recipientName: 'Juan Dela Cruz (Student)',
    recipientSchoolId: '2024-00101',
    recipientContact: '0917-123-4567',
    recipientType: 'Actual Owner',
    idTypePresented: 'University Student ID Card',
    idNumber: '2024-00101',
    releaseDate: new Date().toISOString(),
    approvingStaffName: 'Clara Reyes (Guidance Encoder)',
    acknowledgmentConfirmed: true,
    acknowledgmentNote: 'I, Juan Dela Cruz, certify receipt of my iPad 10th Gen in good condition from the Guidance Office.',
    verificationSummary: 'Student unlocked device with PIN code and presented matching Student ID.',
    notes: 'Handover executed at Desk 2.'
  };

  const releaseRes = await fetch(`${BASE_URL}/api/admin/claims/${claimId}/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${headToken}`
    },
    body: JSON.stringify(releasePayload)
  });

  if (!releaseRes.ok) {
    const err = await releaseRes.text();
    throw new Error(`Release failed: ${releaseRes.status} ${err}`);
  }
  const releaseData = await releaseRes.json();
  console.log('Release Success:', releaseData.success);
  console.log('Recorded Handover Log ID:', releaseData.log.id);
  console.log('Final Item Status:', releaseData.item.status);
  console.log('Release Record Details preserved:', {
    recipient: releaseData.releaseRecord.recipientName,
    schoolId: releaseData.releaseRecord.recipientSchoolId,
    idPresented: releaseData.releaseRecord.idTypePresented,
    idNumber: releaseData.releaseRecord.idNumber,
    approvingStaff: releaseData.releaseRecord.approvingStaffMember,
    releaseTimestamp: releaseData.releaseRecord.releaseDateTime,
    acknowledgment: releaseData.releaseRecord.acknowledgmentOfReceipt
  });

  if (releaseData.item.status !== 'released') {
    throw new Error(`Expected item status 'released', got '${releaseData.item.status}'`);
  }
  console.log('✅ Physical release successfully executed and item status strictly transitioned to "released".\n');

  // Step 5: Verify fetching Handover Receipt / Certificate
  console.log('5️⃣ Testing Fetching Official Handover Certificate (GET /api/admin/claims/:id/handover)...');
  const certRes = await fetch(`${BASE_URL}/api/admin/claims/${claimId}/handover`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  if (!certRes.ok) {
    const err = await certRes.text();
    throw new Error(`Failed to fetch handover certificate: ${err}`);
  }
  const certData = await certRes.json();
  console.log('Handover Certificate Claim ID:', certData.log.claimId);
  console.log('Certificate Recipient Name:', certData.log.claimantName);
  console.log('Certificate Officer:', certData.log.officer.fullName);
  console.log('Certificate Parsed Release Data:', certData.releaseRecord);

  if (!certData.releaseRecord || certData.releaseRecord.recipientName !== 'Juan Dela Cruz (Student)') {
    throw new Error('Release certificate details missing or incomplete!');
  }
  console.log('✅ Official Handover Certificate verified and intact.\n');

  // Step 6: Verify released item cannot be claimed anymore
  console.log('6️⃣ Testing Released Item Protection (Cannot claim a released item)...');
  const claimReleasedRes = await fetch(`${BASE_URL}/api/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      postId: itemId,
      proofDetails: 'Attempt to claim an already released item.'
    })
  });
  console.log('Claim Released Item HTTP Status:', claimReleasedRes.status);
  if (claimReleasedRes.status !== 400 && claimReleasedRes.status !== 409) {
    throw new Error(`Expected claim on released item to fail, got ${claimReleasedRes.status}`);
  }
  console.log('✅ Released item successfully protected against duplicate claiming.\n');

  console.log('🎉 ALL TESTS PASSED! Step 3 (Claim limit: 1 active claim per item & Guidance Release Mechanism) is 100% operational.');
}

runTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
