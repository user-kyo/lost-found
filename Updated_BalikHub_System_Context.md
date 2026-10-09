# BalikHub: System Context

Use this file as the single source of truth when building BalikHub (give it to your coding assistant, and keep it in the repo root). Items marked **[PAPER]** are fixed by your paper and must not change without updating the paper. Items marked **[DECISION]** are my suggestions, which you can change. Items marked **[TODO]** need your input.

---

## 1. What BalikHub is

A web-based central lost-and-found hub for **San Pablo City**, built for CS Elective 2 (Intelligent Systems) at Laguna College. **[PAPER]**

- **Finders** post items they have found (public description plus private verification details) and keep the item until claimed.
- **LGU administrators** review every post before it is published. The system helps them with duplicate and sensitive-detail flags.
- **Owners** do not post anything. They describe a lost item in text or by browser voice input, and the system returns a ranked list of matching published posts.
- An owner may submit a **claim request** on a match. A monitored chat opens between owner and finder. The owner and finder meet at the **LGU office**, where staff verify the claimant and the item, and the finder hands it over in front of staff. The handover is logged.

**The intelligent part** is the matching engine: NLP preprocessing with a Filipino/Taglish lexicon, hybrid TF-IDF vectors (word unigrams + bigrams, plus character n-grams that tolerate typos), and cosine similarity ranking. The same engine powers duplicate flagging. Everything else is ordinary web software.

**The system is advisory, not authoritative.** A similarity score is never proof of ownership, and the system never approves a claim by itself. **[PAPER]**

---

## 2. Hard constraints (do not violate)

1. Matching uses **only the public description** of posts, never the private details. **[PAPER]**
2. Private details are visible **only to the finder who wrote them and to LGU staff**. Owners never receive them from any endpoint. **[PAPER]**
3. Owners see the **ranking only, not similarity scores**. **[DECISION]**
4. Only an LGU admin can approve a post, approve or reject a claim, or mark an item returned. Finders cannot release items. **[PAPER]**
5. Handover happens **at the LGU office only**. **[PAPER]**
6. Software only: no IoT, no RFID/QR scanners, no external ID databases (e.g., PhilSys). Identity verification is manual inspection by staff. **[PAPER]**
7. Single city (San Pablo City), web-based, internet required, no native mobile app, no offline mode. **[PAPER]**
8. No real municipal data. The evaluation uses a **simulated** crowdsourced dataset. **[PAPER]**
9. The matching engine must stay **lexical (TF-IDF + cosine, no embeddings)**. Do not describe it as "semantic" anywhere in the UI, code comments, or paper. **[PAPER]**
10. The system must **accept English, Filipino, and Taglish** descriptions and **tolerate common misspellings** (section 6). Never reject or "correct" a query for its language or spelling. **[PAPER, updated]**

---

## 3. Roles and permissions

| Capability | Owner/Claimant | Finder | LGU Admin |
|---|---|---|---|
| Register and log in | Yes | Yes (records ID type and last 4 digits only) | Created by system admin |
| Describe a lost item (search) | Yes | No | Yes (for testing) |
| See ranked matches (public fields only) | Yes | No | Yes |
| Create a found-item post | No | Yes | No |
| See and edit own post's private details | No | Yes (own posts) | Yes (all) |
| See any post's private details | No | Own only | Yes |
| Review queue (approve, edit, merge, reject posts) | No | No | Yes |
| Submit a claim request | Yes | No | No |
| Use claim chat | Yes (own claims) | Yes (own posts) | Yes (read and join any) |
| Approve or reject claim, log handover | No | No | Yes |
| View audit, rejected-claims, and flag logs | No | No | Yes |

Implement with role-based access control (RBAC) enforced **on the server** for every endpoint, not only in the UI.

---

## 4. End-to-end workflow

1. **Registration.** Owners and finders create accounts. Finders provide valid ID details, stored minimally (ID type and last 4 digits) for LGU reference. **[DECISION: minimal storage]**
2. **Post.** A finder submits a post: category, color, general features (public text), date and area found, and private verification details (brand and model, serial number, contents, marks, names on cards, etc.). The finder keeps the item.
3. **Automated checks** run when the post is submitted (see sections 6.3 and 6.4):
   - Duplicate flag: compare the public text against available posts.
   - Sensitive-detail flag: scan the public text for serial numbers, long digit strings, and card names.
4. **LGU review.** Staff open the review queue, see the flags, and **approve, edit** (e.g., move a detail to the private field), **merge** (with the flagged duplicate), or **reject**. Only approved posts become `available` and visible to owners.
5. **Search.** An owner types or speaks a description. The system preprocesses it, vectorizes it, and ranks available posts.
6. **Claim request.** The owner picks a match and submits a claim. The post status becomes `claim_pending` and a chat opens between owner and finder. LGU staff can read and join it.
7. **Verification and handover.** The owner and finder use the chat to decide on a meetup location:
   - **Option A (LGU Office - Recommended for Security):** They meet at the LGU office. Staff will:
     1. Check the claimant's valid ID.
     2. Interview the claimant on the private details without hints.
     3. Ensure the physical item matches the private record.
     4. Log the official handover in the system (`handover_logs`).
   - **Option B (External Meetup):** They meet independently at a location of their choosing. Once the item is successfully returned, either the finder or the owner can mark the claim as "Returned" in the app to close it.
8. **Close.** Status becomes `returned`. If rejected, or the meetup fails, status returns to `available` and the event is logged.

---

## 5. State machines

**Post status**

```
pending_review -> available        (staff approve)
pending_review -> rejected         (staff reject)
pending_review -> merged           (staff merge into another post)
available      -> claim_pending    (owner submits claim)
claim_pending  -> available        (claim rejected, cancelled, or no-show)
claim_pending  -> returned         (staff log handover)
available      -> archived         (finder withdraws, or expires after [TODO: N days])
```

**Claim status**

```
submitted -> chat_open -> approved -> completed
submitted/chat_open -> rejected
submitted/chat_open -> cancelled     (by owner)
chat_open -> no_show                 (finder or owner does not appear)
```

Rules: a post can have **one active claim at a time**. Rejected claims are kept in a log (`claims` with status plus `rejected_claims_log` view).

---

## 6. The intelligent component (specification)

### 6.1 Preprocessing pipeline **[PAPER, updated]**

Apply in this exact order, to owner queries and post public descriptions alike:

1. Case folding (lowercase).
2. Collapse repeated letters to at most two ("blaaack" becomes "blaack") and strip emoji. **[DECISION]**
3. Remove punctuation, special symbols, and unrelated standalone numbers. **[DECISION]** keep alphanumeric tokens that mix letters and digits (e.g., "A54", "iphone13"), since they identify items. Make this a config flag.
4. Tokenize into words.
5. **Lexicon normalization** (section 6.7): map Filipino, Taglish, and abbreviated terms to one canonical form (pitaka to wallet, cp to phone, itim to black). Includes fuzzy lookup for misspelled lexicon words.
6. Remove stop words: NLTK English list + **Filipino stop-word list** + domain stop words ("lost", "found", "nawala", "nakita"), tuned via `max_df`.
7. Lemmatize English tokens (NLTK WordNetLemmatizer). **There is no Filipino lemmatizer** (NLTK has none). Filipino words are handled by the lexicon and by character n-grams.

Notes:
- No language detector. The pipeline is language-agnostic: every token goes through every step.
- **No general spell-corrector in v1.** Autocorrect tends to damage brand names and Filipino words. Typo tolerance comes from character n-grams (6.2) and the fuzzy lexicon lookup (6.7). **[DECISION]**

### 6.2 Vectorization and matching **[PAPER, updated]**

Two TF-IDF vectorizers are fit on the same preprocessed text:

| Vectorizer | Setting | Purpose |
|---|---|---|
| Word-level | `analyzer="word"`, `ngram_range=(1, 2)`, tuned `min_df`/`max_df` | Distinctive words and word pairs |
| Character-level | `analyzer="char_wb"`, `ngram_range=(3, 5)` (tune), tuned `min_df` | Misspellings, affix variation in Filipino words |

- L2-normalize each vector, then combine them: `hstack([sqrt(alpha) * X_word, sqrt(1 - alpha) * X_char])`. The result is still unit length, and its dot product equals `alpha * cos_word + (1 - alpha) * cos_char`. **One sparse CSR matrix, one dot product.**
- Score = `query_vec @ posts_matrix.T`. Sort descending. Drop scores below the **matching threshold**.
- `alpha` (fusion weight) is a tuned hyperparameter. **[TODO]**
- Worst-case complexity is still O(N x k), but **k is larger** with character n-grams. Re-measure latency. Do not reuse the 4.19 ms figure.
- Only posts with status `available` are in the matrix. Exclude `claim_pending` posts from owner results (or show them as unavailable). **[DECISION]**
- **Threshold values from the old word-only pipeline are invalid.** The score scale changes, so re-derive the threshold with cross-validation.

**Implementation note (important):** scikit-learn's `TfidfVectorizer` does **not** use the paper's exact formulas. It uses raw counts for TF, a smoothed IDF `ln((1+n)/(1+df)) + 1`, then L2 normalization. The paper's Eq. 3.1 to 3.3 use normalized TF and plain `log(N/df)`. Either (a) implement the paper's formulas in a custom vectorizer, or (b) keep scikit-learn and change the paper's equations and text to say the system uses scikit-learn's TF-IDF implementation. Pick one before the defense. Do not leave them inconsistent.

### 6.3 Duplicate flagging **[DECISION, consistent with paper]**

- On each new post, vectorize its public text with the same pipeline (lexicon + hybrid word/character score) and compute similarity against existing available posts.
- If the highest score exceeds the **duplicate threshold**, flag "possible duplicate of Post #X" and show both side by side in the review queue.
- The duplicate threshold is **separate from, and higher than,** the matching threshold. Tune it on the validation split. **[TODO: value]**
- **Advisory only.** Never auto-reject (many items genuinely look alike, e.g., two black wallets).
- Not evaluated in Chapter 4 unless you build a paired test set.

### 6.4 Sensitive-detail flagging (rule-based) **[DECISION]**

Flag the public text if it contains any of these, and suggest moving the detail to the private field:

- 6 or more consecutive digits (phone numbers, ID numbers, card numbers, IMEI).
- Alphanumeric strings of 8 or more characters mixing letters and digits (serial numbers).
- Keywords: `serial`, `imei`, `plate`, `id no`, `license no`, `card no`, `account`, plus a person-name cue such as "name is" or "owned by".

Flags are shown to the reviewer. They do not block posting.

### 6.5 Hyperparameters and tuning **[PAPER, updated]**

- Word `ngram_range`: unigrams only vs. unigrams + bigrams.
- Word `min_df`, `max_df`: tuned to remove domain stop words.
- Character `ngram_range` (for example (3, 4) vs. (3, 5)) and character `min_df`.
- **Fusion weight `alpha`**: grid such as {0.4, 0.5, 0.6, 0.7, 0.8}.
- Fuzzy lexicon rule: maximum edit distance (1) and minimum key length (5).
- Matching threshold: derived from **5-fold cross-validation on the training split only**. **[TODO]**
- Duplicate threshold: tuned on the validation split. **[TODO]**

The 15% test split is used **once**, at the end. The lexicon is also built from training data only (6.7).

### 6.6 Never log or expose

Similarity scores to owners, private details in any owner-facing response, or raw audio.

### 6.7 Domain lexicon (Filipino, Taglish, abbreviations) **[PAPER, updated]**

A CSV file, for example `data/lexicon_fil_en.csv`, with columns `surface, canonical, type, language`. The normalizer replaces each token that matches `surface` with `canonical` before stop-word removal.

**Fuzzy lookup:** if a token is not in the lexicon, find the closest lexicon `surface` by edit distance. Map it only if the distance is 1 or less **and** the lexicon word has at least 5 letters (so "pitka" maps to "pitaka", but short words are never remapped). Tokens that match nothing pass through unchanged.

**Starter entries (verify each with a native Filipino speaker, and extend from your training data):**

| Type | Surface to canonical |
|---|---|
| Items | pitaka to wallet, susi to key, payong to umbrella, relo or orasan to watch, salamin to eyeglasses, sapatos to shoes, tsinelas to slippers, selpon or cellphone or cp to phone |
| Colors | itim to black, puti to white, pula to red, asul to blue, berde to green, dilaw to yellow, kayumanggi to brown, abo to gray |
| Materials | balat to leather, plastik to plastic, tela to cloth |
| Abbreviations | blk to black, wht to white |

**Filipino stop-word starter list:** ang, ng, sa, na, ko, ako, ay, mga, po, opo, yung, yun, ito, iyon, ni, kay, nasa, mo.

**Rules:**
- Build the lexicon from the **training split and public vocabulary only**. Adding terms found in the test split is data leakage.
- Keep it as a plain file reviewed by a developer. A lexicon editor is out of scope.
- Coverage is limited by design. Say so in the paper.

---

## 7. Data model (suggested schema)

Use **PostgreSQL** (or SQLite for the prototype). **[DECISION]**

| Table | Key columns |
|---|---|
| `users` | id, role (`owner`/`finder`/`admin`), full_name, email, phone, password_hash, id_type, id_last4 (finders), status, created_at |
| `posts` | id, finder_id, category, color, public_description, date_found, area_found, status, reviewed_by, reviewed_at, created_at, updated_at |
| `post_private_details` | post_id (PK/FK), details (text), updated_at. **Separate table so it is never selected by owner endpoints.** |
| `post_flags` | id, post_id, type (`duplicate`/`sensitive`), related_post_id, score, detail, resolved_by, resolved_at |
| `review_actions` | id, post_id, admin_id, action (`approve`/`edit`/`merge`/`reject`), note, created_at |
| `search_logs` | id, user_id, query_text, result_count, created_at (for rate limits and analysis) |
| `claims` | id, post_id, owner_id, status, owner_note, created_at, decided_by, decided_at, reject_reason |
| `chat_threads` | id, claim_id, status |
| `chat_messages` | id, thread_id, sender_id, body (masked), is_staff, created_at |
| `user_reports` | id, reporter_id, reported_id, thread_id, reason, created_at |
| `user_blocks` | blocker_id, blocked_id, created_at |
| `handover_logs` | id, claim_id, post_id, admin_id, claimant_name, claimant_id_type, finder_id, questions_asked (text), result, notes, created_at |
| `audit_log` | id, actor_id, action, entity, entity_id, metadata (JSON), created_at |

Add indexes on `posts(status)`, `claims(post_id, status)`, `search_logs(user_id, created_at)`.

Data minimization: store ID **type and last 4 digits only**. Never store ID images. **[DECISION]**

---

## 8. API outline (suggested, REST/JSON)

**Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`

**Owner**
- `POST /search` body `{query}` -> ranked list of **public fields only** (id, category, color, public_description, date_found, area_found). No scores.
- `POST /claims` body `{post_id, note}`
- `GET /claims/mine`, `POST /claims/{id}/cancel`

**Finder**
- `POST /posts` body `{category, color, public_description, date_found, area_found, private_details}`
- `GET /posts/mine`, `PATCH /posts/{id}` (only while `pending_review` or `available`), `POST /posts/{id}/withdraw`

**Chat (claim participants and admins)**
- `GET /claims/{id}/chat`, `POST /claims/{id}/chat` (mask contacts before saving)
- `POST /reports`, `POST /blocks`

**Admin**
- `GET /admin/review-queue` (posts with flags and private details)
- `POST /admin/posts/{id}/approve | edit | merge | reject`
- `GET /admin/claims`, `POST /admin/claims/{id}/approve | reject | no-show`
- `POST /admin/handovers` (logs the verification and marks `returned`)
- `GET /admin/logs/rejected-claims | audit | flags`

Every endpoint checks role, ownership, and status transitions server-side.

---

## 9. Safeguards (implement all) **[PAPER, details are DECISIONS]**

| Safeguard | Suggested default [TODO: tune] |
|---|---|
| Account required to post, search, or claim | Always |
| Search rate limit per account | 20 searches / hour |
| Claim requests per account | Max 3 active, max 5 per day |
| Flag repeated unrelated claims | 3+ rejected claims in 30 days |
| Flag finders with repeated rejected or no-show posts | 3+ in 30 days |
| Rejected-claims log | Every rejection stored with reason |
| Chat contact masking | Regex-mask phone numbers, emails, street addresses before saving |
| Chat logging | All messages stored, readable by admins |
| Audit logging | Every approve, reject, edit, merge, claim decision, handover |
| Passwords | bcrypt or argon2 |
| Sessions | Secure cookies or short-lived tokens, CSRF protection, HTTPS |
| Input handling | Validate and escape all user text (XSS), parameterized queries (SQL injection) |

Honest limitation: the security of the verification process still depends on staff following the procedure.

---

## 10. Chat rules **[DECISION, consistent with paper]**

- A chat opens only after a claim request, between the owner and the finder of that post.
- LGU staff can read and join any chat.
- Purpose: clarify questions and agree on a time to meet **at the LGU office**.
- Mask phone numbers, emails, and street addresses. Show a visible warning: never share private details, never hand over the item outside the LGU office.
- Report and block buttons. Reports go to the LGU admin queue.
- The chat is a **supporting feature and is not evaluated**.
- Chat logs are personal data. Handle per the Data Privacy Act of 2012 and LGU policy. Retention period: **[TODO]**.

---

## 11. Voice input **[PAPER]**

- Use the browser **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) with the standard device microphone.
- Speech is converted to text and placed in the same editable search box, so the owner can correct it before searching.
- Do not store audio.
- Detect support and fall back to text input when unavailable (support varies by browser).
- Offer a language toggle: English (`en-PH`) and Filipino (`fil-PH`). Browser support for Filipino varies, so detect support and fall back to text. Transcription errors (especially for Taglish) flow into the same typo-tolerant matcher. Voice accuracy is **not evaluated**. State this as a limitation.

---

## 12. Screens

**Owner:** register/login, search (text box + mic button), results list (public fields only), claim form, my claims, claim chat, notifications.
**Finder:** register/login, new post form (public vs. private sections clearly separated, with warning "do not put serial numbers or card names in the public description"), my posts with status, claim chat.
**Admin:** review queue (post, flags, side-by-side duplicate view, approve/edit/merge/reject), claims list, verification form (ID type, name, questions asked, answers vs. private record, approve/reject), handover log, flagged users, reports, audit log.

Status updates can be in-app only. Email is optional.

---

## 13. Tech stack **[PAPER, with DECISIONS marked]**

- **Python** backend with **Flask or FastAPI** (paper allows either; FastAPI suggested). **[DECISION]**
- **NLTK** (tokenization, stop words, lemmatization), **scikit-learn** (TF-IDF, cosine), **SciPy** (CSR sparse matrices), **pandas**, **NumPy**.
- **Jupyter Notebooks** for tuning, cross-validation, and evaluation.
- Frontend: simple server-rendered pages or a small SPA. **[DECISION]**
- Database: PostgreSQL or SQLite. **[DECISION]**
- VS Code, Git. Run on a consumer-grade machine (16 GB RAM, no GPU).

Suggested structure:

```
balikhub/
  app/
    main.py            # app entry
    auth/              # login, RBAC
    posts/             # finder posts, review queue
    claims/            # claims, handover, chat
    nlp/
      preprocess.py    # pipeline from 6.1
      matcher.py       # TF-IDF + cosine + threshold
      flags.py         # duplicate + sensitive-detail checks
      lexicon.py       # Filipino/Taglish normalization + fuzzy lookup
    models/            # DB models
    templates/ or web/ # frontend
  notebooks/
    01_dataset_profile.ipynb
    02_tuning_cv.ipynb
    03_evaluation_baselines.ipynb
    04_latency.ipynb
  data/                # simulated dataset (no real PII), lexicon_fil_en.csv
  tests/
  config.py            # thresholds, rate limits, flags
  BalikHub_System_Context.md
```

Refit rule **[DECISION]**: the vectorizer and post matrix are rebuilt whenever a post becomes `available` or leaves that state (fine at 1,000 posts). Cache the fitted objects in memory.

---

## 14. Evaluation harness (what Chapter 4 needs)

**Dataset (simulated) [PAPER]**
- ~1,000 records: each is a lost-item description (query) paired with exactly one found-item public description. Categories: personal IDs, electronic devices, wallets, functional accessories.
- Collected by crowdsourcing respondents who write hypothetical scenarios. No real logbooks or PII.
- Respondents may write in **English, Filipino, or Taglish** and are **not asked to correct spelling**. Include enough Filipino and Taglish records to report them separately.
- Columns (suggested): `pair_id, category, language (en/fil/taglish), lost_text, found_text`.
- Manually annotated ground truth: each lost text maps to its one found text.
- Split **70/15/15, stratified by category**: 700 train, 150 validation, 150 test.
- **[TODO]** State the test gallery: the 150 test found items only, or all 1,000.

**Procedure**
1. Fit vocabulary and IDF on the training split only.
2. 5-fold cross-validation on the training split to tune `ngram_range`, `min_df`, `max_df`, and the matching threshold.
3. Tune the duplicate threshold on the validation split (if evaluated).
4. Evaluate **once** on the test split.

**Baselines**
1. Boolean exact keyword matching (no lemmatization, weighting, or scoring).
2. Bag-of-Words + Jaccard similarity.
3. BalikHub (TF-IDF + cosine).

**Metrics**
- Top-1 and Top-5 accuracy, Precision, Recall, F1 (macro), **MRR**.
- TP: the true item is in the filtered candidate list. FP: an irrelevant item above the threshold. FN: the true item is absent or below the threshold. An empty list counts as FN.
- Since each query has one true match, **Recall@K = Top-K accuracy**. State this in the paper.
- No loss curves (deterministic model, nothing is trained with gradients).
- **Latency:** mean, SD, 95th percentile, and max over 150 random test queries, on the 1,000-record database, split into preprocessing and vectorization/matching. Use `time.perf_counter()`, warm up first, and repeat runs.
- **Significance:** McNemar's test on paired per-query Top-1 outcomes (BalikHub vs. Bag-of-Words), or a clearly labeled per-fold t-test.

**Misspelling and language tests (new)**
- **Ablation:** word-level only, character-level only, and hybrid (word + character + lexicon).
- **Typo robustness:** corrupt 0%, 10%, and 20% of the words in each test query (random deletion, substitution, transposition, doubled letters) with fixed seeds, and report Top-1 and Top-5 for each variant.
- **Language slices:** Top-1 and Top-5 separately for English, Filipino, and Taglish queries.
- Re-run the **baselines on the same new dataset**. Old numbers (74.67 / 89.33 / 0.866 / 4.19 ms) came from the word-level pipeline and are no longer the system's results.
- Re-measure latency for the hybrid pipeline.

**Integrity rule:** every number in the paper must come from a notebook you can re-run (fix random seeds). The Chapter 4 numbers currently in the paper (74.67 / 89.33 / 0.866 / 4.19 ms, etc.) must be reproducible. Never hardcode them in the app.

---

## 15. Out of scope (do not build, or label as future work)

Image matching, embeddings or transformer models, a Filipino lemmatizer or stemmer, a full-coverage lexicon or lexicon editor, other regional languages, a general spell-corrector, attribute extraction (NER), multi-city support, offline mode, native mobile app, push notifications, payments, external ID verification, QR/RFID, IoT lockers, and quantitative evaluation of voice, chat, workflow effectiveness, or duplicate flagging (unless you add a test set).

---

## 16. Acceptance checks

1. An owner search never returns a private field, in the response body, the HTML, or the API (test this directly).
2. A post is invisible to owners until an admin approves it.
3. Only admins can approve claims or mark an item `returned`.
4. A post with a serial-number-like string in the public text gets a sensitive-detail flag.
5. Two nearly identical posts: the second is flagged as a possible duplicate.
6. A second claim on a `claim_pending` post is refused.
7. Chat messages containing a phone number or email are masked before saving.
8. Rate limits trigger on the 21st search within an hour.
9. Every approve, reject, and handover writes an audit entry.
10. The matcher returns the correct item in the top 5 on a sample of your test pairs, and a single query on 1,000 posts runs in a few milliseconds on your laptop.
11. A query "walet" returns a post that says "wallet" in the top results.
12. A query "itim na pitaka" returns a post that says "black wallet", and the Filipino stop words ("na") do not affect the score.
13. A query with a typo in a lexicon word ("pitka") is mapped to "wallet".
14. The system never rejects or alters a query because of its language or spelling.

---

## 17. Open items to resolve

- [ ] Matching threshold (from cross-validation) and duplicate threshold.
- [ ] Custom TF-IDF vs. scikit-learn defaults, and the matching paper equations.
- [ ] Test gallery definition (150 vs. 1,000).
- [ ] Numeric-token handling in preprocessing.
- [ ] Chat log retention period and post expiry period.
- [ ] Final rate-limit values.
- [ ] Database choice (PostgreSQL vs. SQLite).
- [ ] How respondents were assigned so the same person did not write both sides of a pair (or state it as a limitation).
- [ ] Lexicon size, who validates it (a Filipino speaker), and that it is built from training data only.
- [ ] Final character n-gram range and fusion weight `alpha`.
- [ ] Re-run all Chapter 4 results with the hybrid pipeline and update the abstract and Chapter 5.

---

## 18. Glossary

**Owner/claimant:** a user who lost an item. **Finder:** a user who found one. **Public description:** the text shown to owners and used for matching. **Private details:** specifics only the finder and LGU see, used for verification. **Handover:** the supervised transfer of the item at the LGU office. **TF-IDF:** term weighting by distinctiveness. **Cosine similarity:** angle-based similarity between vectors. **CSR:** compressed sparse row matrix format. **MRR:** mean reciprocal rank. **Character n-gram:** a short run of letters inside a word (e.g., "wal", "all", "lle"), used so misspelled words still match. **Lexicon:** the lookup table mapping Filipino, Taglish, and abbreviated terms to one canonical word. **Taglish:** mixed Tagalog and English.
