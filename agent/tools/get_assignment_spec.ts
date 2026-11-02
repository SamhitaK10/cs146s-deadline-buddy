import { defineTool } from "eve/tools";
import { z } from "zod";

const REPO_RAW = "https://raw.githubusercontent.com/mihail911/modern-software-dev-assignments/master";
const MAX_CHARS = 15_000;

export default defineTool({
  description:
    "Fetch the official instructions for a numbered CS 146S assignment (week N's assignment.md in the course's " +
    "public GitHub repo). Use it before explaining what an assignment requires or planning work on it.",
  label: { start: ({ week }) => `Reading Assignment ${week}` },
  inputSchema: z.object({
    week: z.number().int().min(1).max(11).describe("Assignment / week number, e.g. 5 for Assignment 5."),
  }),
  async execute({ week }, ctx) {
    const url = `${REPO_RAW}/week${week}/assignment.md`;
    const timeout = AbortSignal.timeout(10_000);
    const res = await fetch(url, { signal: AbortSignal.any([ctx.abortSignal, timeout]) });

    if (res.status === 404) {
      return {
        week,
        found: false,
        message: `Assignment ${week} hasn't been published in the course repo yet.`,
        source: url,
      };
    }
    if (!res.ok) throw new Error(`GitHub returned HTTP ${res.status} for ${url}. Try again shortly.`);

    const text = await res.text();
    return {
      week,
      found: true,
      source: url,
      truncated: text.length > MAX_CHARS,
      instructions: text.slice(0, MAX_CHARS),
    };
  },
});
