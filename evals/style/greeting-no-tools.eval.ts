import { defineEval } from "eve/evals";

export default defineEval({
  description: "Small talk doesn't trigger tool calls (near-miss for the date rule).",
  tags: ["style"],
  async test(t) {
    await t.send("hi! who are you?");
    t.succeeded();
    t.usedNoTools();
  },
});
