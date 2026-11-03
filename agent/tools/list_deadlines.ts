import { defineTool } from "eve/tools";
import { z } from "zod";

import { daysBetween, loadCalendar, todayInCourseTz } from "../lib/calendar.ts";

export default defineTool({
  description:
    "List CS 146S deadlines (assignments, OSS contributions, project milestones, forms) from the course calendar, " +
    "with days remaining counted from today in Pacific time. Use this for any question about what is due or when. " +
    "Each deadline's `week` can be passed to week_schedule, and the N in an 'Assignment N' title to get_assignment_spec.",
  label: { start: () => "Checking the course calendar" },
  inputSchema: z.object({
    withinDays: z
      .number()
      .int()
      .min(0)
      .max(120)
      .optional()
      .describe("Only include deadlines due within this many days from today. Default 14."),
    includePast: z.boolean().optional().describe("Also include deadlines that have already passed. Default false."),
    category: z
      .enum(["oss-contribution", "assignment", "project", "form", "other"])
      .optional()
      .describe("Only include one kind of deadline."),
  }),
  async execute({ withinDays = 14, includePast = false, category }, ctx) {
    const calendar = await loadCalendar({ signal: ctx.abortSignal });
    const today = todayInCourseTz();

    const deadlines = calendar.items
      .filter((i) => i.isDeadline && (!category || i.category === category))
      .map((i) => ({
        date: i.date,
        weekday: i.weekday,
        title: i.title,
        category: i.category,
        week: i.week,
        daysLeft: daysBetween(today, i.date),
        ...(i.time ? { time: i.time } : {}),
        ...(i.weekdayMismatch ? { warning: "The doc's weekday doesn't match this date; it may be a typo." } : {}),
      }))
      .filter((d) => (includePast || d.daysLeft >= 0) && d.daysLeft <= withinDays);

    return {
      today,
      timeZone: "America/Los_Angeles",
      calendarSource: calendar.source,
      note: "The calendar lists due dates only, not times. Check Canvas or Gradescope for the exact cutoff.",
      deadlines,
    };
  },
});
