# Content Drafting Dashboard

Internal tool for anb's marketing team (3 named users) to generate on-brand
Arabic X/Twitter post drafts using Claude — either via a structured form or
free-text chat — with no auto-posting anywhere.

## Stack

- Next.js 16 (App Router) + Tailwind CSS 4
- Session auth via a signed HTTP-only cookie (HMAC, no external auth service)
- `@anthropic-ai/sdk` for draft generation (Claude Sonnet)
- `googleapis` for append-only logging to a Google Sheet via a service account

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `ANTHROPIC_API_KEY` — from the Anthropic Console.
- `SESSION_SECRET` — any long random string, e.g. `openssl rand -hex 32`.
- `USER1_*` / `USER2_*` / `USER3_*` — the 3 hardcoded logins.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`,
  `GOOGLE_SHEET_ID` — see below. Logging is skipped (with a console warning,
  not an error) if these are left blank, so the app works without them.

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setting up Google Sheets logging

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select
   a project and enable the **Google Sheets API**.
2. Create a **Service Account** (IAM & Admin → Service Accounts), then create
   a JSON key for it and download it.
3. Open the target Google Sheet and **Share** it with the service account's
   `client_email` (Editor access) — this replaces any OAuth login flow.
4. From the JSON key file, copy:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (keep the `\n`
     escape sequences, wrap the whole value in quotes)
5. Copy the Sheet ID from its URL
   (`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`) →
   `GOOGLE_SHEET_ID`.
6. The target sheet is expected to have a header row with (at least) these
   columns: `ID | Category | Partner/Brand | Mechanic | Discount or Detail |
   Link | Status | Draft | Feedback`. This app appends `Timestamp` and
   `Username` as two extra columns after those (add that header manually if
   your sheet doesn't have them yet, or let it get created via any Sheets API
   write to `J1:K1`). Each generated draft appends one row, filling
   Category/Partner/Mechanic/Discount/Link/Draft/Timestamp/Username and
   leaving `ID`, `Status`, and `Feedback` blank for manual use.

## Brand colors

Placeholder anb-style navy palette lives in `src/app/globals.css` under the
`--anb-*` CSS variables. Swap in the exact brand hex codes there — Tailwind
utility classes (`bg-anb-navy`, `text-anb-blue`, etc.) pick them up
automatically.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel, or run `vercel` from the
   project root.
2. Add every variable from `.env.example` as a Vercel Environment Variable
   (Project Settings → Environment Variables) — set them for Production (and
   Preview if you want staging logins to work too).
3. Deploy. No other configuration is needed — auth, generation, and logging
   all run as Next.js Route Handlers.

## Voice grounding

`src/lib/voiceExamples.ts` holds a curated set of real, high-engagement anb
posts (extracted from a ~2,000-post export, links redacted to `[LINK]`),
grouped by category. `lib/prompt.ts` injects a few of these into every
generation call so drafts match anb's actual published tone rather than a
hand-written approximation of it. To refresh this set from a new export,
re-run the categorize/curate pass and update the arrays in that file.

## Two creation modes

- **Structured form** — category/partner/mechanic/detail/link fields.
- **Free chat** — a single free-text box; the model infers the closest
  template itself.

Both modes share the same system prompt and guardrails: the model refuses to
draft financial announcements, regulatory disclosures, official fraud
warnings, or partnership/event news, asking the user to write those manually
instead.

## What this app deliberately does not do

- No public sign-up — only the 3 hardcoded logins work.
- No auto-posting or auto-sending anywhere; drafts are copy-only.
- No WhatsApp/Hootsuite integration.
