import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defineAgent } from "eve";

// Gemini via the Google AI Studio API. The provider reads
// GOOGLE_GENERATIVE_AI_API_KEY; a free AI Studio key works.
const google = createGoogleGenerativeAI({
  // Optional: route through a proxy or a compatible endpoint.
  baseURL: process.env.GOOGLE_GENERATIVE_AI_BASE_URL || undefined,
});

export default defineAgent({
  model: google(process.env.GEMINI_MODEL || "gemini-3.5-flash"),
  // Set explicitly so eve doesn't need the AI Gateway catalog for a direct
  // Google model. Lower than Gemini's real limit, so compaction starts early.
  modelContextWindowTokens: 200_000,
  // Least privilege: this agent only reads the calendar and assignment specs,
  // so it gets its own three tools and memory, not eve's bash, file and web
  // tools. Fetched documents can't talk it into running commands.
  defaultTools: false,
});
