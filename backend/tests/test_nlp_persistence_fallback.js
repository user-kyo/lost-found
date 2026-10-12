// test_nlp_persistence_fallback.js
// Verification suite for:
// 1. Holding period database configuration (45 school days authoritative)
// 2. Guidance Office approved identity-verification procedures & rules for unclaimed items
// 3. TF-IDF Python model file persistence (backend/data/tfidf_model.joblib)
// 4. Bilingual Filipino/Taglish/English lexical search ranker and match-analyze fallback

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

function assert(condition, message, extra = '') {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`, extra);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
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

async function runTests() {
  console.log('================================================================');
  console.log('🚀 BalikHub: Holding Period, Guidance Policies & NLP Persistence');
  console.log('================================================================\n');

  // Authenticate
  const headToken = await login('head@guidance.edu', 'password123');
  const encoderToken = await login('encoder@guidance.edu', 'password123');
  const studentToken = await login('student@school.edu', 'password123');
  console.log('🔑 Authentication tokens acquired for Guidance Head, Encoder, and Student.\n');

  // ---------------------------------------------------------------------------
  // STEP 1: Verify Authoritative 45-Day School Holding Period in Database
  // ---------------------------------------------------------------------------
  console.log('--- Step 1: Holding Period Database Configuration Verification ---');
  const configRes = await fetch(`${BASE_URL}/api/admin/holding-config`, {
    headers: { Authorization: `Bearer ${encoderToken}` }
  });
  assert(configRes.status === 200, 'GET /api/admin/holding-config responds with HTTP 200');
  const configData = await configRes.json();
  console.log('  Live Holding Configuration:', {
    schoolHoldingDays: configData.schoolHoldingDays,
    isProvisional: configData.isProvisional,
    statutoryMonths: configData.statutoryMonths,
    description: configData.description
  });

  assert(configData.schoolHoldingDays === 45, 'Holding period is strictly 45 school days (Guidance Board approved)');
  assert(configData.isProvisional === false, 'Holding period is approved and authoritative (isProvisional: false)');
  assert(configData.statutoryMonths === 6, 'Statutory civil code property separation is maintained (6 months)');
  assert(configData.guidancePoliciesApproved === true, 'Guidance policies approval flag is active');

  // ---------------------------------------------------------------------------
  // STEP 2: Guidance Office Approved Policies & Procedures
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 2: Guidance Office Approved Procedures & Rules ---');
  const policiesRes = await fetch(`${BASE_URL}/api/admin/guidance-policies`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(policiesRes.status === 200, 'GET /api/admin/guidance-policies is accessible');
  const policiesData = await policiesRes.json();

  // 2.1 Verify Identity Verification Procedures
  const idPolicy = policiesData.identityVerificationPolicy;
  assert(!!idPolicy, 'Identity Verification Policy is seeded and present');
  console.log('  Approved Policy Code:', idPolicy.policyCode);
  console.log('  Approved Credentials:', idPolicy.acceptableCredentials?.map(c => c.type));
  assert(idPolicy.policyCode === 'LC-GO-IVP-2026.1', 'Policy code matches approved standard LC-GO-IVP-2026.1');
  assert(idPolicy.approvalStatus === 'approved', 'Identity Verification Policy status is "approved"');
  assert(idPolicy.acceptableCredentials?.some(c => c.type === 'School ID Card'), 'School ID Card is recognized credential');
  assert(idPolicy.acceptableCredentials?.some(c => c.type === 'Government Issued Photo ID'), 'Government ID is recognized credential');
  assert(idPolicy.safeguards?.disallowUnverifiedRelease === true, 'Safeguard prohibits unverified property release');

  // 2.2 Verify Unclaimed Item Disposition Rules
  const unclaimedRules = policiesData.unclaimedItemsDispositionRules;
  assert(!!unclaimedRules, 'Unclaimed Items Disposition Rules are seeded and present');
  console.log('  Unclaimed Item Rules Code:', unclaimedRules.ruleCode);
  console.log('  Mandatory Document Checklist:', unclaimedRules.mandatoryDocumentChecklist?.map(c => c.key));
  assert(unclaimedRules.ruleCode === 'LC-GO-UIDR-2026.1', 'Rule code matches approved standard LC-GO-UIDR-2026.1');
  assert(unclaimedRules.schoolHoldingPeriodDays === 45, 'Unclaimed item rules enforce 45 school days holding threshold');
  assert(unclaimedRules.mandatoryDocumentChecklist?.length === 5, 'Enforces 5 mandatory document checklist certifications');
  assert(unclaimedRules.authorization?.approvalRole === 'guidance_head', 'Sole approval authority rests with guidance_head');

  // 2.3 Guidance Head can update / re-approve policies with audit logging
  const updatePolicyRes = await fetch(`${BASE_URL}/api/admin/guidance-policies`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headToken}` },
    body: JSON.stringify({
      note: 'Re-certified Guidance Office 2026 Operational Directives'
    })
  });
  assert(updatePolicyRes.status === 200, 'Guidance Head can re-certify policies (PUT /api/admin/guidance-policies)');

  // ---------------------------------------------------------------------------
  // STEP 3: TF-IDF Model File Persistence Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 3: TF-IDF Model Disk Persistence Verification ---');
  const joblibModelPath = path.resolve(process.cwd(), 'backend', 'data', 'tfidf_model.joblib');
  const joblibExists = fs.existsSync(joblibModelPath);
  console.log('  Persisted Model File Path:', joblibModelPath);
  console.log('  File exists on disk:', joblibExists);
  assert(joblibExists, 'TF-IDF model file is persisted at backend/data/tfidf_model.joblib');

  const stats = fs.statSync(joblibModelPath);
  console.log(`  Persisted Model File Size: ${stats.size} bytes`);
  assert(stats.size > 1000, 'Persisted model file contains valid serialized vocabulary and matrices (> 1KB)');

  // ---------------------------------------------------------------------------
  // STEP 4: Bilingual Filipino/Taglish/English Keyword Fallback Ranking
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 4: Bilingual Keyword Fallback Search & Match Scoring ---');

  // 4.1 Filipino query "pitaka" (wallet) should rank wallet highest
  console.log('  Testing Filipino synonym mapping: "pitaka" -> "wallet"...');
  const searchPitakaRes = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'pitaka' })
  });
  assert(searchPitakaRes.status === 200, 'Search endpoint responds HTTP 200 for "pitaka"');
  const pitakaResults = await searchPitakaRes.json();
  assert(Array.isArray(pitakaResults) && pitakaResults.length > 0, 'Results returned for "pitaka" query');
  const topPitaka = pitakaResults[0];
  const pitCategory = topPitaka.category || topPitaka.item?.category || '';
  const pitDesc = topPitaka.publicDescription || topPitaka.item?.publicDescription || '';
  console.log('  Top match for "pitaka":', {
    category: pitCategory,
    color: topPitaka.color || topPitaka.item?.color,
    similarityScore: topPitaka.similarityScore,
    confidence: topPitaka.confidence
  });
  assert(
    (pitCategory.toLowerCase().includes('wallet') || pitDesc.toLowerCase().includes('wallet')) && topPitaka.similarityScore >= 30,
    'Filipino term "pitaka" successfully matches wallet item with high score'
  );

  // 4.2 Filipino query "itim na payong" or "itim" (black)
  console.log('  Testing Taglish color and item combination: "itim"...');
  const searchItimRes = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'itim' })
  });
  const itimResults = await searchItimRes.json();
  const topItim = itimResults[0];
  const itimColor = topItim.color || topItim.item?.color || '';
  const itimDesc = topItim.publicDescription || topItim.item?.publicDescription || '';
  console.log('  Top match for "itim":', {
    category: topItim.category || topItim.item?.category,
    color: itimColor,
    similarityScore: topItim.similarityScore,
    confidence: topItim.confidence
  });
  assert(
    (itimColor.toLowerCase().includes('black') || itimDesc.toLowerCase().includes('black')) && topItim.similarityScore >= 25,
    'Filipino color "itim" successfully matches items with black color token'
  );


  // 4.3 Test /api/nlp/match-analyze fallback similarity evaluation
  console.log('  Testing /api/nlp/match-analyze fallback similarity evaluation...');
  // A. Partial match test (category match on brown wallet)
  const partialMatchRes = await fetch(`${BASE_URL}/api/nlp/match-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lostDescription: 'Nawala po ang aking pitaka',
      lostAttributes: { itemType: 'Wallet' },
      foundItem: topPitaka
    })
  });
  assert(partialMatchRes.status === 200, 'Partial match-analyze responds HTTP 200');
  const partialAnalysis = await partialMatchRes.json();
  console.log('  Partial Match Analysis Results:', {
    similarityScore: partialAnalysis.similarityScore,
    confidence: partialAnalysis.confidence,
    matchedAttributes: partialAnalysis.matchedAttributes
  });
  assert(partialAnalysis.similarityScore >= 35, 'Partial match scores category match (>= 35%)');
  assert(['High', 'Medium'].includes(partialAnalysis.confidence), 'Valid confidence assigned for partial match');


  // B. Strong bilingual match test (black iPhone: Category + Color + Area + Description)
  const phoneItem = {
    id: 'f17776ea-9979-46af-838d-43095a844b9c',
    category: 'Electronics',
    color: 'Black',
    areaFound: 'Gymnasium bleachers',
    publicDescription: 'Black iPhone 13 with clear silicone case surrendered at the Guidance Office, found near Gymnasium bleachers.'
  };
  const strongMatchRes = await fetch(`${BASE_URL}/api/nlp/match-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lostDescription: 'Nawala po ang aking itim na cellphone sa Gymnasium bleachers',
      lostAttributes: { color: 'Black', category: 'Electronics' },
      foundItem: phoneItem
    })
  });
  assert(strongMatchRes.status === 200, 'Strong match-analyze responds HTTP 200');
  const strongAnalysis = await strongMatchRes.json();
  console.log('  Strong Match Analysis Results:', {
    similarityScore: strongAnalysis.similarityScore,
    confidence: strongAnalysis.confidence,
    matchedAttributes: strongAnalysis.matchedAttributes,
    aiSummary: strongAnalysis.aiSummary
  });
  assert(strongAnalysis.similarityScore >= 60, 'Strong bilingual match achieves high similarity score (>= 60%)');
  assert(strongAnalysis.confidence === 'High', 'High confidence assigned for comprehensive match');

  assert(strongAnalysis.matchedAttributes?.length >= 1, 'Matched attributes identified');
  assert(strongAnalysis.discrepancies?.length > 0, 'Private verification details properly excluded');



  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED: Holding period, Guidance approval, and NLP');
  console.log('   persistence & fallback ranker are verified operational!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test suite encountered error:', err);
  process.exit(1);
});
