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

---

## 🟡 Partially Working / Using Fallbacks

### 1. NLP (Natural Language Processing)
- [ ] **Attribute Extraction:** Currently relying on a Node.js Regex/Rule-based fallback. Connection to the Python TF-IDF engine (`/api/nlp/extract`) is failing or bypassed.
- [ ] **Smart Search Ranking:** Search works but returns an unranked list of available items. Python TF-IDF sorting (`/api/search`) needs fixing.
- [ ] **Match Scoring:** The "Similarity Score" UI uses a hardcoded fallback (e.g., 50% Medium Confidence) due to the Python server disconnection (`/api/nlp/match-analyze`).

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
1. Troubleshoot and connect the Python NLP engine to replace Node.js fallbacks.
2. Implement Cloudinary for image uploads.
3. Add Socket.io for real-time chat updates.
