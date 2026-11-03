# Security

## What the agent can touch

Deadline Buddy is read-only by design:

- **Network:** it fetches the course calendar from `docs.google.com` and assignment specs from `raw.githubusercontent.com/mihail911/modern-software-dev-assignments`. The calendar doc ID is validated before it goes into a URL. Every fetch has a timeout.
- **No shell or files:** eve's default `bash`, file and web tools are turned off (`defaultTools: false` in `agent/agent.ts`). The agent has only its three tools plus memory.
- **Memory** holds course progress only, scoped to each signed-in user.
- **The weekly digest** posts to one Slack webhook you configure. It makes no model call.

## Prompt injection

The calendar and the specs are documents other people write. The instructions tell the model to treat their text as information, never as instructions. Even if that fails, the agent has no tool that could act on an injected command: it can't run code, write files, or send anything except the digest, which is built without the model.

## Secrets

Keys live in `.env.local` (gitignored) locally and in your host's environment when deployed. Never commit them. CI runs Semgrep with Semgrep's secrets ruleset and project rules in `.semgrep/rules.yml` that block logging environment variables, fetches without timeouts, and spawning processes.

## Auth

The MCP channel and the base eve channel accept local callers only under `eve dev`. Configure a real auth provider before you deploy either one for other people.

## Reporting

Open an issue, or for anything sensitive, contact the maintainer through GitHub rather than filing it publicly.
