import { defineMemory } from "eve/memory";
import { fileMemory } from "eve/memory/file";
import { byPrincipal } from "eve/memory/scope";

export default defineMemory({
  description:
    "Remember which CS 146S deliverables the student has finished or started, what each OSS contribution was, " +
    "and how they like to plan their week.",
  provider: fileMemory(),
  scope: byPrincipal,
});
