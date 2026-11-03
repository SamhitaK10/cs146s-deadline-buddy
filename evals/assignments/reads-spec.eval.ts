import { defineEval } from "eve/evals";

export default defineEval({
  description: "Reads the official spec before explaining an assignment.",
  tags: ["assignments"],
  async test(t) {
    await t.send("What does Assignment 4 ask me to do?");
    t.succeeded();
    t.calledTool("get_assignment_spec", { input: { week: 4 } });
    // Week 4 is "Make a Messy Repo Agent-Ready": the answer should mention the file it asks for.
    t.messageIncludes(/AGENTS\.md|CLAUDE\.md/i);
  },
});
