# ProofChain — 1-Month MCA Enhancement Plan

> **Context:** MCA Final Year Project · 30-day window
> **Goal:** Ship meaningful, demo-able improvements that show technical depth without over-engineering
> **Principle:** Every feature chosen is (a) completable in 2-4 days, (b) academically impressive, and (c) directly improves the core forensics workflow.

---

## What This Plan Does NOT Include (And Why)

| Skipped Feature | Why Skipped |
|----------------|-------------|
| Background job queue (BullMQ) | 1 week of infra work, no visual impact for viva |
| Redis caching | DevOps complexity, no user-facing benefit to show |
| Polygon mainnet migration | Costs real MATIC, out of scope |
| Multi-tenant architecture | Enterprise feature, months of work |
| HSM/KMS key management | Cloud infra, not MCA scope |
| Deepfake detection API | Paid third-party, unpredictable quality |
| Kubernetes deployment | Not needed to demonstrate the project |
| SSE real-time updates | Nice-to-have, complex to demo reliably |

---

## The 8 Features to Build in 30 Days

| # | Feature | Days | Academic Value | Demo Impact |
|---|---------|------|---------------|-------------|
| 1 | AI Score Gauge + Breakdown Chart | 2 days | Data visualization | Very High |
| 2 | Extended EXIF Flags (12 signals, was 4) | 2 days | Forensics depth | Very High |
| 3 | Multi-File AI Analysis (per-file reports) | 3 days | AI depth | High |
| 4 | Case Comments (Investigator ↔ Analyst) | 3 days | Collaboration system | High |
| 5 | Verdict Appeal Flow | 3 days | Workflow completeness | High |
| 6 | Forensic Certificate PDF Export | 3 days | Professional output | Very High |
| 7 | Rate Limiting on Public API | 1 day | Security hardening | Medium |
| 8 | Forgot Password / Reset Flow | 2 days | Auth completeness | Medium |

**Total: ~19 coding days.** Remaining 11 days for testing, polish, documentation, and viva prep.

---

## Week 1 (Days 1-7): AI & Analysis Depth

### Day 1-2: AI Score Gauge + Breakdown Chart

**What:** Replace the plain tamper score badge with a visual gauge and per-signal bar chart.

**New components needed:**

`src/components/TamperGauge.tsx`
- SVG arc gauge (0-100) with color zones: green (0-30), amber (31-60), red (61-100)
- Animated fill using CSS stroke-dasharray
- Shows score number + risk label in center

`src/components/ScoreBreakdownChart.tsx`
- Recharts BarChart (horizontal layout)
- One bar per scoring signal (EXIF flags, Gemini result, PDF check)
- Color-coded: red for high-point signals, amber for medium, green for low
- Tooltip on hover shows the detail text from scoreBreakdown

**Where to wire:**
- `src/components/AiReportPanel.tsx` — replace TamperScoreBadge with TamperGauge, add ScoreBreakdownChart below AI summary

**Backend:** No changes needed — scoreBreakdown already exists on AiReport model.

**SIGNAL_LABELS map to add in AiReportPanel:**
```typescript
const SIGNAL_LABELS: Record<string, string> = {
  editing_software: "Editing Software Detected",
  modification_after_creation: "Modified After Creation",
  gps_absent_on_field_incident: "GPS Absent (Field Incident)",
  no_creation_timestamp: "No Creation Timestamp",
  gemini_high: "AI Visual Analysis: High Risk",
  gemini_medium: "AI Visual Analysis: Medium Risk",
  pdf_no_text_layer: "PDF: No Text Layer (Scanned)",
};
```

---

### Day 3-5: Extended EXIF Analysis (12 Signals)

**What:** Upgrade `ai-service/exif.py` from 4 forensic flags to 12. Makes AI analysis demonstrably stronger.

**New flags to add to `_compute_flags()` in exif.py:**

1. `thumbnail_dimension_mismatch` — Embedded thumbnail dimensions don't match main image. Photoshop often regenerates thumbnails.
2. `gps_precision_anomaly` — GPS has more than 6 decimal places = possible manual entry.
3. `future_timestamp` — Creation timestamp is in the future = impossible metadata.
4. `software_field_contradiction` — XMP:CreatorTool and EXIF:Software fields say different things.
5. `screenshot_tool_detected` — SnagIt, Greenshot, ShareX, etc. in software field.
6. `instant_modification` — File modified within 5 seconds of creation = batch processing signature.
7. `device_make_contradiction` — EXIF:Make vs Composite:Make don't match.
8. `uncalibrated_color_space` — ColorSpace=65535 (uncalibrated) without ICC profile = synthetic image.

**Update scorer.py** to score the new flags (add to FLAG_SCORES dict):
```python
FLAG_SCORES_NEW = {
    "thumbnail_dimension_mismatch": 15,
    "gps_precision_anomaly": 10,
    "future_timestamp": 25,
    "software_field_contradiction": 20,
    "screenshot_tool_detected": 15,
    "instant_modification": 10,
    "device_make_contradiction": 15,
    "uncalibrated_color_space": 10,
}
```

**Update AiReportPanel.tsx** — add the 8 new flag labels to the flagLabels map.

---

### Day 6-7: Multi-File AI Analysis

**What:** Currently only 1 AI report per case (aiReportId: ObjectId). Multi-file cases need per-file reports.

**Step 1 — Update Case model:**
```typescript
// Replace: aiReportId: Types.ObjectId | null
// With:
aiReportIds: Types.ObjectId[];
overallTamperScore: number | null;
overallRiskLevel: "low" | "medium" | "high" | null;
```

**Step 2 — Update AI trigger (after upload):**
- Loop over all case.files
- Call AI service once per file (pass fileId + filePath)
- Create one AiReport document per file
- Push all IDs into aiReportIds
- Compute overallTamperScore = Math.max(...all file scores)
- Compute overallRiskLevel from overallTamperScore

**Step 3 — New API endpoint:**
`GET /api/cases/[id]/ai-all` — returns array of all AiReport docs for this case

**Step 4 — Update UI:**
- Replace single AiReportPanel with an accordion (one panel per file)
- Each accordion item shows the file name + TamperScoreBadge as the header
- Expands to show full AiReportPanel for that file
- Add "Overall Risk" summary card above the accordion

---

## Week 2 (Days 8-14): Workflow Features

### Day 8-10: Case Comments

**What:** Threaded messaging between the Investigator and Analyst inside each case.

**New model: `src/lib/models/Comment.ts`**
```typescript
{
  caseId: string;         // index
  authorId: ObjectId;
  authorRole: string;
  authorName: string;
  content: string;        // max 2000 chars
  isInternal: boolean;    // true = analyst-only (hidden from investigator)
  deletedAt: Date | null; // soft delete
  createdAt: Date;
}
```

**New API: `src/app/api/cases/[id]/comments/route.ts`**
- `GET` — returns comments; if user.role === "investigator", filter out isInternal=true
- `POST` — creates comment; isInternal forced to false if author is investigator
- Auth: all three roles (investigator, analyst, admin)

**New component: `src/components/CommentsPanel.tsx`**
- Scrollable comment list (max-h-64)
- Each comment shows: authorName, role badge, relative timestamp, content
- Internal notes shown with amber border and "Internal Note" label
- Textarea + Send button at bottom
- Analyst gets "Mark as internal note" checkbox
- Wire into all 3 case detail pages (investigator, analyst, admin)

---

### Day 11-13: Verdict Appeal Flow

**What:** When a case is rejected, the investigator can submit a formal appeal for re-review.

**New model: `src/lib/models/AppealRequest.ts`**
```typescript
{
  caseId: string;
  requestedBy: ObjectId;        // investigatorId
  originalVerdictId: ObjectId;
  reason: string;               // min 30 chars
  status: "pending" | "accepted" | "denied";
  reviewedBy: ObjectId | null;  // admin who resolved
  adminNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}
```

**New API routes:**
- `POST /api/cases/[id]/appeal` — investigator submits appeal
  - Validates: status === "rejected", no existing pending appeal, reason >= 30 chars
  - Creates AppealRequest record
  - Logs audit: "appeal.submitted"
- `GET /api/admin/appeals` — admin lists all pending appeals
- `PUT /api/admin/appeals/[id]` — admin resolves: action "accept" or "deny"
  - If accept: Case.status → "pending_review" (back in analyst queue)
  - If deny: appeal.status → "denied", case stays "rejected"

**New UI components:**
- `AppealDialog.tsx` — shown on investigator case detail when status==="rejected"
  - "Request Re-Review" button → dialog with reason textarea + submit
- `AppealStatusBadge.tsx` — pending/accepted/denied color pill
- `AppealQueueTable.tsx` — table in new `/admin/appeals` page

---

### Day 14: API Rate Limiting

**What:** Protect public endpoints from abuse without needing Redis.

**Implementation: MongoDB TTL-based sliding window**
```typescript
// src/lib/rateLimit.ts
// Uses a RateLimit collection with TTL index (no Redis needed)
// checkRateLimit(key, maxRequests, windowSeconds) → { allowed, remaining }
```

**Apply to:**
- `GET /api/verify/[caseId]` — 30 requests per minute per IP
- `POST /api/auth/login` — 10 requests per 5 minutes per IP
- `POST /api/auth/register` — 5 requests per hour per IP
- `POST /api/auth/forgot-password` — 3 requests per hour per email

**Return on limit exceeded:**
- HTTP 429 with `Retry-After` header
- JSON body: `{ error: "Too many requests. Please wait 60 seconds." }`

---

## Week 3 (Days 15-22): Presentation-Ready Features

### Day 15-17: Forensic Certificate PDF Export

**What:** A professionally styled PDF certificate for any verified case — the most visually impressive feature for viva.

**Library:** `@react-pdf/renderer` (run `npm install @react-pdf/renderer`)

**`src/lib/pdf/ForensicCertificate.tsx`** — React-PDF document component:
- Dark themed (matches app colors: #0D1B2A background, #00C9A7 accent)
- Sections: Case Info / Evidence Integrity / Blockchain Anchor / AI Analysis / Verdict
- Shows SHA-256 hash, IPFS CID, TX hash, tamper score, verdict hash, verify URL
- Footer disclaimer: "Not a court-admissible forensic report"
- QR code text pointing to the verify URL

**`src/app/api/cases/[id]/certificate/route.ts`**
- Auth: all roles
- Only available when case.status === "verified"
- Fetches case + AI report + verdict
- Calls generateCertificatePdf(), returns Buffer as application/pdf
- Content-Disposition: attachment; filename="proofchain-cert-{caseId}.pdf"
- Logs audit: "case.export_pdf"

**UI button** (in all 3 case detail pages, shown only when status === "verified"):
```tsx
<a href={`/api/cases/${caseId}/certificate`} download
   className="flex items-center gap-2 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10">
  ↓ Download Forensic Certificate
</a>
```

---

### Day 18-19: Forgot Password / Reset Flow

**What:** Currently missing — users who forget passwords are permanently locked out.

**Step 1 — Add to User model (if not already present):**
```typescript
passwordResetToken: string | null;    // SHA-256 hash of token
passwordResetExpires: Date | null;    // 1 hour TTL
```

**Step 2 — New API routes:**

`POST /api/auth/forgot-password`
- Input: { email }
- Generates UUID token, stores SHA-256 hash in user document
- Sends email with reset link: `{APP_URL}/reset-password?token={plainToken}`
- Returns: always 200 (prevent email enumeration)

`POST /api/auth/reset-password`
- Input: { token, newPassword }
- Hashes token, finds user with matching hash and non-expired token
- Updates passwordHash, clears reset fields
- Sends "password changed" security alert email

**Step 3 — New pages:**

`/forgot-password` — email input form (same styling as login page)
`/reset-password?token=...` — new password + confirm password form

---

### Day 20-21: UI Polish Pass

**Specific fixes:**

1. `CaseStatusBadge` — differentiate ai_timeout (orange) from rejected (red). Both currently use red.

2. `AiReportPanel` — add timeout state: if case is in ai_timeout, show "AI analysis timed out — manual review required" instead of indefinite "processing" spinner.

3. `CustodyTimeline` — add "ai_analysis" node type so AI completion appears in the timeline flow.

4. Case tables — ensure horizontal scroll on mobile (overflow-x-auto on table wrapper).

5. Copy Case ID animation — add "Copied ✓" feedback that appears for 1.5s then resets.

6. Evidence GPS map — guard against null gpsLat/gpsLng before rendering the Leaflet map.

---

### Day 22: Verify Page Improvements

**Add to `/verify/[caseId]` page:**

1. **Share button** — uses `navigator.share()` on mobile, clipboard fallback on desktop.

2. **Polygonscan links** — every TX hash in the on-chain data table links directly to `https://amoy.polygonscan.com/tx/{hash}`.

3. **Re-verify button** — triggers a fresh IPFS fetch + hash recompute (existing logic, just expose as a button).

4. **Download Certificate button** — shown if verdict === "verified" (calls the PDF endpoint).

5. **"What is this page?" explainer** — collapsible section for public visitors who land here via QR code.

---

## Week 4 (Days 23-30): Testing, Docs & Viva Prep

### Day 23: Database Index Migration

Run these in MongoDB shell or a one-time migration script:
```javascript
db.cases.createIndex({ status: 1, createdAt: -1 })
db.cases.createIndex({ investigatorId: 1, status: 1 })
db.cases.createIndex({ currentCustodian: 1, status: 1 })
db.cases.createIndex({ incidentType: 1, status: 1 })
db.cases.createIndex({ title: "text", description: "text" })
db.auditlogs.createIndex({ actionType: 1, timestamp: -1 })
db.auditlogs.createIndex({ actorId: 1, timestamp: -1 })
db.comments.createIndex({ caseId: 1, createdAt: 1 })
db.appealrequests.createIndex({ caseId: 1, status: 1 })
```

### Day 24-26: End-to-End Testing

Test every flow manually with fresh test data:
- [ ] Register → email verify → login
- [ ] Submit case with 2 evidence files → both get AI reports
- [ ] AI score gauge visible with breakdown chart
- [ ] Transfer case to analyst → email notification sent
- [ ] Analyst comments → investigator sees comment
- [ ] Analyst issues verdict → investigator notified
- [ ] Download PDF certificate (verified case only)
- [ ] Reject case → investigator submits appeal → admin resolves
- [ ] Forgot password → email received → reset works
- [ ] Rate limiting → 11th login attempt blocked
- [ ] Public verify page → hash match shows correctly
- [ ] QR code on verify page → scans to correct URL

### Day 27-28: Documentation

Write these files:

`/docs/ARCHITECTURE.md` — System architecture with component diagram
`/docs/API_REFERENCE.md` — All endpoints, request/response schema, auth required
`/docs/DEPLOYMENT.md` — Local setup, env variables, how to run AI service
`/docs/AI_ANALYSIS.md` — Tamper scoring algorithm, all 12 EXIF flags explained, Gemini prompt details
`/docs/BLOCKCHAIN.md` — Smart contract functions, anchoring flow, verification

### Day 29-30: Demo Preparation

**Viva demo script (10-minute walkthrough):**

1. Show login (investigator account)
2. Submit a new case with 2 evidence files (JPG + PDF)
3. Show file hashing + IPFS upload progress
4. Wait for AI analysis → show score gauge + EXIF flags + breakdown chart
5. Show blockchain TX hash → click to Polygonscan
6. Login as analyst → see case in queue
7. Analyst adds an internal note (comment)
8. Analyst issues verdict (verified)
9. Investigator downloads PDF forensic certificate
10. Open public verify page → show hash integrity check + custody timeline
11. Admin view → show audit log of all actions

**Prepare test data:**
- Case A: Status=verified, high tamper score (65+), 2 files with GPS
- Case B: Status=rejected, for demonstrating the appeal flow
- Case C: Status=pending_review, in analyst queue

---

## Final Deliverables Checklist

| Item | Status |
|------|--------|
| AI tamper score gauge + breakdown chart | [ ] |
| 12-signal EXIF analysis | [ ] |
| Multi-file AI reports per case | [ ] |
| Case comments (Investigator ↔ Analyst) | [ ] |
| Verdict appeal flow | [ ] |
| Forensic certificate PDF export | [ ] |
| Rate limiting (auth + verify endpoints) | [ ] |
| Forgot password / reset flow | [ ] |
| DB performance indexes | [ ] |
| UI polish (status badge fix, mobile scroll) | [ ] |
| Verify page improvements | [ ] |
| Documentation (5 docs files) | [ ] |
| End-to-end test pass | [ ] |
| Demo data prepared | [ ] |

---

## What to Say in Your Viva

**"What makes this different from a simple CRUD app?"**
> ProofChain integrates three distinct trust layers: AI forensic analysis with 12-signal EXIF detection
> and Gemini Vision, IPFS decentralized storage for content-addressed immutability, and Polygon
> blockchain anchoring for cryptographic non-repudiation. The system enforces a multi-role chain of
> custody with on-chain transfer records, ensuring evidence integrity from submission to verdict.

**"What is the AI doing exactly?"**
> The AI microservice runs as a separate FastAPI service. For each evidence file, it runs ExifTool to
> extract 12 forensic metadata signals (editing software, timestamp anomalies, GPS manipulation, etc.),
> uses Gemini 2.5 Flash Vision to detect visual manipulation artifacts (lighting inconsistencies,
> clone stamping, splicing), and checks PDFs for text layer presence. These signals are combined into
> a 0-100 tamper score using a weighted formula with a detailed per-signal breakdown.

**"Why blockchain? Couldn't you just store the hash in a database?"**
> If we only stored the hash in the database, the platform operator could change it undetected.
> The blockchain ensures that a third party — including ProofChain itself — cannot retroactively
> alter the evidence record. The SHA-256 hash is written to the Polygon smart contract at upload
> time. The public /verify page re-fetches from IPFS and recomputes the hash, then compares it
> to the on-chain value — no trust in the platform is required.

**"What would you add with more time?"**
> Background job queues for async AI processing, client-side AES-256 file encryption before IPFS
> upload (so even the storage provider cannot read evidence), Redis caching, WebSocket real-time
> notifications, and a machine learning feedback loop where analyst verdicts calibrate the AI
> tamper score weights over time.

---

*ProofChain · ENHANCEMENT_PLAN.md · MCA Project 2026*
