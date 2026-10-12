# BalikHub Project Tracker

This document tracks the implementation status of all core functionalities within the BalikHub Lost & Found system.

## 🟢 Fully Implemented & Working

### 1. Authentication & Users
- [x] JWT-based Authentication (Login/Register)
- [x] Bcrypt password hashing
- [x] Role-based access control (Citizen vs. Admin)
- [x] Fetch current user profile (`/api/auth/me`)

### 2. Item Lifecycle (Lost & Found)
- [x] **Report Found Item:** Citizens can submit found items.
- [x] **Voice Input:** Voice recording transcribes speech and appends to the description correctly (Requires HTTPS on mobile).
- [x] **Sensitive Data Check:** Node.js fallback correctly detects IDs/Phone numbers and flags them.
- [x] **Admin Review Queue:** Admins can view pending items and approve/reject/merge them.
- [x] **Admin Inventory:** Grid view of all approved items.

### 3. Claims & Handover
- [x] **Submit Claim:** Users can claim an item from the public feed.
- [x] **Claim Management:** Admins can review claims and open chat channels.
- [x] **Secure Handover:** Admins can log physical handovers at the LGU office with ID checks.
- [x] **Independent Meetup:** Users can arrange an external meetup, which successfully resolves the claim and archives the item.

### 4. Messaging
- [x] **Chat Threads:** Secure messaging between claimants and admins/finders.
- [x] **Database Persistence:** Messages and threads are correctly stored and retrieved.

### 5. Policy & Operational Governance
- [x] **Authoritative Holding Period:** 45 school days verified and confirmed in SQLite `system_configurations` (approved by Guidance Board).
- [x] **Guidance Office Identity-Verification Procedures:** Approved policy `LC-GO-IVP-2026.1` institutionalized with multi-tier credential acceptance and receipt acknowledgment.
- [x] **Unclaimed Item Disposition Rules:** Approved rules `LC-GO-UIDR-2026.1` enforcing 45 school days custody, 5-point document checklist certification, and statutory 6-month civil separation.
- [x] **Centralized Status Transitions:** Validated across items and claims with concurrency locks preventing race conditions.
- [x] **Audit Logging:** Non-destructive immutable logging across system configurations, status transitions, and document operations.

---

## 🟡 Partially Working / Using Fallbacks

### 1. NLP (Natural Language Processing)
- [x] **TF-IDF Model Persistence:** Python hybrid TF-IDF vectorizer and database matrix are persisted to disk via `joblib` at `backend/data/tfidf_model.joblib`.
- [x] **Bilingual Keyword-Matching Fallback:** Node.js fallback now loads `backend/data/lexicon_fil_en.csv` with bidirectional English-Tagalog token expansion (`pitaka` $\leftrightarrow$ `wallet`, `susi` $\leftrightarrow$ `key`, `itim` $\leftrightarrow$ `black`) and weighted field scoring (Category: 35, Color: 25, Area: 15, Description: 20).
- [x] **Match Scoring & Similarity Analysis:** `/api/nlp/match-analyze` endpoint implemented with bilingual fallback returning structured confidence, similarity scores, and discrepancy protections.
- [ ] **Dual Service Orchestration:** Python FastAPI process runs standalone on port 8000; Node fallback provides full offline resilience when Python process is unlaunched.

### 2. Image Handling
- [ ] **Image Uploads:** The database accepts Image URLs, but there is no Cloudinary/S3 integration for uploading physical photos from a mobile device camera.

---

## 🔴 Missing or Not Working

### 1. Real-Time Interactions
- [ ] **Push Notifications / WebSockets:** Chat messages and claim approvals require a manual page refresh to appear. No `Socket.io` implemented yet.

### 2. Advanced Moderation
- [ ] **Duplicate Detection:** The system does not currently prevent or flag a user reporting the exact same item twice.

### 3. Mobile Hardware Features
- [ ] **Mobile Microphone:** Blocked on mobile phones over local network due to `http://`. Requires `https://` (SSL) to function natively on mobile.

---

## Next Steps / Priorities
1. Run automated launcher daemon for Python NLP FastAPI engine alongside TypeScript Node server.
2. Implement Cloudinary/S3 storage adapter for mobile item photo uploads.
3. Add Socket.io for real-time claim updates and messaging.

