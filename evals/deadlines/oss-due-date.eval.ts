import { defineEval } from "eve/evals";

export default defineEval({
  description: "Answers a due-date question from the calendar tool, not from memory.",
  tags: ["deadlines"],
  async test(t) {
    await t.send("When is OSS Contribution 2 due?");
    t.succeeded();
    t.calledTool("list_deadlines");
    t.noFailedCalls();
    t.messageIncludes(/11\/8|Nov(ember)?\.? 8/i);
  },
});
