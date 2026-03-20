# CP Prompt-X — Management Brief  
## AI-Assisted Delivery: Sales Intelligence & Guided Selling

**Audience:** Management, product, and technical stakeholders  
**Purpose:** Summarize what was built, why it matters commercially, and how **Cursor AI** (Cursor Auto) was used to deliver it under the **Prompt-X** hackathon discipline—so leadership can assess fit, risk, and follow-on investment.

**Hackathon reference:** [CP Prompt-X — The AI Vibe Coding Hackathon](https://gamma.app/docs/CP-Prompt-X-The-AI-Vibe-Coding-Hackathon-fbvuafc2us3jw5o?mode=doc)

---

## 1. Executive summary

This submission packages **two complementary capabilities** in one modern web application:

1. **AI Sales Call Analyzer** — A secure, database-backed workflow to ingest sales calls (audio), transcribe them, analyze them with AI, and surface dashboards for **coaching and compliance**, with exports (CSV, structured PPT) and **role-based visibility** (master vs. rep).
2. **AI Sales Assistant (kitchen cabinets)** — A **scripted Q1–Q15** discovery-to-close flow with an AI co-pilot, **smart “next question”** suggestions, **rule-based upsell/context hints** at defined stages, an **illustrative quote calculator**, and a **competitive comparison** table—plus demo **PPT export**.

Development was accelerated and standardized using **Cursor Auto** (autonomous agent mode in Cursor) under explicit **project rules**: match the existing Next.js / TypeScript stack, keep changes scoped, and **never commit secrets** (keys live only in `.env.local`).

---

## 2. Business problem and outcomes

### Problems this addresses

| Stakeholder | Pain | How this helps |
|-------------|------|----------------|
| **Sales leadership** | Hard to scale call review; inconsistent coaching | Centralized pipeline: upload → transcribe → analyze → dashboards; master views team activity |
| **Frontline reps** | Forgetting playbook steps; weak objection handling | Structured Q1–Q15 flow + AI + “smart next” reduces variance |
| **Operations / RevOps** | Data trapped in recordings | Exports (CSV/PPT) and persisted follow-ups / observations support reporting |
| **Prospects** | Opaque pricing vs. competitors | Transparent **illustrative** range + comparison row (non-binding by design) |

### Commercial positioning (honest scope)

- The **analyzer** is suitable as a **pilot** for teams that already record calls and want **measurable** follow-up (topics, sentiment aggregates, talk-time visualizations).
- The **sales assistant** is framed as **guided selling** and **training**: it improves consistency and speed, not legal contract or final price authority.

---

## 3. What we built (product view)

### 3.1 AI Sales Call Analyzer

- **Authentication** — JWT session; seeded demo users for master vs. child (rep) roles.
- **Ingestion** — Multi-file upload with **live progress**; audio can target **Vercel Blob** or local/gitignored storage with **IndexedDB mirroring** in-browser for resilience.
- **Analysis surface** — Dashboard metrics, workflow visualization, sentiment, per-call detail (observations, questionnaire topics, radar scores, talk-time vs. coaching targets, keyword heatmap, synced transcript + audio).
- **Governance** — Master sees **own + team** calls; rep sees **only own** calls.
- **Exports** — CSV and **analyzer PPT** submission path for downstream review.

### 3.2 AI Sales Assistant (kitchen playbook)

- **Structured playbook** — Q1–Q15 with optional free-form context; clear **Q badges** on messages.
- **AI + heuristics** — Model-backed chat plus **rule-based suggestion chips**; **`/api/smart-next`** proposes the next question with a short rationale.
- **Revenue-adjacent UX** — Rough cabinet range from sq ft × budget tier; comparison table uses a **consistent midpoint** story (still **not** a binding quote).
- **Upsell discipline** — Server-injected hints after **Q7, Q13, Q14, Q15** (documented in codebase), so behavior is **testable and auditable**, not only “whatever the model says.”

---

## 4. How we developed this app using Cursor AI (Prompt-X method)

### 4.1 Why Cursor Auto for this stack

The product is **TypeScript-first** (Next.js App Router, Prisma, API routes, Zustand, shadcn/ui). Cursor Auto is effective here because it:

- **Navigates the whole repo** (UI, API, schema, seed scripts) in one session.
- **Applies consistent patterns** (e.g., Zustand store shape, route handlers, component layout) instead of one-off snippets.
- **Reduces rework** when APIs and types must stay in sync (Prisma models ↔ API ↔ dashboard).

### 4.2 Operating model we used (what “good” looked like)

| Practice | Rationale |
|----------|-----------|
| **Repo-level rules** | A Cursor rule file locks stack conventions and submission expectations (Cursor Auto, no committed keys). |
| **Small, reviewable tasks** | Each change maps to a user-visible outcome (e.g., “CSV export,” “PPT route,” “smart-next API”). |
| **Prompt quality = spec quality** | Prompts included *acceptance criteria* (roles, error states, empty states, exports), not vague “build a dashboard.” |
| **Human review at boundaries** | Auth, PII/audio handling, and pricing copy were treated as **governance** checkpoints—not fully delegated. |
| **Verification hooks** | Example: `npm run verify:sales-q` guards the Q1–Q15 identity contract; `tsc --noEmit` as lint keeps types honest. |

### 4.3 Prompt-X “quality bar” (how we talk about it to judges or execs)

**Prompt-X quality** here means *repeatable AI-assisted engineering*, not clever one-liners:

1. **Intent** — Clear problem: “master vs rep visibility,” “persist follow-ups,” “NDJSON upload progress.”
2. **Constraints** — Stack, security (env-only secrets), and “match existing `src/` patterns.”
3. **Definition of done** — Observable behavior (exports download, seeds log in, smart-next returns ids in range).
4. **Traceability** — Important behaviors live in named modules (`sales-upsell.ts`, analyzer API routes) so audits and demos are easy.

### 4.4 Responsible use of AI in delivery

- **No API keys in the repository**; rotation guidance documented for any leaked key.
- **Disclaimers** on illustrative pricing; assistant is coaching tooling, not a contract system.
- **Role separation** in the analyzer mirrors how real orgs gate sensitive recordings.

### 4.5 Professional prompts used to build this application (Cursor Auto)

The bullets below are **representative prompts**—written the way we steered **Cursor Auto** during development: explicit context, constraints, acceptance criteria, and file pointers. Wording varied by session; the **structure** is what made delivery predictable for management and reviewers.

**Prompt pattern we followed**

| Element | Purpose |
| -------- | -------- |
| **Context** | Stack, relevant paths, current behavior |
| **Task** | Single outcome (one feature or fix) |
| **Constraints** | Match `src/` patterns; no scope creep; no secrets in repo |
| **Done when** | Test steps, API shape, or UI checks |

---

**A. Project guardrails & consistency**

> *You are working in a Next.js App Router + TypeScript + Tailwind + shadcn/ui + Prisma codebase. Before changing behavior, read the surrounding files and match naming, imports, and component style. Do not commit API keys or add keys to tracked files; document new env vars in README with placeholders only. Keep the diff minimal and limited to the requested outcome.*

---

**B. Sales Assistant — Q1–Q15 playbook UI**

> *Implement or extend the kitchen sales chat so reps can select scripted questions Q1–Q15 from a dropdown, attach optional context, and send. User messages should show a visible **Q badge** when a question id is attached. Use the existing Zustand chat store in `src/store/chat.ts` for persistence; match `sales-chat.tsx` and `chat-bubble.tsx` patterns. Empty state and loading/error states must be handled. **Done when:** I can step through Q1…Q15 in order, refresh the page, and see the history restored.*

---

**C. Smart next question (API + UI wiring)**

> *Add or refine `POST /api/smart-next`: accept the same `messages` shape as `/api/chat`, call the model to suggest the next playbook question id (1–15) plus a short `rationale`. Validate response with zod. On the client, priming the next-question UX from this response must not block sending. **Done when:** non-2xx returns JSON `{ error }`; success returns `{ suggestedQuestionId, rationale }` with id in range; UI shows the suggestion without console errors.*

---

**D. Server-side upsell / stage hints**

> *Centralize upsell and stage-specific system-prompt augmentation in `src/lib/sales-upsell.ts`. When `POST /api/chat` receives `currentQuestionId`, append the correct hint for stages **Q7, Q13, Q14, Q15** only (premium finishes, financing, soft-close value, consultation close). Keep copy editable in one module. **Done when:** behavior is deterministic for those ids and does not affect other questions.*

---

**E. Quote calculator & comparison table**

> *Implement an illustrative quote range from `src/lib/quote-calculator.ts` using kitchen sq ft and budget tier from the same Zustand store as the chat. The quote comparison table should show a clear **non-binding** disclaimer; the “Our” price row must use the **same midpoint logic** as the calculator for consistency. **Done when:** changing inputs updates the table without a full reload and types stay strict.*

---

**F. Sales chat PPT export**

> *Add or extend a route that generates a **starter** `.pptx` for demo/export from the chat experience using `pptxgenjs`, with title and checklist-style content appropriate for a hackathon submission. **Done when:** download works in modern Chrome; route fails gracefully if optional deps or data are missing.*

---

**G. Call Analyzer — dashboard & workflow**

> *Extend `analyzer-dashboard.tsx` (and related API routes) to show aggregate metrics, sentiment summary, and a clear **Upload → Transcribe → Analyze → Dashboard** workflow graphic. Match existing Recharts/card layout. **Done when:** a master user sees team-scope data; a rep sees only their calls; empty and loading states are handled.*

---

**H. Multi-upload & progress**

> *Implement multi-file upload with **live progress** (e.g. NDJSON or chunked status) to the existing calls pipeline. Preserve current auth and Prisma models; do not broaden visibility rules. **Done when:** multiple files can be queued, progress is visible in the UI, and failures surface a readable error without wedging the UI.*

---

**I. Audio storage & playback**

> *Support Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set; otherwise fall back to gitignored local `uploads/` and the existing protected audio route. Mirror uploads to **IndexedDB** in the dashboard so playback still works if disk write fails. Load audio via `fetch` + blob URL so the session cookie is always sent. **Done when:** master/rep rules still hold and playback works in both storage modes we support.*

---

**J. Exports — CSV & analyzer PPT**

> *Implement or refine `GET`-style export routes for **CSV** (calls metadata suitable for RevOps) and **analyzer PPT** submission (`export-analyzer-ppt`): respect RBAC (only rows/calls the user may see). **Done when:** downloading from the dashboard returns valid files for master vs rep scopes.*

---

**K. Auth & role-based access**

> *Use JWT cookie sessions consistent with the existing login flow. Enforce: **master** sees own calls and calls owned by users with `parentId` equal to the master; **child/rep** sees only own calls. **Done when:** API routes and pages both enforce the same rules (no client-only checks for sensitive data).*

---

**L. Quality gate / regression**

> *After changing Q1–Q15 definitions or IDs, run `npm run verify:sales-q` and fix any drift. After TS changes, `tsc --noEmit` must pass. Do not weaken typings to silence errors—fix the model or the call sites.*

---

## 5. Technology summary (for IT / security)

| Layer | Choice |
|-------|--------|
| **Framework** | Next.js (App Router), React 18 |
| **UI** | Tailwind CSS, shadcn/ui, Recharts |
| **Data** | Prisma; PostgreSQL (deploy) or SQLite (local file DB per project docs) |
| **AI** | OpenAI via Vercel AI SDK / server routes |
| **State** | Zustand (chat + calculator persistence in browser) |
| **Auth** | JWT cookie sessions |

Deployment notes: long-running analyzer routes may require **extended serverless timeouts** (e.g., `vercel.json` max duration); plan limits apply.

---

## 6. Evidence package for stakeholders

Recommended collateral (aligns with hackathon checklist):

- **Live or recorded demo** — Full Q1→Q15 chat path; multi-upload analyzer with progress; role-based login.
- **Architecture one-pager** — This document + README “What it does” sections.
- **Security one-liner** — Keys in env only; RBAC for call visibility; audio via protected fetch + blob URLs.

**Submission compliance:** README and slide decks should state that development was assisted with **Cursor Auto**, per project rules.

---

## 7. Suggested talking points for management

- **Speed:** Cursor Auto + clear specs collapsed wall-clock time for full-stack features (UI + API + DB + export).
- **Quality:** TypeScript, Prisma, and explicit verification scripts reduce “AI slop” risk compared to unstructured codegen.
- **Governance:** RBAC, server-side upsell injection, and env-only secrets show we can pair **AI velocity** with **operating discipline**.
- **Next step:** Pilot the analyzer on a single team; pair the assistant with **your** approved pricing and compliance copy—not the demo defaults.

---

## 8. Appendix — Repository map (high level)

| Area | Location (indicative) |
|------|------------------------|
| Landing, chat, dashboard routes | `src/app/` |
| Sales assistant UI | `src/components/sales-chat.tsx`, `question-selector.tsx`, etc. |
| Chat / quote state | `src/store/chat.ts` |
| Sales logic | `src/lib/sales-questions.ts`, `sales-upsell.ts`, `quote-calculator.ts` |
| APIs | `src/app/api/chat/`, `smart-next/`, export routes |
| Analyzer | `src/components/analyzer-dashboard.tsx`, `src/app/api/…` |

---

## 9. Appendix — Recent product additions & roadmap

**Shipped (demo / ops):**

- **`GET /api/health`** (session-gated) — Liveness: database query, plus boolean flags for `OPENAI_API_KEY` and `BLOB_READ_WRITE_TOKEN` (presence only, never values).
- **Management brief in-app** — Authenticated route **`/docs/management-brief`** renders `docs/PROMPT-X-Management-Brief.md` for stakeholder walkthroughs without leaving the product shell.
- **Dashboard** — **Integration readiness** strip (from health), **recent-calls search** (ID, owner email, transcript, summary, sentiment), link to **Management brief**.

**Roadmap (illustrative):**

- SSO / org invites; per-team data retention; scheduled CSV/email exports; audit log for master views; optional redaction pass on transcripts before storage.

---

*Document version: 1.2 — §9 roadmap / recent additions. Customize org name, pilot scope, and compliance contacts before external distribution.*
