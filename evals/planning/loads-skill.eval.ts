import { defineEval } from "eve/evals";

export default defineEval({
  description: "Planning requests load the plan-week skill and start from real deadlines.",
  tags: ["planning"],
  async test(t) {
    await t.send("Can you plan my next two weeks for CS 146S?");
    t.succeeded();
    t.calledSkill("plan-week");
    t.calledTool("list_deadlines");
  },
});
