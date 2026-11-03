# Deadline Buddy

An [eve](https://eve.dev) agent (Vercel's agent framework) that answers CS 146S deadline and assignment questions on Gemini. eve compiles everything under `agent/` into the running agent; there is no other app code.

## Layout

- `agent/agent.ts`: model (Gemini via `@ai-sdk/google`) and `defaultTools: false`. Keep that flag: it's the main security boundary (see `SECURITY.md`).
- `agent/instructions.md`: system prompt. `agent/skills/plan-week/SKILL.md`: the planning procedure, loaded on demand.
- `agent/tools/*.ts`: one tool per file; **the filename is the tool name the model sees**, so renaming a file renames the tool and breaks the evals.
- `agent/lib/calendar.ts`: fetch, parse, and date math. All tools go through `loadCalendar()`; don't fetch the doc anywhere else.
- `agent/lib/calendar-snapshot.ts`: offline copy of the calendar, the fallback when the live fetch fails.
- `agent/channels/`: `eve.ts` (HTTP API) and `mcp.ts` (MCP server). `agent/memory/file.ts`, `agent/schedules/weekly-digest.ts`.
- `test/`: unit tests (`node:test`). `evals/`: model evals (`eve eval`, need a Gemini key).

## Commands

Node 24 is required (`.nvmrc`); eve won't run on older versions.

```bash
npm install
npm run check        # tsc + biome + unit tests; run before every commit
npm run format       # biome autofix
npm run dev          # eve dev server + terminal UI on :2000
npx eve build        # full compile; catches bad tool/skill/schedule definitions tsc misses
npm run eval         # model evals; needs GOOGLE_GENERATIVE_AI_API_KEY
semgrep scan --config .semgrep/rules.yml .   # project security rules
```

Fire the schedule by hand while `npm run dev` runs: `curl -X POST http://localhost:2000/eve/v1/dev/schedules/weekly-digest`.

## Conventions

- Imports inside `agent/` and `test/` use explicit `.ts` extensions (`../lib/calendar.ts`); Node runs the tests without a build step.
- Dates are `YYYY-MM-DD` strings in Pacific time. Use `todayInCourseTz()` and `daysBetween()`; never `new Date()` arithmetic in tools.
- Tool errors are returned as data (`{ error, retryable }`), not thrown, except when the turn was cancelled.
- Every `fetch` passes a `signal` with a timeout (Semgrep enforces this).
- Constraints go in the Zod schema (enums, int ranges), not only in the description. Descriptions say where an argument comes from so tools chain.

## Guardrails

- Don't add a tool that writes, sends, or executes. The agent reads untrusted docs; read-only is the point.
- Don't edit `calendar-snapshot.ts` by hand to "fix" a date. Refresh it from the live doc, then update the tests that pin dates.
- Biome formats Markdown it's pointed at and breaks skill frontmatter, so `biome.json` limits it to `.ts`/`.json`. Keep it that way.
- `.eve/` and `.output/` are build output; never commit them.
- Commits are authored as `samhitak10`.
