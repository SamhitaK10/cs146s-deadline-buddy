# CS 146S Deadline Buddy

An [eve](https://eve.dev) agent that keeps track of everything due in Stanford's CS 146S: The Modern Software Developer, explains what each assignment asks for, and plans your week around the next deadlines.

It reads the course's own calendar, so it doesn't drift when the schedule changes, and it runs on Gemini, so a free Google AI Studio key is all it needs. You can chat with it in the terminal, or plug it into Claude Code or Cursor as an MCP server and ask about deadlines without leaving your editor.

> Built for CS 146S (Fall 2026), Vercel track, OSS Contribution 2.

## What it can do

Ask it things like:

- "What's due this week?"
- "When are the OSS contributions due?"
- "What does Assignment 4 ask for?"
- "Plan my next two weeks. I already finished the project alpha."
- "Is there class on Tuesday?"

| Piece | File | What it does |
|---|---|---|
| `list_deadlines` | `agent/tools/list_deadlines.ts` | Deadlines from the live course calendar, with days left in Pacific time. Filters by window and kind. |
| `week_schedule` | `agent/tools/week_schedule.ts` | One course week: topic, lectures, guests, no-class days, notes, deadlines. Knows weeks run Tue-Sun. |
| `get_assignment_spec` | `agent/tools/get_assignment_spec.ts` | The official `weekN/assignment.md`, including rubric, so explanations come from the real spec. |
| `plan-week` skill | `agent/skills/plan-week/SKILL.md` | The planning procedure, loaded only when you ask for a plan. |
| File memory | `agent/memory/file.ts` | Remembers what you've finished, across sessions, so plans leave it out. |
| Weekly digest | `agent/schedules/weekly-digest.ts` | Sundays and Wednesdays, posts the next two weeks of deadlines to Slack. No model call. |
| MCP server | `agent/channels/mcp.ts` | Exposes the agent and its tools to Claude Code, Cursor, or any MCP client. |

## How it applies the course

Each piece follows a practice from the CS 146S lectures and assignments.

| Week | Topic | Where it shows up |
|---|---|---|
| 1 | Coding-agent internals: system prompts | `instructions.md` is organized by the failure each section prevents (wrong dates, made-up specs, injected instructions), with an explicit "When not to act" section. Today's date reaches the model as tool output rather than being guessed. |
| 2 | MCP and tool design | Constraints live in the schemas (enums, int ranges, date pattern), outputs are shaped instead of raw, errors are data with `retryable`, and descriptions say where each argument comes from so tools chain. The agent is itself an MCP server. |
| 3 | Agent skills | Planning is a skill whose description says when to fire, with judgment (sizing, buffers, risk calls) and a "Don't" list, kept out of the always-loaded prompt. A greeting eval is the near-miss that should not trigger tools. |
| 4 | Customizing the agent and repo | `AGENTS.md` (also loaded via `CLAUDE.md`) gives exact commands, layout, conventions, and guardrails specific to this repo, in about a page. |
| 5 | Agent-ready codebases | One `npm run check` for typecheck, lint, and tests; CI; Biome lint/format; `.nvmrc`; `.env.example`; PR and issue templates; Dependabot; `SECURITY.md`. |
| 6 | Agentic code review | The PR template asks for evidence (checks run, schema/description agreement) and where the reviewer should look. Evals turn behavior into checks a reviewer can rerun. |
| 7 | Security | Least privilege (`defaultTools: false`: no shell, file, or web tools), fetched text treated as untrusted, validated doc ID, timeouts on every fetch. CI runs Semgrep with three project rules in `.semgrep/rules.yml` plus the TypeScript and secrets rulesets. |
| 8 | Background agents | The digest runs on a schedule with no one watching, and is built without the model so it can't be prompt-injected. |
| 10 | The software factory | Evals in `evals/` and CI give the agent a self-check loop: change a prompt or tool, rerun, see what broke. |

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
| `GOOGLE_GENERATIVE_AI_BASE_URL` | no | Google's API; set to route through a proxy |

### Use it from Claude Code

With `npm run dev` running:

```bash
claude mcp add --transport http deadline-buddy http://localhost:2000/eve/v1/mcp
```

Then ask Claude Code "what's due for CS 146S this week?" It can call `list_deadlines` directly, or hand the whole question to the agent with `agent_start`. The MCP server only accepts local callers under `eve dev`; see `SECURITY.md` before deploying it.

### Try the digest

```bash
curl -X POST http://localhost:2000/eve/v1/dev/schedules/weekly-digest
```

## How the calendar is read

`agent/lib/calendar.ts` downloads the course calendar Google Doc as plain text and parses lines like `Sun 11/8: OSS Contribution 2 due` into dated items grouped by `Week N:` headers. Undated lines become notes on the item above. It checks every printed weekday against its date, so a typo in the doc gets flagged instead of silently giving a wrong day. Live results are cached for five minutes, since one answer often calls several calendar tools.

If the doc can't be fetched, or comes back as something that isn't the calendar (like a sign-in page), the agent uses the saved copy in `agent/lib/calendar-snapshot.ts` and tells you so.

## Checks

```bash
npm run check    # typecheck + lint + unit tests
npm run eval     # model evals against Gemini (needs your key)
```

- **Unit tests** (`test/`) cover the calendar parser (all four OSS contributions, week grouping, notes, times, weekday checks, Google Docs export quirks), the current-week logic (including the Monday after a deadline and the Thanksgiving gap), doc ID validation, the snapshot fallback, and the digest.
- **Evals** (`evals/`) check behavior: due dates come from `list_deadlines`, assignments are explained from `get_assignment_spec`, planning loads the `plan-week` skill, and small talk triggers no tools.
- **CI** (`.github/workflows/ci.yml`) runs the checks, an `eve build`, and Semgrep on every push and PR. Evals run on demand from the Actions tab once you add the `GOOGLE_GENERATIVE_AI_API_KEY` secret.

## Deploy

```bash
npm run deploy
```

On Vercel, set the environment variables above in the project settings, and run `npx eve integration setup file-memory` once to connect storage for memory. The schedule runs in UTC (`0 17 * * 0,3`, about 9-10 AM Pacific).

## Using it for another course

Point `COURSE_CALENDAR_DOC_ID` at any public Google Doc that uses the same `Week N: Title` / `Day M/D: Item` layout, and refresh the snapshot file.
