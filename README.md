# CP Prompt-X — The AI Vibe Coding Hackathon

**Project:** (1) **AI Sales Call Analyzer** — PostgreSQL-backed pipeline: upload → Whisper → AI dashboards (master vs rep roles, CSV/PPT export, multi-upload with live progress). (2) **AI Sales Assistant** for **kitchen cabinets** — scripted **Q1–Q15** flow.

**Stack:** Next.js (App Router), Tailwind, shadcn/ui, Prisma + PostgreSQL, Vercel AI SDK, OpenAI, Zustand (legacy local analyzer), Recharts, Cursor Auto.

**Hackathon brief:** [CP Prompt-X — The AI Vibe Coding Hackathon (Gamma)](https://gamma.app/docs/CP-Prompt-X-The-AI-Vibe-Coding-Hackathon-fbvuafc2us3jw5o?mode=doc)

Development used **Cursor Auto** (see `.cursor/rules/cp-prompt-x-cursor-auto.mdc`); mention that in your submission.

## Sales Call Analyzer (database)

- **Login** — `/login` (JWT cookie). Seed users: `npm run db:seed` → `master@demo.local` / `demo-master-123`, `child@demo.local` / `demo-child-123`.
- **Master** — sees all calls owned by the master **or** any user with `parentId` = master (team reps).
- **Rep (child)** — sees only their own calls.
- **Dashboard** — `/dashboard`: metrics grid, aggregate sentiment, **workflow** graphic (Upload → Transcribe → Analyze → Dashboards), **multi-file upload** with NDJSON progress, **CSV export**, **PPT submission** (`/api/export-analyzer-ppt`).
- **Call detail** — `/call/[id]`: follow-up **checkboxes** (persisted), positive/negative **observation** cards, **7-topic questionnaire**, **radar** agent scores, **talk-time pie** + 60/40 coach target note, keyword heatmap, synced transcript + audio. **Audio:** with `BLOB_READ_WRITE_TOKEN`, files go to Vercel Blob; otherwise dashboard uploads write to `uploads/calls/` and `/api/calls/[id]/audio` (gitignored). The dashboard also mirrors each saved file into **IndexedDB** in that browser so playback works if disk write fails. Protected audio is loaded via `fetch` + blob URL so the session cookie is always sent.

### Database

**Local (default):** **SQLite** at `prisma/dev.db` — no Postgres install. Set in `.env.local`:

- `SCA_DATABASE_URL=file:./prisma/dev.db` (use this name — **not** `DATABASE_URL` — so a global shell `DATABASE_URL` for another Postgres app does not override this project)
- `AUTH_SECRET` (≥16 characters)

Then:

```bash
npx prisma db push
npm run db:seed
npm run dev
```

**Database:** The repo defaults to **PostgreSQL** in `prisma/schema.prisma`. Set **`SCA_DATABASE_URL`** (e.g. [Neon](https://neon.tech) on Vercel), then `npx prisma db push` and `npm run db:seed`. For a local **SQLite** file DB only, replace `schema.prisma` with `prisma/schema.sqlite.prisma` and use `SCA_DATABASE_URL=file:./prisma/dev.db`.

Optional **Docker Postgres**: `docker compose up -d` — use the PostgreSQL schema + `SCA_DATABASE_URL=postgresql://analyzer:analyzer@127.0.0.1:5432/analyzer`.

Also set `OPENAI_API_KEY`, `AUTH_SECRET`, and optionally `BLOB_READ_WRITE_TOKEN` on the host. `vercel.json` extends **maxDuration** for long-running routes (plan limits apply).

## What it does (sales chat)

- **Q1–Q15 playbook** — Dropdown (`QuestionSelector`) for every scripted question; optional free-form context; **Q badge** on user bubbles when a question id is attached.
- **Chat UI** — `ChatBubble` rows for user + assistant; scroll area; loading and error states.
- **Conversation memory** — `useChatStore` in `src/store/chat.ts` (persisted in the browser). Quote calculator inputs (`kitchenSqFt`, `targetBudget`) use the same store. `src/stores/conversation.ts` re-exports for older imports.
- **Smart Next** — `POST /api/smart-next` asks the model which question (1–15) to ask next; primes the textarea with a short rationale.
- **Heuristic chips** — Rule-based “suggested next” chips still appear for quick taps.
- **Quote calculator** — Rough cabinet $ range from kitchen sq ft × budget tier (`src/lib/quote-calculator.ts`); **not** a binding quote.
- **Quote comparison table** — Material / warranty / soft-close / **Price** row; “Our” price uses the **illustrative midpoint** from the same inputs as the calculator.
- **Upsell logic** — Server-side hints after **Q7** (premium finishes), **Q13** (financing), **Q14** (soft-close ~$200 long-term value), **Q15** (consultation close). Implemented in `src/lib/sales-upsell.ts`, injected from `POST /api/chat` when `currentQuestionId` is sent.
- **Demo PPT export** — Downloads a starter `.pptx` from `/chat`.

### Demo recording

**Full app video (script + multi-user flow):** see [`docs/VIDEO-WALKTHROUGH.md`](./docs/VIDEO-WALKTHROUGH.md) — page-by-page narration, **3-minute trailer** with target timestamps, **approximate YouTube-style chapters** for the long cut, and master vs rep recording setup.

**Automated silent UI capture (Playwright):** `npm run playwright:install` once, then `npm run dev` in one terminal and `npm run demo:video` in another → WebM under `test-results/` (see **Automated capture** in the walkthrough doc for MP4 conversion and env vars).

Add a short screen recording and save it as **`docs/demo.gif`** (or link your Loom/MP4 in the hackathon form). Placeholder path for Markdown embed after you add the file:

```md
![Sales chat demo](./docs/demo.gif)
```

## API usage

### `POST /api/chat`

**Body (JSON):**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `messages` | `{ role: "user" \| "assistant"; content: string }[]` | Conversation transcript (new user message should be last). |
| `currentQuestionId` | `number` (optional) | When the user sent a scripted **Q1–Q15** turn, pass the id so upsell context (Q7/Q13/Q14/Q15) is appended to the system prompt. |

**Response:** `{ "reply": string }` or `{ "error": string }` with non-2xx status.

### `POST /api/smart-next`

**Body (JSON):**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `messages` | `{ role: "user" \| "assistant"; content: string }[]` | Same transcript as chat (no pending unsent user line required). |

**Response:** `{ "suggestedQuestionId": number, "rationale": string }` or `{ "error": string }`.

Requires `OPENAI_API_KEY` on the server.

## Local setup

1. **Node.js** 18.17+ or 20.x.
2. Install dependencies:

   ```bash
   npm install
   ```

3. **Environment** — copy the example file and add your key:

   ```bash
   cp .env.example .env.local
   ```

   Set `OPENAI_API_KEY` in `.env.local`. Do not commit real keys.

4. **Run dev server:**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) — landing page. Main app: [http://localhost:3000/chat](http://localhost:3000/chat).

## Scripts

| Command               | Description        |
| --------------------- | ------------------ |
| `npm run dev`         | Development server |
| `npm run build`       | Production build   |
| `npm run start`       | Start production   |
| `npm run lint`        | TypeScript check (`tsc --noEmit`) |
| `npm run verify:sales-q` | Asserts Q1–Q15 ids in `sales-questions.ts` |

### Manual Part 1 test (Q1–Q15)

1. `npm run dev` → open `/chat`, ensure `.env.local` has `OPENAI_API_KEY`.
2. For each Q1…Q15: choose it in the dropdown, add optional context, **Send**.
3. Confirm assistant reply, **AI suggested next question** banner, and dropdown/note primed for the next step.
4. Adjust **Quote calculator** (sq ft × budget); confirm **Quote comparison** price row updates.
5. `npm run verify:sales-q` in CI or before submit.

## Project layout

- `src/app/` — App Router: `page.tsx` (landing), `chat/page.tsx` (main UI), `api/chat/route.ts`, `api/smart-next/route.ts`, `api/export-ppt/route.ts`.
- `src/components/` — `sales-chat.tsx`, `question-selector.tsx`, `chat-bubble.tsx`, `quote-calculator.tsx`, `quote-comparison-table.tsx`, shadcn-style `ui/*`.
- `src/lib/` — `openai.ts`, `sales-questions.ts`, `sales-upsell.ts`, `quote-calculator.ts`, `chat-types.ts`, `utils.ts`.
- `src/store/` — `chat.ts` (Part 1 history + quote fields, persisted).
- `src/stores/` — thin re-exports (`conversation.ts`, `chat-store.ts`) for compatibility.
- `src/hooks/` — Next-question heuristic suggestions.

## Flow checklist (Q1–Q15)

- **Q1→Q4** — Discovery dropdown + send; transcript builds context.
- **Q5→Q8** — Qualification; **Q7** triggers premium-finish upsell hint server-side.
- **Q9→Q12** — Proposal / competitor quote handling (model + your notes).
- **Q13** — Objections; financing prompt hint.
- **Q14** — Upsell / soft-close value hint.
- **Q15** — Close with consultation CTA hint.
- **Quote** — Adjust sq ft / budget; comparison **Price** row updates.
- **Memory** — Refresh the page; chat and calculator inputs rehydrate from local storage.

## Hackathon submission checklist

- [ ] **PPT** — Title slide, product definition, demo screenshots, checklist form (starter file: *Export demo PPT* in `/chat`).
- [ ] **Deploy** — Push to GitHub, deploy on [Vercel](https://vercel.com); add `OPENAI_API_KEY` in Vercel project → Settings → Environment Variables.
- [ ] **Video / GIF** — Full flow **Q1 → Q15**; add `./docs/demo.gif` or link.
- [ ] **Cursor Auto** — Note in README/slides that code was generated/assisted with Cursor Auto.
- [ ] **Security** — No API keys in the repo (including `.env.example` — placeholders only). **Rotate** any OpenAI key that was pasted in chat, email, or a public issue — it is compromised.

## License

Private / hackathon use unless you add a license.
