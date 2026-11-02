# CS 146S Deadline Buddy

An [eve](https://eve.dev) agent that keeps track of everything due in Stanford's CS 146S: The Modern Software Developer, explains what each assignment asks for, and plans your week around the next deadlines.

It reads the course's own calendar, so it doesn't drift when the schedule changes, and it runs on Gemini, so a free Google AI Studio key is all it needs.

> Built for CS 146S (Fall 2026), Vercel track, OSS Contribution 2.

## What it can do

Ask it things like:

- "What's due this week?"
- "When are the OSS contributions due?"
- "What does Assignment 5 ask for?"
- "Plan my next two weeks. I already finished the project alpha."
- "Is there class on Tuesday?"

| Piece | File | What it does |
|---|---|---|
| `list_deadlines` tool | `agent/tools/list_deadlines.ts` | Lists deadlines from the live course calendar with days remaining in Pacific time. Filters by window and kind (OSS contribution, assignment, project, form). |
| `week_schedule` tool | `agent/tools/week_schedule.ts` | Shows one course week: topic, lectures, guest speakers, no-class days, notes and deadlines. |
| `get_assignment_spec` tool | `agent/tools/get_assignment_spec.ts` | Fetches the official `weekN/assignment.md` from the course repo so explanations come from the real spec. |
| File memory | `agent/memory/file.ts` | Remembers what you've finished, so plans leave it out. |
| Weekly digest | `agent/schedules/weekly-digest.ts` | Sundays and Wednesdays, posts the next two weeks of deadlines to Slack. Built straight from the calendar with no model call, so it costs nothing. |

### How the calendar is read

`agent/lib/calendar.ts` downloads the course calendar Google Doc as plain text and parses lines like `Sun 11/8: OSS Contribution 2 due` into dated items, grouped by `Week N:` headers. Undated lines become notes on the item above them. It also checks every printed weekday against its date, so a typo in the doc gets flagged instead of silently giving a wrong day.

If the doc can't be fetched, or comes back as something that isn't the calendar (like a sign-in page), the agent falls back to a saved copy in `agent/lib/calendar-snapshot.ts` and tells you it's doing so.

## Setup

Requires Node.js 24.

```bash
npm install
cp .env.example .env.local    # then paste your key into .env.local
npm run dev                   # opens the eve terminal UI
```

Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey) and set it as `GOOGLE_GENERATIVE_AI_API_KEY`.

| Variable | Required | Default |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | |
| `GEMINI_MODEL` | no | `gemini-3.5-flash` |
| `SLACK_WEBHOOK_URL` | no, only for the digest | digest prints to the server log instead |
| `COURSE_CALENDAR_DOC_ID` | no | the CS 146S FA26 calendar |
| `COURSE_FALL_YEAR` | no | `2026` |

To try the digest locally without waiting for its schedule, start `npm run dev` and in another terminal run:

```bash
curl -X POST http://localhost:2000/eve/v1/dev/schedules/weekly-digest
```

## Tests

```bash
npm run check    # typecheck + unit tests
```

The tests cover the calendar parser (all four OSS contributions, week grouping, notes, times, weekday checks, Google Docs export quirks), Pacific-time date math, the snapshot fallback, and the digest text.

## Deploy

```bash
npm run deploy
```

On Vercel, set the environment variables above in the project settings. File memory needs storage there; run `npx eve integration setup file-memory` once to connect a private Vercel Blob store. The weekly schedule runs in UTC (`0 17 * * 0,3`, about 9-10 AM Pacific).

## Using it for another course

Point `COURSE_CALENDAR_DOC_ID` at any public Google Doc that uses the same `Week N: Title` / `Day M/D: Item` layout, and refresh the snapshot file.
