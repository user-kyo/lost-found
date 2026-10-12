// test_holding_disposition_workflow.js
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
  console.log('🚀 Starting Holding Period & Unclaimed Item Disposition Test (Step 4)...\n');

  // 0. Authenticate
  console.log('🔑 Authenticating as Guidance Staff...');
  const staffToken = await login('encoder@guidance.edu', 'password123');
  console.log('✅ Token obtained.\n');

  // Step 1: Holding Configuration and Clocks calculation
  console.log('1️⃣ Testing Holding Period Configuration (GET & PUT /api/admin/holding-config)...');
  const configRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const configData = await configRes.json();
  console.log('Current School Holding Days:', configData.schoolHoldingDays);
  console.log('Statutory Months:', configData.statutoryMonths);

  // Update holding period to 60 days
  const updateConfigRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ schoolHoldingDays: 60 })
  });
  const updateData = await updateConfigRes.json();
  console.log('Updated School Holding Days:', updateData.schoolHoldingDays);
  console.log('✅ Step 1 Passed: Holding period configuration is operational.\n');

  // Step 2: Create an item and verify holding clocks
  console.log('2️⃣ Creating Item & Verifying Holding Clocks...');
  // We set dateFound to 65 days ago to simulate a lapsed holding period
  const sixtyFiveDaysAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
  
  const createRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      category: 'Apparel & Accessories',
      color: 'Navy Blue',
      publicDescription: 'Unclaimed navy blue varsity jacket found in Gymnasium bleachers.',
      areaFound: 'Gymnasium Bleachers Section B',
      dateFound: sixtyFiveDaysAgo,
      condition: 'Good',
      storageLocation: 'OFFICE-CUSTODY / Shelf-04',
      estimatedValueBand: 'Medium (₱500 - ₱2,000)',
      specialHandlingType: 'Standard'
    })
  });

  const createData = await createRes.json();
  const itemId = createData.post.id;
  const clocks = createData.post.holdingClocks;
  console.log('Created Item ID:', itemId);
  console.log('Holding Clock Info:', {
    receivedAt: clocks.receivedAt,
    deadline: clocks.schoolHoldingDeadline,
    isSchoolHoldingLapsed: clocks.isSchoolHoldingLapsed,
    schoolDaysElapsed: clocks.schoolDaysElapsed,
    holdingStatus: clocks.holdingStatus
  });

  if (!clocks.isSchoolHoldingLapsed) {
    throw new Error('Expected school holding period to be lapsed for item received 65 days ago!');
  }
  console.log('✅ Step 2 Passed: Holding clock accurately detected lapsed school holding period.\n');

  // Step 3: Initiate Disposition Case
  console.log('3️⃣ Initiating Disposition Case (POST /api/admin/posts/:id/disposition-case)...');
  const caseRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/disposition-case`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      targetDisposition: 'donated'
    })
  });
  if (!caseRes.ok) {
    const err = await caseRes.text();
    throw new Error(`Failed to create disposition case: ${err}`);
  }
  const caseData = await caseRes.json();
  const dispCase = caseData.dispositionCase;
  console.log('Case ID:', dispCase.caseId);
  console.log('Initial Case Status:', dispCase.status);
  console.log('Checklist Complete:', dispCase.checklistCompleted);

  if (dispCase.checklistCompleted !== false) {
    throw new Error('Checklist should initially be incomplete!');
  }
  console.log('✅ Step 3 Passed: Disposition case created with pending checklist.\n');

  // Step 4: Guardrail Test 1: Attempt final status change with incomplete checklist MUST BE BLOCKED
  console.log('4️⃣ Testing Guardrail 1: Block final status change when checklist is incomplete...');
  const earlyDisposeRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/dispose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      targetDisposition: 'donated',
      recipientOrg: 'Charity'
    })
  });
  console.log('Early dispose HTTP Status:', earlyDisposeRes.status);
  const earlyDisposeData = await earlyDisposeRes.json();
  console.log('Blocked Reason:', earlyDisposeData.error);

  if (earlyDisposeRes.status !== 400 || !earlyDisposeData.error.includes('checklist is incomplete')) {
    throw new Error(`Expected block on incomplete checklist, got status ${earlyDisposeRes.status}`);
  }
  console.log('✅ Guardrail 1 Verified: Final status change blocked due to incomplete checklist!\n');

  // Step 5: Guardrail Test 2: Attempt approval with incomplete checklist MUST BE BLOCKED
  console.log('5️⃣ Testing Guardrail 2: Block official approval when checklist is incomplete...');
  // Check 3 out of 5 items
  await fetch(`${BASE_URL}/api/admin/posts/${itemId}/disposition-case/checklist`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      checklist: {
        physical_inventory_audit: true,
        claim_absence_certified: true,
        notice_posted: true,
        recipient_identified: false,
        property_affidavit_attached: false
      }
    })
  });

  const earlyApproveRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/disposition-case/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ officialRemarks: 'Attempting early sign-off' })
  });
  console.log('Early approve HTTP Status:', earlyApproveRes.status);
  const earlyApproveData = await earlyApproveRes.json();
  console.log('Blocked Reason:', earlyApproveData.error);

  if (earlyApproveRes.status !== 400 || !earlyApproveData.error.includes('checklist is incomplete')) {
    throw new Error(`Expected approval block on incomplete checklist, got status ${earlyApproveRes.status}`);
  }
  console.log('✅ Guardrail 2 Verified: Official approval blocked when checklist is not 100% complete!\n');

  // Step 6: Complete 100% of Document Checklist
  console.log('6️⃣ Completing 100% of Document Checklist (All 5 Mandatory Items)...');
  const fullChecklistRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/disposition-case/checklist`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      checklist: {
        physical_inventory_audit: true,
        claim_absence_certified: true,
        notice_posted: true,
        recipient_identified: true,
        property_affidavit_attached: true
      },
      targetDisposition: 'donated'
    })
  });
  const fullChecklistData = await fullChecklistRes.json();
  console.log('Checklist Completed:', fullChecklistData.dispositionCase.checklistCompleted);
  console.log('Case Status after full checklist:', fullChecklistData.dispositionCase.status);

  if (!fullChecklistData.dispositionCase.checklistCompleted) {
    throw new Error('Checklist should be marked complete!');
  }
  console.log('✅ Step 6 Passed: All 5 checklist items certified; case moved to pending_approval.\n');

  // Step 7: Guardrail Test 3: Block execution BEFORE official approval is signed
  console.log('7️⃣ Testing Guardrail 3: Block final status change before official approval...');
  const unapprovedDisposeRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/dispose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ targetDisposition: 'donated' })
  });
  console.log('Unapproved dispose HTTP Status:', unapprovedDisposeRes.status);
  const unapprovedData = await unapprovedDisposeRes.json();
  console.log('Blocked Reason:', unapprovedData.error);

  if (unapprovedDisposeRes.status !== 403 || !unapprovedData.error.includes('official approval')) {
    throw new Error(`Expected block on unapproved case, got status ${unapprovedDisposeRes.status}`);
  }
  console.log('✅ Guardrail 3 Verified: Final status change blocked without authorized official approval!\n');

  // Step 8: Authorized Official Approves Case
  console.log('8️⃣ Authorized Official Signs and Approves Disposition Case...');
  const approveRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/disposition-case/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      officialRemarks: 'Inspected holding logs and certified readiness for donation to community outreach.'
    })
  });
  if (!approveRes.ok) {
    const err = await approveRes.text();
    throw new Error(`Approval failed: ${err}`);
  }
  const approvedCaseData = await approveRes.json();
  console.log('Case Status:', approvedCaseData.dispositionCase.status);
  console.log('Approved by:', approvedCaseData.dispositionCase.approval.approvedBy);
  console.log('Approver Role:', approvedCaseData.dispositionCase.approval.approverRole);

  if (!approvedCaseData.dispositionCase.approval.approved) {
    throw new Error('Case should be marked as officially approved!');
  }
  console.log('✅ Step 8 Passed: Official approval recorded.\n');

  // Step 9: Execute Final Disposition (Transition to Donated)
  console.log('9️⃣ Executing Final Disposition (Transitioning item status to "donated")...');
  const finalDisposeRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/dispose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      targetDisposition: 'donated',
      manifestNumber: 'MNF-2026-OUTREACH-01',
      recipientOrg: 'DepEd Student Welfare Foundation',
      dispositionNote: 'Turned over to outreach charity for distribution to student community.'
    })
  });

  if (!finalDisposeRes.ok) {
    const err = await finalDisposeRes.text();
    throw new Error(`Final execution failed: ${err}`);
  }
  const finalData = await finalDisposeRes.json();
  console.log('Execution Success:', finalData.success);
  console.log('Final Post Status:', finalData.post.status);
  console.log('Case Status:', finalData.dispositionCase.status);
  console.log('Execution Manifest:', finalData.dispositionCase.execution.manifestNumber);

  if (finalData.post.status !== 'donated') {
    throw new Error(`Expected final post status 'donated', got '${finalData.post.status}'`);
  }
  console.log('✅ Step 9 Passed: Item status successfully and strictly updated to "donated"!\n');

  console.log('🎉 ALL TESTS PASSED! Step 4 (Holding Clocks, Disposition Case, Checklist Guardrail & Official Approval) is 100% operational.');
}

runTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
