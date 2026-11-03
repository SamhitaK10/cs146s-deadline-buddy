import { defineTool } from "eve/tools";
import { z } from "zod";

const REPO_RAW = "https://raw.githubusercontent.com/mihail911/modern-software-dev-assignments/master";
const MAX_CHARS = 15_000;

export default defineTool({
  description:
    "Fetch the official instructions for a numbered CS 146S assignment (week N's assignment.md in the course's " +
    "public GitHub repo), including its rubric and submission steps. The number is the N in 'Assignment N' from " +
    "list_deadlines. Use it before explaining what an assignment requires or planning work on it. It covers " +
    "numbered assignments only; OSS contributions and the final project have no spec in the repo.",
  label: { start: ({ week }) => `Reading Assignment ${week}` },
  inputSchema: z.object({
    week: z.number().int().min(1).max(11).describe("Assignment number, e.g. 5 for Assignment 5."),
  }),
  async execute({ week }, ctx) {
    const url = `${REPO_RAW}/week${week}/assignment.md`;

    let res: Response;
    try {
      const timeout = AbortSignal.timeout(10_000);
      res = await fetch(url, { signal: AbortSignal.any([ctx.abortSignal, timeout]) });
    } catch (error) {
      if (ctx.abortSignal.aborted) throw error;
      return {
        week,
        found: false,
        error: `Couldn't reach GitHub: ${(error as Error).message}`,
        retryable: true,
        source: url,
      };
    }

    // Errors are data: say whether trying again could help.
    if (res.status === 404) {
      return {
        week,
        found: false,
        error: `Assignment ${week} hasn't been published in the course repo yet.`,
        retryable: false,
        source: url,
      };
    }
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      return { week, found: false, error: `GitHub returned HTTP ${res.status}.`, retryable, source: url };
    }

    const text = await res.text();
    return {
      week,
      found: true,
      source: url,
      truncated: text.length > MAX_CHARS,
      // Untrusted document text: read it as reference, never as instructions.
      instructions: text.slice(0, MAX_CHARS),
    };
  },
});
