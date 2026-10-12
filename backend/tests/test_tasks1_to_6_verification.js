// backend/tests/test_tasks1_to_6_verification.js
// Verification suite for BalikHub Remediation Tasks 1 through 6
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let studentToken, encoderToken, headToken, schoolAdminToken, systemAdminToken;
let passed = 0;
let failed = 0;

function assert(condition, testName, extra = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${extra}`);
    failed++;
  }
}

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

async function runTasks1to6Verification() {
  console.log('======================================================================');
  console.log('  BALIKHUB AUDIT REMEDIATION: TASKS 1 TO 6 VERIFICATION TEST SUITE');
  console.log('======================================================================\n');

  // --- Step 0: Authentication ---
  console.log('--- Step 0: Authenticating test accounts ---');
  studentToken = await login('student@school.edu', 'password123');
  encoderToken = await login('encoder@guidance.edu', 'password123');
  headToken = await login('head@guidance.edu', 'password123');
  schoolAdminToken = await login('schooladmin@school.edu', 'password123');
  systemAdminToken = await login('admin@school.edu', 'password123');
  assert(!!studentToken && !!encoderToken && !!headToken && !!schoolAdminToken && !!systemAdminToken, 'All 5 approved role tokens retrieved');

  // -------------------------------------------------------------------------
  // TASK 1: Centralized Status-Transition Validation
  // -------------------------------------------------------------------------
  console.log('\n--- Task 1: Centralized Status-Transition Validation ---');

  // 1.1 Intake an item (starts in 'received')
  const intakeRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${encoderToken}` },
    body: JSON.stringify({
      category: 'Electronics',
      color: 'Space Gray',
      publicDescription: 'Logitech Wireless Mouse M185 found at Room 304',
      locationFound: 'Room 304 Desk',
      dateFound: new Date().toISOString(),
      condition: 'Excellent',
      estimatedValueBand: 'Low (₱100 - ₱500)',
      specialHandlingType: 'Standard',
      storageLocation: 'Guidance Cabinet B',
      finderName: 'Maria Santos',
      finderContact: '09123456789',
      finderType: 'Student',
      privateDetails: 'Serial number LZ-987654 inside battery compartment'
    })
  });
  const intakeData = await intakeRes.json();
  const itemId = intakeData.post?.id || intakeData.item?.id;
  assert(intakeRes.status === 200 && !!itemId, 'Intake item created in received status');
  assert(intakeData.post?.status === 'received', 'Item initial status is strictly "received"');

  // 1.2 Attempt to publish directly from 'received' without physical verification (MUST BE REJECTED)
  const illegalPublishRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({ note: 'Bypassing verification step' })
  });
  const illegalPublishData = await illegalPublishRes.json();
  assert(
    illegalPublishRes.status === 400,
    'Publishing unverified received item directly is rejected with HTTP 400',
    `got ${illegalPublishRes.status}: ${JSON.stringify(illegalPublishData)}`
  );
  assert(
    illegalPublishData.error?.includes('verification') || illegalPublishData.error?.includes('verified'),
    'Error message clearly identifies intake verification prerequisite requirement'
  );

  // 1.3 Claimant attempts to publish or verify item (MUST BE REJECTED 403)
  const claimantVerifyRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ note: 'Claimant trying to verify' })
  });
  assert(claimantVerifyRes.status === 403, 'Claimant unauthorized to verify items (HTTP 403)');

  // 1.4 Proper physical verification by Guidance personnel
  const validVerifyRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${encoderToken}` },
    body: JSON.stringify({ note: 'Physical inspection completed; serial verified' })
  });
  const verifyData = await validVerifyRes.json();
  assert(validVerifyRes.status === 200, 'Physical verification by Guidance personnel succeeds (HTTP 200)');
  assert(verifyData.item?.status === 'verified', 'Item status transitions to "verified"');

  // 1.5 Publish item by Guidance Head
  const publishRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({ note: 'Guidance Head approves public bulletin display' })
  });
  const publishData = await publishRes.json();
  assert(publishRes.status === 200, 'Guidance Head publishes verified item (HTTP 200)');
  assert(publishData.item?.status === 'published', 'Item status transitions to "published"');

  // 1.6 Redundant transition check (publishing already published item)
  const redundantPublishRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({ note: 'Publishing again' })
  });
  assert(redundantPublishRes.status === 400, 'Redundant transition rejected with HTTP 400');

  // -------------------------------------------------------------------------
  // TASK 2: Atomic Claim Processing & Concurrency Protection
  // -------------------------------------------------------------------------
  console.log('\n--- Task 2: Atomic Claim Processing & Concurrency Protection ---');

  // 2.1 Concurrent Claim Submissions (Race Condition Simulation)
  console.log('  Firing 2 simultaneous claim requests against the same published item...');
  const [claimReq1, claimReq2] = await Promise.all([
    fetch(`${BASE_URL}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        itemId,
        proofDetails: 'Concurrent claim request 1: I lost my Logitech mouse at Room 304'
      })
    }),
    fetch(`${BASE_URL}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        itemId,
        proofDetails: 'Concurrent claim request 2: Simultaneous competing claim'
      })
    })
  ]);

  const claimStatus1 = claimReq1.status;
  const claimStatus2 = claimReq2.status;
  const statuses = [claimStatus1, claimStatus2].sort();

  assert(
    statuses[0] === 200 && statuses[1] === 409,
    `Atomic claim concurrency: exactly one request succeeded (200) and one failed (409 Conflict). Got [${claimStatus1}, ${claimStatus2}]`
  );

  // Extract winning claim
  const claimData1 = await claimReq1.json();
  const claimData2 = await claimReq2.json();
  const winningClaim = claimStatus1 === 200 ? claimData1.claim : claimData2.claim;
  assert(!!winningClaim?.id, 'Winning claim has valid UUID');

  // Verify item is now in 'claim_pending'
  const itemCheckRes = await fetch(`${BASE_URL}/api/items/${itemId}`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const itemCheck = await itemCheckRes.json();
  assert(itemCheck.status === 'claim_pending', 'Item transitioned atomically to claim_pending');

  // 2.2 Attempt to release item when claim is STILL in 'submitted' status (MUST BE REJECTED 400)
  const illegalReleaseRes = await fetch(`${BASE_URL}/api/admin/claims/${winningClaim.id}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({
      recipientName: 'Juan Dela Cruz',
      idTypePresented: 'School ID Card',
      idNumber: '2024-00101'
    })
  });
  const illegalReleaseData = await illegalReleaseRes.json();
  assert(
    illegalReleaseRes.status === 400,
    'Releasing claim in unapproved "submitted" status is rejected with HTTP 400',
    `got ${illegalReleaseRes.status}: ${JSON.stringify(illegalReleaseData)}`
  );
  assert(
    illegalReleaseData.error?.includes('approved') || illegalReleaseData.error?.includes('Prerequisite'),
    'Error message enforces approved claim prerequisite'
  );

  // 2.3 Approve claim by Guidance Head
  const approveClaimRes = await fetch(`${BASE_URL}/api/admin/claims/${winningClaim.id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({
      action: 'approve',
      verificationNotes: 'Claimant presented receipt and correctly identified serial number'
    })
  });
  assert(approveClaimRes.status === 200, 'Guidance Head approves claim (HTTP 200)');

  // 2.4 Concurrent Release Execution (Race Condition Simulation)
  console.log('  Firing 2 simultaneous release requests against the approved claim...');
  const [releaseReq1, releaseReq2] = await Promise.all([
    fetch(`${BASE_URL}/api/admin/claims/${winningClaim.id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
      body: JSON.stringify({
        recipientName: 'Juan Dela Cruz',
        idTypePresented: 'School ID Card',
        idNumber: '2024-00101',
        acknowledgmentConfirmed: true
      })
    }),
    fetch(`${BASE_URL}/api/admin/claims/${winningClaim.id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
      body: JSON.stringify({
        recipientName: 'Juan Dela Cruz',
        idTypePresented: 'School ID Card',
        idNumber: '2024-00101',
        acknowledgmentConfirmed: true
      })
    })
  ]);

  const releaseStatus1 = releaseReq1.status;
  const releaseStatus2 = releaseReq2.status;
  const releaseStatuses = [releaseStatus1, releaseStatus2].sort();

  assert(
    releaseStatuses[0] === 200 && releaseStatuses[1] === 409,
    `Atomic release concurrency: exactly one release succeeded (200) and one failed (409 Conflict). Got [${releaseStatus1}, ${releaseStatus2}]`
  );

  // Verify item is now in terminal 'released' status
  const itemFinalRes = await fetch(`${BASE_URL}/api/items/${itemId}`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const itemFinal = await itemFinalRes.json();
  assert(itemFinal.status === 'released', 'Item is permanently in released state');

  // 2.5 Terminal State Violation Check (Attempt to modify released item)
  const illegalRevertRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({ note: 'Attempting to re-publish released item' })
  });
  assert(illegalRevertRes.status === 409, 'Terminal state protection: Transitioning released item is rejected with HTTP 409');

  // -------------------------------------------------------------------------
  // TASK 3: Database-Backed Persistent Configuration
  // -------------------------------------------------------------------------
  console.log('\n--- Task 3: Database-Backed Persistent Configuration ---');

  // 3.1 Fetch current database holding configuration
  const configRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const configData = await configRes.json();
  assert(configRes.status === 200, 'GET /api/admin/holding-config returns 200');
  assert(typeof configData.schoolHoldingDays === 'number', `School holding days is numeric: ${configData.schoolHoldingDays}`);
  assert(configData.notice?.includes('statutory'), 'Configuration clearly differentiates school holding from statutory requirements');

  // 3.2 Update configuration (Guidance Head / Admin)
  const updateConfigRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({
      schoolHoldingDays: 45,
      isProvisional: false,
      note: 'Laguna College Guidance Board approved 45-day operational policy'
    })
  });
  const updateConfigData = await updateConfigRes.json();
  assert(updateConfigRes.status === 200, 'PUT /api/admin/holding-config updates database configuration');
  assert(updateConfigData.schoolHoldingDays === 45, 'Updated school holding days is 45');

  // 3.3 Verify persistence by re-fetching
  const verifyConfigRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  const verifyConfigData = await verifyConfigRes.json();
  assert(verifyConfigData.schoolHoldingDays === 45 && verifyConfigData.isProvisional === false, 'Updated configuration persisted in database record');

  // 3.4 Reject invalid holding day numbers
  const invalidConfigRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({ schoolHoldingDays: -10 })
  });
  assert(invalidConfigRes.status === 400, 'Negative holding days rejected with HTTP 400');

  // -------------------------------------------------------------------------
  // TASK 4: Persistent Audit Logging
  // -------------------------------------------------------------------------
  console.log('\n--- Task 4: Persistent Audit Logging ---');

  // 4.1 Ordinary student cannot view audit logs (MUST BE 403)
  const studentAuditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentAuditRes.status === 403, 'Claimant access to audit logs is strictly forbidden (HTTP 403)');

  // 4.2 School Administrator and Guidance Head can query audit logs
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs?limit=50`, {
    headers: { Authorization: `Bearer ${headToken}` }
  });
  const auditData = await auditRes.json();
  assert(auditRes.status === 200, 'GET /api/admin/audit-logs returns 200 for Guidance Head');
  assert(Array.isArray(auditData.logs) && auditData.logs.length > 0, `Audit logs present: ${auditData.logs?.length} records`);

  // Check actions recorded
  const recordedActions = auditData.logs.map((l) => l.action);
  assert(recordedActions.includes('intake_created'), 'Audit log contains "intake_created" action');
  assert(recordedActions.includes('item_verified'), 'Audit log contains "item_verified" action');
  assert(recordedActions.includes('item_published'), 'Audit log contains "item_published" action');
  assert(recordedActions.includes('claim_submitted'), 'Audit log contains "claim_submitted" action');
  assert(recordedActions.includes('claim_approved'), 'Audit log contains "claim_approved" action');
  assert(recordedActions.includes('item_released'), 'Audit log contains "item_released" action');
  assert(recordedActions.includes('config_updated'), 'Audit log contains "config_updated" action');

  // Verify actor information attached without exposing passwords
  const sampleLog = auditData.logs[0];
  assert(!!sampleLog.actor?.fullName && !sampleLog.actor?.passwordHash, 'Audit log records actor details without exposing password hashes');

  // -------------------------------------------------------------------------
  // TASK 5: Document and Authorization Review
  // -------------------------------------------------------------------------
  console.log('\n--- Task 5: Document and Authorization Review ---');

  // 5.1 Student cannot upload document (MUST BE 403)
  const studentUploadRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      itemId,
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjQK'
    })
  });
  assert(studentUploadRes.status === 403, 'Student document upload rejected with HTTP 403');

  // 5.2 Disguised Executable Upload (declared image/jpeg with binary MZ header) MUST BE REJECTED 400
  // 'TVqQ' is base64 for 'MZ\x90\x00', the Windows PE/DOS executable magic signature
  const fakeJpgExeBase64 = 'data:image/jpeg;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAA==';
  const exeUploadRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${encoderToken}` },
    body: JSON.stringify({
      itemId,
      fileName: 'innocent_receipt.jpg',
      mimeType: 'image/jpeg',
      fileUrl: fakeJpgExeBase64
    })
  });
  const exeUploadData = await exeUploadRes.json();
  assert(
    exeUploadRes.status === 400,
    'Disguised executable upload is rejected with HTTP 400',
    `got ${exeUploadRes.status}: ${JSON.stringify(exeUploadData)}`
  );
  assert(
    exeUploadData.error?.includes('Executable') || exeUploadData.error?.includes('signature mismatch'),
    `Security rejection error message caught executable header: ${exeUploadData.error}`
  );

  // 5.3 Valid PDF Document Upload (starts with %PDF)
  // 'JVBERi0xLjcK' is base64 for '%PDF-1.7\n'
  const validPdfBase64 = 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgPj4KZW5kb2JqCnRyYWlsZXIKPDwgL1Jvb3QgMSAwIFIgPj4KJSVFT0YK';
  const pdfUploadRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${encoderToken}` },
    body: JSON.stringify({
      itemId,
      fileName: 'Surrender_Intake_Receipt.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      fileUrl: validPdfBase64
    })
  });
  const pdfUploadData = await pdfUploadRes.json();
  assert(pdfUploadRes.status === 200 && !!pdfUploadData.document?.id, 'Genuine PDF document upload succeeds (HTTP 200)');
  const docId = pdfUploadData.document?.id;

  // 5.4 Document Deletion: Guidance Head authorized deletion
  const deleteDocRes = await fetch(`${BASE_URL}/api/documents/${docId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${headToken}` }
  });
  assert(deleteDocRes.status === 200, 'Guidance Head can delete document (HTTP 200)');

  // 5.5 Document Deletion: Claimant forbidden
  const studentDeleteDocRes = await fetch(`${BASE_URL}/api/documents/${docId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentDeleteDocRes.status === 403, 'Claimant forbidden from deleting documents (HTTP 403)');

  // -------------------------------------------------------------------------
  // TASK 6: Verification of Roles and Privacy Safeguards
  // -------------------------------------------------------------------------
  console.log('\n--- Task 6: Verification of Roles and Privacy Safeguards ---');

  // 6.1 School Administrator read-only verification
  const schoolAdminReportRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { Authorization: `Bearer ${schoolAdminToken}` }
  });
  assert(schoolAdminReportRes.status === 200, 'School Administrator has read access to inventory reports');

  const schoolAdminOperationalRes = await fetch(`${BASE_URL}/api/admin/posts/${itemId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${schoolAdminToken}` },
    body: JSON.stringify({ note: 'Admin trying operational action' })
  });
  assert(schoolAdminOperationalRes.status === 403, 'School Administrator blocked from operational publishing actions (HTTP 403)');

  // 6.2 System Admin cannot perform operational property releases without Guidance Head role
  const sysAdminReleaseRes = await fetch(`${BASE_URL}/api/admin/claims/${winningClaim.id}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${systemAdminToken}` },
    body: JSON.stringify({ recipientName: 'SysAdmin Impersonation' })
  });
  assert(sysAdminReleaseRes.status === 403, 'System Administrator blocked from operational property release (HTTP 403)');

  // 6.3 Public Feed Privacy: Finder details and document attachments NOT exposed to claimants
  const publicFeedRes = await fetch(`${BASE_URL}/api/posts`);
  const publicFeed = await publicFeedRes.json();
  const samplePublicItem = publicFeed[0];
  assert(samplePublicItem && !samplePublicItem.finderContact, 'Public feed completely conceals finder contact information');
  assert(!samplePublicItem.privateVerificationDetails && !samplePublicItem.documents, 'Public feed conceals private verification details and documents');

  // Summary
  console.log('\n======================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTasks1to6Verification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
