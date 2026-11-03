import { defineEvalConfig } from "eve/evals";

// Evals call the real model (Gemini), so set GOOGLE_GENERATIVE_AI_API_KEY first.
// Keep concurrency low: the free Gemini tier is rate limited.
export default defineEvalConfig({
  maxConcurrency: 2,
  timeoutMs: 90_000,
});
