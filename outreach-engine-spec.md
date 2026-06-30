# Outreach Engine — Full Product Spec

**Codename:** Reachify (working title)  
**Builder:** Dave  
**Stack:** Next.js 16 App Router · NestJS (or Next.js API routes) · PostgreSQL · Prisma · Vercel AI SDK · Firecrawl · Claude claude-sonnet-4-6  
**Target ship:** 2 weeks MVP

---

## What it does

A personal AI-powered outreach assistant for developers in a job search. Paste a job post URL or a LinkedIn profile URL, and the tool:

1. Researches the company, role, and hiring manager
2. Scores the opportunity against your target criteria
3. Drafts a personalized cold outreach message in your voice
4. Tracks every outreach in a lightweight CRM

---

## User stories (MVP scope)

- As a job seeker, I can paste a job posting URL and get a researched, personalized outreach draft in under 60 seconds
- As a job seeker, I can paste a LinkedIn profile URL and get a direct-outreach draft to that person
- As a job seeker, I can calibrate the tool with examples of my own writing so output sounds like me
- As a job seeker, I can see all my outreach in one place with status tracking
- As a job seeker, I can score an opportunity before deciding whether to pursue it

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js 15 App Router               │
│  /app/dashboard   /app/new   /app/settings           │
└──────────────────────┬──────────────────────────────┘
                       │ API calls
┌──────────────────────▼──────────────────────────────┐
│              API Routes / NestJS backend              │
│                                                       │
│  POST /api/research     ← kicks off agent loop        │
│  POST /api/draft        ← generates message           │
│  GET  /api/outreach     ← CRM list                    │
│  POST /api/outreach     ← save entry                  │
│  PATCH /api/outreach/:id ← update status              │
│  GET  /api/voice        ← get voice samples           │
│  POST /api/voice        ← save voice samples          │
└──────┬──────────────────────┬───────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼────────────────────────┐
│  PostgreSQL  │    │         AI Agent Loop              │
│  via Prisma  │    │                                    │
│              │    │  1. Parse input (URL type detect)  │
│  Outreach    │    │  2. Firecrawl → scrape job post    │
│  VoiceSample │    │  3. Firecrawl → scrape company     │
│  Opportunity │    │  4. Claude → extract key signals   │
│  User        │    │  5. Claude → score opportunity     │
└─────────────┘    │  6. Claude → draft message          │
                    │     (voice-calibrated)              │
                    └───────────────────────────────────┘
```

---

## Data model

```prisma
model User {
  id            String         @id @default(cuid())
  createdAt     DateTime       @default(now())
  voiceSamples  VoiceSample[]
  outreaches    Outreach[]
}

model VoiceSample {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  text      String   // the message they wrote
  notes     String?  // their own notes on why it worked/didn't
  createdAt DateTime @default(now())
}

model Outreach {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  // Input
  sourceUrl       String        // job post or LinkedIn URL
  sourceType      SourceType    // JOB_POST | LINKEDIN_PROFILE

  // Research output
  companyName     String?
  companySummary  String?
  managerName     String?
  managerTitle    String?
  managerInsights String?       // what we found about them
  stackMatch      Int?          // 0-100 score
  opportunityScore Int?         // 0-100 composite score
  scoreBreakdown  Json?         // { stackMatch, growthSignal, seniority }

  // Message
  draftMessage    String?
  finalMessage    String?       // edited version they actually sent

  // CRM
  status          OutreachStatus @default(DRAFT)
  sentAt          DateTime?
  repliedAt       DateTime?
  followUpDue     DateTime?
  notes           String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum SourceType {
  JOB_POST
  LINKEDIN_PROFILE
}

enum OutreachStatus {
  DRAFT
  SENT
  REPLIED
  FOLLOW_UP_DUE
  CLOSED
}
```

---

## The AI agent loop (core feature)

This is the interesting engineering. It runs as a multi-step tool-calling loop using Vercel AI SDK's `streamText` with tools.

### Step 1: Input parsing

Detect URL type (job board vs LinkedIn vs company site). Extract key identifiers.

```ts
// Prompt fragment
"You will receive a URL. Determine if it is:
- A job posting (LinkedIn Jobs, Greenhouse, Lever, Workable, Indeed, etc.)
- A LinkedIn profile URL
- A company website

Return JSON: { type: 'job_post' | 'linkedin_profile' | 'company_site', platform: string }"
```

### Step 2: Scraping (Firecrawl)

```ts
// Tool: scrape_url
// Input: url
// Output: markdown content of the page

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const result = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });
```

Scrape in order:
1. The job post URL
2. The company's main site (extracted from job post)
3. The company's engineering blog if detectable (e.g. `eng.{company}.com`, `{company}.com/blog`)

Cap total scraped content at ~8k tokens before passing to Claude.

### Step 3: Signal extraction

```ts
// Prompt
`Given the following scraped content from a job posting and company website,
extract the following signals:

- Company name and one-sentence description
- Tech stack mentioned (languages, frameworks, tools)
- Engineering team size (if mentioned)
- Recent company news or product launches
- Hiring manager name and title (if in posting)
- Any specific problems or challenges mentioned in the role description
- Company growth indicators (hiring volume, funding mentions)

Return as structured JSON.`
```

### Step 4: Opportunity scoring

Score 0–100 on three dimensions:

| Dimension | What it checks | Weight |
|---|---|---|
| Stack match | Overlap between role stack and Dave's stack (Next.js, Node, TS, PostgreSQL, NestJS, Prisma, AWS) | 40% |
| Growth signal | Funding recency, hiring activity, product momentum | 35% |
| Seniority fit | Role level vs Dave's experience (mid/senior/staff) | 25% |

```ts
// Prompt
`Given these extracted signals and the developer's target stack:
[Dave's stack]

Score this opportunity:
- stackMatch (0-100): how well does the role's tech stack match?
- growthSignal (0-100): how strong are the company's growth indicators?
- seniorityFit (0-100): how well does the role level match a senior full-stack JS developer?

Return JSON with scores and a one-sentence rationale for each.`
```

### Step 5: Message drafting (voice-calibrated)

This is the most important prompt. It receives:
- Extracted signals (company, role, manager info)
- Dave's voice samples (3–5 example messages with notes)
- A strict length constraint

```ts
const voiceSamples = await db.voiceSample.findMany({ where: { userId } });

const voiceContext = voiceSamples.map(s =>
  `MESSAGE:\n${s.text}\nNOTES: ${s.notes ?? 'none'}`
).join('\n\n---\n\n');

// Prompt
`You are writing a cold outreach message on behalf of Dave, a full-stack JavaScript developer.

Dave's voice — examples of messages he has written:
${voiceContext}

Study the tone, length, word choices, and structure of those examples carefully.
The output must sound like Dave wrote it, not like an AI wrote it.

Context about this opportunity:
- Company: ${signals.companyName}
- Role: ${signals.roleTitle}
- Hiring manager: ${signals.managerName ?? 'unknown'}
- Key insight to reference: ${signals.mostInterestingSignal}
- Tech stack overlap: ${signals.stackOverlap.join(', ')}

Rules:
- Under 100 words
- First line must reference something specific about the company or person (not generic)
- Mention his stack naturally (Next.js, Node, TypeScript, AI features in production)
- End with a low-pressure ask for a 15-minute call
- No subject line needed (this is a LinkedIn DM)
- Do NOT start with "Hi, I'm Dave" or any variant — get to the specific thing first

Write the message only. No preamble, no explanation.`
```

---

## Voice calibration (settings feature)

A simple form where Dave pastes 3–5 messages he's already written. Optional notes field per message ("this one got a reply", "felt too formal in hindsight").

These are stored in `VoiceSample` and injected into every draft prompt. They should be updated over time as he sends more messages and learns what works.

**UI:** Settings page with a list of samples, each with a text area and a notes field. Add / remove individual samples.

---

## CRM tracker

Minimal but functional. The dashboard is the core view.

### Columns

| Field | Type | Notes |
|---|---|---|
| Company | text | Auto-filled from research |
| Manager | text | Auto-filled |
| Score | 0–100 | Color-coded: ≥70 green, 40–69 amber, <40 red |
| Status | pill | Draft / Sent / Replied / Follow-up due / Closed |
| Sent date | date | Set manually when message is sent |
| Follow-up | date | Set to sent + 7 days automatically |
| Notes | text | Freeform |

### Views
- **All** (default)
- **Follow-up due** (highlight overdue rows)
- **Replied** (track conversion rate)

### Status flow
```
DRAFT → SENT → REPLIED
              → FOLLOW_UP_DUE → SENT (follow-up) → REPLIED
              → CLOSED
```

---

## UI structure

```
/app
  /dashboard          ← CRM table, main view
  /new                ← paste URL, run research, review draft
  /outreach/[id]      ← detail view, edit draft, update status
  /settings           ← voice samples, target stack config
```

### New outreach flow (`/new`)

1. **Input:** URL paste field + "Research" button
2. **Loading:** streaming progress indicator (step labels: "Scraping job post..." → "Researching company..." → "Extracting signals..." → "Scoring opportunity..." → "Drafting message...")
3. **Result panel:**
   - Left: opportunity card (company summary, score breakdown, manager insights)
   - Right: drafted message with edit-in-place text area
4. **Actions:** "Save draft" / "Mark as sent" / "Discard"

---

## Environment variables needed

```env
# AI
ANTHROPIC_API_KEY=

# Scraping
FIRECRAWL_API_KEY=

# Database
DATABASE_URL=

# Auth (optional for MVP — can skip and just use a hardcoded user)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## What to skip in MVP

- Multi-user auth (build for yourself first — one hardcoded user is fine)
- Email open tracking (adds complexity, not worth it yet)
- LinkedIn API integration (scrape public profiles via Firecrawl instead)
- Mobile UI (desktop-first for now)
- Automated follow-up scheduling (set the date, send manually)

---

## Build order

**Day 1–2:** Database setup, Prisma schema, basic API routes  
**Day 3–4:** Firecrawl integration, signal extraction prompt  
**Day 5–6:** Scoring logic, draft prompt, end-to-end `/new` flow working  
**Day 7:** Voice calibration UI and settings page  
**Day 8–9:** Dashboard / CRM table, status updates  
**Day 10:** Polish, README, demo video  

---

## Demo story (for interviews)

"I was four months into a job search getting 2% callback rates from job boards. So I built a tool that researches a company and hiring manager, scores the opportunity against my stack, and drafts a personalized outreach message in my voice — all from a single URL paste. Want to see it pull up your company right now?"

Then paste their LinkedIn or company URL live. That's the demo.

---

## Repo structure suggestion

```
outreach-engine/
  apps/
    web/                ← Next.js 15 app
  packages/
    db/                 ← Prisma schema + client
    ai/                 ← agent loop, prompts, tools
  .env.example
  README.md
  DEMO.md              ← interview talking points
```

Turborepo monorepo mirrors your MyBodyQuest setup — consistent story across your portfolio.