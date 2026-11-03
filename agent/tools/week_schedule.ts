import { defineTool } from "eve/tools";
import { z } from "zod";

import { daysBetween, loadCalendar, todayInCourseTz, weekForDate } from "../lib/calendar.ts";

export default defineTool({
  description:
    "Show everything on the CS 146S calendar for one course week: the week's topic, lectures, guest speakers, " +
    "no-class days, notes, and deadlines. Pick the week by number (the `week` field from list_deadlines), or by a " +
    "date inside it. With neither, shows the current week. Course weeks run Tuesday through Sunday, so on a Monday " +
    "this shows the week that is about to start.",
  label: { start: ({ week }) => (week ? `Reading week ${week}'s schedule` : "Reading this week's schedule") },
  inputSchema: z.object({
    week: z.number().int().min(1).max(11).optional().describe("Course week number, 1-11."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("A date (YYYY-MM-DD) inside the week to show. Ignored when `week` is given."),
  }),
  async execute({ week, date }, ctx) {
    const calendar = await loadCalendar({ signal: ctx.abortSignal });
    const today = todayInCourseTz();
    const target = week ?? weekForDate(calendar.items, date ?? today);

    const weekItems = calendar.items.filter((i) => i.week === target);
    if (target === undefined || weekItems.length === 0) {
      return {
        calendarSource: calendar.source,
        error: `Week ${target ?? "?"} isn't on the calendar.`,
        retryable: false,
        hint: "Weeks run 1-11. Call list_deadlines to see which weeks have items.",
      };
    }

    return {
      today,
      calendarSource: calendar.source,
      week: target,
      topic: weekItems[0].weekTitle,
      items: weekItems.map((i) => ({
        date: i.date,
        weekday: i.weekday,
        title: i.title,
        category: i.category,
        isDeadline: i.isDeadline,
        daysFromToday: daysBetween(today, i.date),
        ...(i.time ? { time: i.time } : {}),
        ...(i.notes.length ? { notes: i.notes } : {}),
      })),
    };
  },
});
