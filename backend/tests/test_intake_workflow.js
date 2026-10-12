// test_intake_workflow.js
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
  console.log('🚀 Starting Found-Item Intake & Verification Workflow Test...\n');

  // 0. Authenticate
  console.log('🔑 Authenticating as Guidance Encoder, Guidance Head, and Student...');
  const staffToken = await login('encoder@guidance.edu', 'password123');
  const headToken = await login('head@guidance.edu', 'password123');
  const studentToken = await login('student@school.edu', 'password123');
  console.log('✅ Tokens obtained.\n');

  // Step 1: Staff records found item via intake form
  console.log('1️⃣ Testing Intake Form Submission (POST /api/posts)...');
  const intakePayload = {
    category: 'Bottles & Containers',
    color: 'Dark Blue',
    publicDescription: 'A dark blue Hydro Flask bottle found on the bench outside Guidance Office.',
    areaFound: 'Guidance Office Lobby Bench',
    condition: 'Good',
    storageLocation: 'OFFICE-SHELF / Vault-B2',
    estimatedValueBand: 'PHP 500 - 2,000 (Medium)',
    specialHandlingType: 'Standard Item',
    finderName: 'Juan Dela Cruz (Campus Guard)',
    finderContact: '09123456789',
    finderType: 'staff_security',
    finderNotes: 'Turned in during afternoon perimeter sweep',
    privateDetails: 'Scratch on the bottom ring, anime sticker on side'
  };

  const createRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify(intakePayload)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create post: ${createRes.status} ${errText}`);
  }

  const createData = await createRes.json();
  const createdPost = createData.post;
  console.log('Created Post ID:', createdPost.id);
  console.log('Initial Status:', createdPost.status);
  console.log('Preserved Intake Metadata:', {
    condition: createdPost.condition,
    storageLocation: createdPost.storageLocation,
    estimatedValueBand: createdPost.estimatedValueBand,
    specialHandlingType: createdPost.specialHandlingType,
    finderName: createdPost.finderName,
    finderContact: createdPost.finderContact,
    finderType: createdPost.finderType,
    finderNotes: createdPost.finderNotes
  });

  if (createdPost.status !== 'received') {
    throw new Error(`Expected initial status 'received', got '${createdPost.status}'`);
  }
  console.log('✅ Step 1 Passed: Initial status is strictly "received".\n');

  // Step 2: Staff physical verification (received -> verified)
  console.log('2️⃣ Testing Physical Verification (POST /api/admin/posts/:id/verify)...');
  const verifyRes = await fetch(`${BASE_URL}/api/admin/posts/${createdPost.id}/verify`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ note: 'Physical bottle inspected and logged into Vault-B2' })
  });
  if (!verifyRes.ok) {
    const errText = await verifyRes.text();
    throw new Error(`Failed to verify post: ${verifyRes.status} ${errText}`);
  }
  const verifyData = await verifyRes.json();
  console.log('Status after verify:', verifyData.post.status);
  if (verifyData.post.status !== 'verified') {
    throw new Error(`Expected status 'verified', got '${verifyData.post.status}'`);
  }
  console.log('✅ Step 2 Passed: Status successfully transitioned to "verified".\n');

  // Step 3: Staff approval and publication (verified -> published)
  console.log('3️⃣ Testing Approval & Publishing (POST /api/admin/posts/:id/publish)...');
  const publishRes = await fetch(`${BASE_URL}/api/admin/posts/${createdPost.id}/publish`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${headToken}`
    },
    body: JSON.stringify({ note: 'Approved and published to student feed' })
  });
  if (!publishRes.ok) {
    const errText = await publishRes.text();
    throw new Error(`Failed to publish post: ${publishRes.status} ${errText}`);
  }
  const publishData = await publishRes.json();
  console.log('Status after publish:', publishData.post.status);
  if (publishData.post.status !== 'published') {
    throw new Error(`Expected status 'published', got '${publishData.post.status}'`);
  }

  // Check visibility in public available items
  const availRes = await fetch(`${BASE_URL}/api/posts/available`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const availItems = await availRes.json();
  const foundInCatalog = availItems.some(i => i.id === createdPost.id);
  console.log('Visible in public published catalog?', foundInCatalog);
  if (!foundInCatalog) {
    throw new Error('Item should be visible in available items catalog once published!');
  }
  console.log('✅ Step 3 Passed: Status transitioned to "published" and item is live in student catalog.\n');

  // Step 4: Student files a claim (published -> claim_pending)
  console.log('4️⃣ Testing Student Claim Submission (POST /api/claims)...');
  const claimPayload = {
    postId: createdPost.id,
    proofDetails: 'My bottle has a scratch on the bottom ring and a My Hero Academia anime sticker.'
  };

  const claimRes = await fetch(`${BASE_URL}/api/claims`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify(claimPayload)
  });
  if (!claimRes.ok) {
    const errText = await claimRes.text();
    throw new Error(`Failed to submit claim: ${claimRes.status} ${errText}`);
  }
  const claimData = await claimRes.json();
  console.log('Created Claim ID:', claimData.claim.id);

  // Check post status in inventory
  const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const invItems = await invRes.json();
  const targetPostAfterClaim = invItems.find(i => i.id === createdPost.id);
  console.log('Item Status after claim:', targetPostAfterClaim.status);
  if (targetPostAfterClaim.status !== 'claim_pending') {
    throw new Error(`Expected item status 'claim_pending', got '${targetPostAfterClaim.status}'`);
  }
  console.log('✅ Step 4 Passed: Status successfully transitioned to "claim_pending".\n');

  // Step 5: Staff rejects the claim -> Strict Reversion to published (claim_pending -> published)
  console.log('5️⃣ Testing Claim Rejection Reversion Rule (POST /api/admin/claims/:id/decision)...');
  const rejectRes = await fetch(`${BASE_URL}/api/admin/claims/${claimData.claim.id}/decision`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${headToken}`
    },
    body: JSON.stringify({
      action: 'reject',
      rejectReason: 'Sticker did not match the actual character on bottle.'
    })
  });
  if (!rejectRes.ok) {
    const errText = await rejectRes.text();
    throw new Error(`Failed to reject claim: ${rejectRes.status} ${errText}`);
  }
  const rejectData = await rejectRes.json();
  console.log('Decision response:', rejectData.message);

  // Check item status after rejection
  const invRes2 = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const invItems2 = await invRes2.json();
  const targetPostAfterReject = invItems2.find(i => i.id === createdPost.id);
  console.log('Item Status after rejection:', targetPostAfterReject.status);
  if (targetPostAfterReject.status !== 'published') {
    throw new Error(`Expected item status strictly reverted to 'published', got '${targetPostAfterReject.status}'`);
  }

  // Check it is back in public catalog
  const availRes2 = await fetch(`${BASE_URL}/api/posts/available`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const availItems2 = await availRes2.json();
  const returnedToCatalog = availItems2.some(i => i.id === createdPost.id);
  console.log('Item returned to public catalog after rejection?', returnedToCatalog);
  if (!returnedToCatalog) {
    throw new Error('Item should be returned to public catalog after claim rejection!');
  }
  console.log('✅ Step 5 Passed: Strict Reversion Rule verified: claim_pending -> published!\n');

  // Step 6: Valid claim and release flow (published -> claim_pending -> released)
  console.log('6️⃣ Testing Valid Claim Approval & Final Release...');
  const validClaimRes = await fetch(`${BASE_URL}/api/claims`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      postId: createdPost.id,
      proofDetails: 'Accurate description with matching anime sticker and receipt'
    })
  });
  if (!validClaimRes.ok) {
    const errText = await validClaimRes.text();
    throw new Error(`Failed to file second claim: ${validClaimRes.status} ${errText}`);
  }
  const validClaimData = await validClaimRes.json();

  // Approve claim
  const approveRes = await fetch(`${BASE_URL}/api/admin/claims/${validClaimData.claim.id}/decision`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${headToken}`
    },
    body: JSON.stringify({ action: 'approve' })
  });
  if (!approveRes.ok) {
    const errText = await approveRes.text();
    throw new Error(`Failed to approve claim: ${approveRes.status} ${errText}`);
  }

  // Release item
  const releaseRes = await fetch(`${BASE_URL}/api/admin/claims/${validClaimData.claim.id}/release`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${headToken}`
    },
    body: JSON.stringify({
      claimantName: 'Juan Dela Cruz (Student)',
      claimantSchoolId: '2024-00101',
      verificationSummary: 'Student presented physical ID card matching claim details'
    })
  });
  if (!releaseRes.ok) {
    const errText = await releaseRes.text();
    throw new Error(`Failed to release item: ${releaseRes.status} ${errText}`);
  }
  const releaseData = await releaseRes.json();
  console.log('Release logged with Handover ID:', releaseData.log.id);

  // Check item status in inventory
  const invRes3 = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const invItems3 = await invRes3.json();
  const targetPostAfterRelease = invItems3.find(i => i.id === createdPost.id);
  console.log('Final Item Status:', targetPostAfterRelease.status);
  if (targetPostAfterRelease.status !== 'released') {
    throw new Error(`Expected final item status 'released', got '${targetPostAfterRelease.status}'`);
  }
  console.log('✅ Step 6 Passed: Item successfully reached final terminal state "released".\n');

  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The 5-stage status workflow and intake validation are 100% operational.');
}

runTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
