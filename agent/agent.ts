import { google } from "@ai-sdk/google";
import { defineAgent } from "eve";

// Gemini via the Google AI Studio API: set GOOGLE_GENERATIVE_AI_API_KEY.
// A free AI Studio key works; no paid key is needed.
export default defineAgent({
  model: google(process.env.GEMINI_MODEL || "gemini-3.5-flash"),
  // Set explicitly so eve doesn't need the AI Gateway catalog for a direct
  // Google model. Lower than Gemini's real limit, so compaction starts early.
  modelContextWindowTokens: 200_000,
});
