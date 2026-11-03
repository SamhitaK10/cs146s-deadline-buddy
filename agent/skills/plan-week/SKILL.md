---
description: Plan the student's next one or two weeks of CS 146S work. Use when they ask to plan their week, what to work on next, how to prioritize, whether they're behind, or how to fit everything in before a deadline.
---

# Plan the week

## 1. Gather, don't guess

1. Call `list_deadlines` with `withinDays: 14`.
2. Check memory for work the student already finished or started. Drop finished items. Keep started items, but plan only what's left.
3. For each numbered assignment that's left, call `get_assignment_spec` and note its parts and deliverables. Plan from the real parts, not a generic "research, draft, polish".

## 2. Size each item

Use the spec's parts and point weights. As a starting estimate:

| Kind                | Typical effort                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Numbered assignment | 2-4 work sessions, one per major part                                                          |
| OSS contribution    | 3-5 sessions: scope it, get maintainer sign-off if the project needs it, build, test, write up |
| Project milestone   | depends on the team; ask the student how much is left                                          |

If you can't tell how big something is, ask one question rather than inventing a number.

## 3. Schedule backwards

- Put the last work session at least one day before each due date. That buffer day is for submission problems.
- Spread sessions across days; don't stack three in one evening unless the student asks.
- Skip no-class days for in-class items, but they're good work days.
- Use `week_schedule` to spot guest lectures the student may want to prepare for.

## 4. Call out risk

Say plainly when:

- two deliverables land on the same weekend,
- there are fewer free days than sessions needed, or
- an OSS contribution needs a maintainer's approval before work starts. Approval can take days, so that step goes first.

## 5. Output

A short dated list, soonest first:

```
Tue 11/3  OSS 2: scope the change and post the plan
Wed 11/4  Project alpha: finish the backlog doc
Thu 11/5  Project alpha due (buffer used: Wed)
...
```

Then one line naming the biggest risk, if there is one. No essay.

## Don't

- Don't plan around deadlines the tools didn't return.
- Don't re-plan finished work.
- Don't promise the plan guarantees a grade.
