# Application video walkthrough — script & shot list

Use this document as your **narration script** and **click path** while recording a screen capture (Loom, OBS, QuickTime, etc.). Target length: **8–14 minutes** depending on how long you linger on uploads and AI processing.

---

## 3-minute trailer (script + target timestamps)

**Goal:** One tight MP4 for social, judges, or Gamma embeds. **Pre-load** at least one analyzed call so you skip live Whisper during the trailer (or accept ~30s of upload in the middle and trim).

| Time | Seconds | Show | Say (short) |
|------|--------:|------|----------------|
| **0:00** | 12 | `/` — hero + three buttons | “CP Prompt-X: AI Sales Call Analyzer—Whisper, team dashboards, exports—plus a kitchen-cabinet sales copilot.” |
| **0:12** | 10 | `/login` → sign in **master** | “JWT login; managers land on the analyzer.” |
| **0:22** | 33 | `/dashboard` — role line, 4 metric cards, **workflow** card (point at pipeline), **owner filter** if multiple emails | “Master sees the whole team: rollups, sentiment, pipeline from upload to insight. I can filter by rep.” |
| **0:55** | 30 | `/call/[id]` — quick scroll: charts + transcript strip | “Each call: coaching charts, talk-time, synced transcript, follow-ups.” |
| **1:25** | 25 | **Side-by-side or hard cut:** Window A master list vs Window B **child** logged in — rep subtitle “own calls only” | “Same product, two roles: reps see only their calls; the master sees everyone.” |
| **1:50** | 45 | `/chat` — pick **one** Q, send; scroll to **quote calculator** + comparison row | “Second mode: Q1–Q15 playbook, AI replies, quote tools for live sales.” |
| **2:35** | 25 | Optional **0:05** flash: **Brief** button or `/docs/management-brief` header | “Stakeholder brief lives in-app under docs.” |
| **3:00** | — | Freeze on logo or home | “Next.js stack; Cursor Auto on the build. Link in description.” |

**Trailer discipline:** No waiting on API unless you edit it out; narrate over scrolls; **one** login, **one** call detail pass, **one** dual-window beat.

---

## Chapter timestamps — full walkthrough (approximate)

Use these as **YouTube chapters** or editing guides. Times assume **~10.5 minutes** with a **pre-analyzed** call (no long upload). **Re-record timestamps** after your dry run: in YouTube Studio → Chapters, or note wall-clock from your editor.

| Start | Chapter |
|------:|---------|
| **0:00** | Intro / title (optional) |
| **0:08** | Home `/` |
| **0:53** | Login `/login` |
| **1:23** | Dashboard (master) — metrics, health, sentiment, workflow |
| **3:08** | Dashboard — upload + progress + filters + table |
| **4:53** | Call detail `/call/[id]` |
| **7:23** | Two users — master vs rep |
| **8:53** | Management brief `/docs/management-brief` |
| **9:38** | Sales chat `/chat` |
| **12:08** | Close |

**If you include a live multi-file upload (~2–3 min):** shift everything after **1:23** forward by that amount, or insert a chapter **“Upload & analysis”** at your actual start time.

---

## Before you record

1. Run `npm run dev`, ensure DB is migrated and seeded: `npx prisma db push` and `npm run db:seed`.
2. Demo accounts (from README):
   - **Master (manager):** `master@demo.local` / `demo-master-123` — sees **all team calls**.
   - **Rep:** `child@demo.local` / `demo-child-123` — sees **only their own** uploads.
3. Prepare **one short audio or video** sample (30–90s) for a fast pipeline demo; optionally a second file to show **multi-upload** progress.
4. For the **two-user** segment, use either:
   - **Two browser profiles** (Chrome: Profile A = master, Profile B = rep), or  
   - **Normal window + Incognito** (log in as different users).
5. Set resolution to **1920×1080** or **1440×900**, hide unrelated bookmarks/toolbars, use **light mode** if you want maximum clarity on gradients.

---

## Recording on Ubuntu desktop

**Option A — OBS Studio (recommended)** — Full control, MP4/MKV, good for the 3-minute trailer and the long cut.

```bash
sudo apt update && sudo apt install -y obs-studio
```

1. Open **OBS** → first-run wizard can auto-tune; or **Settings → Output** → Recording format **MP4** (or **MKV** while recording, then **File → Remux** to MP4 if you hit crashes).
2. **Sources** → add **Screen Capture (PipeWire)** on **Wayland**, or **Screen Capture (XSHM)** on **X11** (if PipeWire is not listed, you’re likely on X11).
3. Add **Audio Input Capture** for your microphone if you’re narrating.
4. **Start Recording**, follow the **3-minute trailer** table at the top of this file (or the full scenes below), **Stop Recording**. Default folder: **File → Settings → Output → Recording** (often `~/Videos`).

**Option B — Built-in GNOME recorder** — Fast, no install. Press **`Ctrl` + `Shift` + `Alt` + `R`** to start/stop screen recording (shortcut may vary by Ubuntu version), or open **Screenshot** / **Camera** from the shell and choose **Record screen**. Clips usually land under **`~/Videos`**.

**Option C — Kazam** — Simple UI: `sudo apt install -y kazam`.

**Two-window demo (master vs rep):** Tile Chrome windows with **Super + ← / →**, or use **Workspaces** (Super + PgUp) so you can swipe between master and rep without overlapping.

**Check Wayland vs X11:** **Settings → About → Windowing System**. If something fails to capture the screen, try logging out → **Ubuntu on Xorg** on the login gear menu, or prefer **OBS + PipeWire** on Wayland.

---

## Automated capture (Playwright — silent UI video)

The repo can **record the browser automatically** (no microphone): home → master login → dashboard scroll → first call detail if data exists → management brief → sales chat → logout → **rep** login (own-calls-only). Output is **WebM** under `test-results/` (gitignored).

**One-time browser download:**

```bash
npm run playwright:install
```

**Record (recommended):** Terminal A — app must be up with DB + seed:

```bash
npm run dev
```

Terminal B:

```bash
npm run demo:video
```

**Optional:** start Next from Playwright (first compile can take several minutes):

```bash
npm run demo:video:serve
```

**Find the file:** `test-results/e2e-app-demo-video-*/video.webm` (exact folder name includes a hash).

**Convert to MP4** (needs `ffmpeg` — pick the path Playwright printed, or):

```bash
find test-results -name video.webm -print -quit | xargs -I{} ffmpeg -y -i {} -c:v libx264 -pix_fmt yuv420p app-demo.mp4
```

**Environment (optional):**

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | Default `http://127.0.0.1:3000` |
| `PLAYWRIGHT_DEMO_EMAIL` / `PLAYWRIGHT_DEMO_PASSWORD` | Master login (defaults match `npm run db:seed`) |
| `PLAYWRIGHT_CHILD_EMAIL` / `PLAYWRIGHT_CHILD_PASSWORD` | Rep login |
| `PLAYWRIGHT_SLOW_MO` | Milliseconds between actions (default `120`) |
| `PLAYWRIGHT_START_SERVER` | Set to `1` for `demo:video:serve` to run `npm run dev` |

There is **no spoken explanation** in the file — add voiceover in DaVinci Resolve / Kdenlive, or record OBS while playing the WebM fullscreen.

---

## Scene 0 — Title card (optional, 5–10s)

**Say:** “This is the CP Prompt-X demo: an AI Sales Call Analyzer with master and rep roles, plus a separate AI sales assistant for kitchen cabinet conversations.”

---

## Scene 1 — Home page `/` (≈45s)

**Show:** Landing at `/`.

**Say / do:**

- Read the hero: **AI Sales Call Analyzer**, PostgreSQL-backed, Whisper, dashboards, multi-upload, CSV and PPT export.
- Point out the three primary actions: **Sign in**, **Dashboard** (will redirect to login if not signed in), **Sales chat** (public demo flow).
- Mention **Deploy on Vercel** and **Local database** cards briefly — env vars and `db:seed` for judges who deploy.

**Click:** **Sign in** to go to `/login`.

---

## Scene 2 — Login `/login` (≈30s)

**Show:** Email and password form.

**Say:** “Authentication is JWT in a cookie. After login, analyzers land on the main dashboard.”

**Do:** Sign in as **`master@demo.local`** with the seed password.

---

## Scene 3 — Dashboard (Master) `/dashboard` (≈3–4 min)

**Show:** Header: role line (“Master — all team calls”), top actions.

**Narrate in order:**

1. **Identity** — Your email and **Master** role mean you see every call you own **and** every call from reps linked under this account.
2. **Top bar** — **Brief** opens stakeholder docs; **Sales chat** is the second product surface; **CSV export** and **PPT submission** export aggregate data for reporting; **Log out** ends the session.
3. **Metric cards** — Total calls, average score, average duration, action items — all computed over **calls you can see** (for master, that’s the team).
4. **Integration readiness** — Database / OpenAI / Vercel Blob pills — explain that Blob is optional for replay; local `uploads/calls` can still work.
5. **Aggregate sentiment** — Pie chart across visible calls.
6. **Workflow pipeline** — Walk through **Upload → Transcribe → Analyze → Dashboards** so viewers understand the pipeline story.
7. **Multi-call upload** — Select one or two files; show **live NDJSON progress** lines as each file runs through Whisper and analysis.
8. **Search and filters** — Search box, sentiment filter, **owner filter** (master sees multiple rep emails — call this out explicitly).
9. **Recent calls table** — Open **one row** to drill into detail (next scene).

**Click:** A call row → `/call/[id]`.

---

## Scene 4 — Call detail `/call/[id]` (≈2–3 min)

**Show:** Full call analysis UI.

**Narrate sections (scroll slowly):**

1. **Header** — Back to dashboard, call title/metadata, owner if shown.
2. **Media** — Audio or video player when available; explain sync with transcript.
3. **Follow-up checkboxes** — Persisted actions (send quote, share catalog, etc.).
4. **Observations** — Positive / negative cards from the model.
5. **Questionnaire / topics** — Seven-topic style scoring; threshold callouts if visible.
6. **Charts** — Agent **radar**, **talk-time** pie with coaching ratio note, **sentiment** where shown.
7. **Transcript** — Scroll with playback or click segments if **highlight-on-play** is visible.
8. **Keyword heatmap** — If present, explain “density of themes across the call.”

**Click:** Back to **dashboard**.

---

## Scene 5 — Two users: Master vs Rep (≈1.5–2 min)

**Setup:** Keep **Window A** logged in as **master**. Open **Window B** (incognito or second profile), go to `/login`, sign in as **`child@demo.local`**.

**Say:** “Same app, different role: the rep only sees **their own** uploads and metrics.”

**In Window B (Rep):**

- Show dashboard subtitle: **Rep — own calls only**.
- Show that **owner filter** may only list their email (or fewer rows than master).
- Optionally upload a tiny test file as the rep so the table clearly belongs to them.

**In Window A (Master):**

- Refresh or navigate to dashboard — show the **rep’s call** appears in the master’s list and in **owner filter** by rep email.

**Say:** “This is how a sales manager gets team-wide visibility while reps stay scoped to their own performance.”

---

## Scene 6 — Management brief `/docs/management-brief` (≈45s)

**From master dashboard**, click **Brief**.

**Say:** “In-app management brief mirrors the markdown under `docs/` — stakeholder summary, delivery notes, and prompt context for the hackathon.”

**Click:** Back to **dashboard** or use header link.

---

## Scene 7 — Sales chat `/chat` (≈2–3 min)

**From dashboard**, click **Sales chat** (or open `/` and use **Sales chat**).

**Show:**

1. **Header** — AI sales assistant for **kitchen cabinets**, Q1–Q15 playbook.
2. **Question selector** — Pick scripted questions; send a message with a **Q badge** on the user bubble.
3. **Smart next / chips** — If you demo AI, show suggested next question behavior.
4. **Quote calculator** — Kitchen sq ft and budget tier → rough range (stress **illustrative, not binding**).
5. **Quote comparison table** — Stays aligned with calculator inputs.
6. **PPT export** from chat if your UI exposes download — mention it as demo artifact for slides.

**Say:** “This module is the second vertical: scripted discovery through Q15, with upsell-aware server prompts and quote tools for the rep at the desk.”

---

## Scene 8 — Close (≈20s)

**Say:** “That’s the full surface: landing, auth, master dashboard with team visibility and exports, per-call AI analytics, role-scoped reps, in-app management brief, and the kitchen cabinet sales assistant. Built with Next.js and assisted with Cursor Auto for the hackathon.”

---

## After recording

- Export **MP4** (H.264) or upload to **Loom / YouTube (unlisted)**.
- Optionally add a **GIF** of the shortest path (`docs/demo.gif`) and embed in README as already documented.

## Route cheat sheet

| Path | Purpose |
|------|--------|
| `/` | Marketing / entry, links to login, dashboard, chat |
| `/login` | JWT login |
| `/dashboard` | Analyzer home (role-aware) |
| `/call/[id]` | Single-call AI dashboard + transcript + media |
| `/results/[id]` | Redirects to `/call/[id]` |
| `/docs/management-brief` | Rendered management brief (auth via middleware) |
| `/chat` | Q1–Q15 sales assistant + quote tools |
