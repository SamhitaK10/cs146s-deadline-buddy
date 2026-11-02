import { defineTool } from "eve/tools";
import { z } from "zod";

import { daysBetween, loadCalendar, todayInCourseTz } from "../lib/calendar.ts";

export default defineTool({
  description:
    "Show everything on the CS 146S calendar for one course week: the week's topic, lectures, guest speakers, " +
    "no-class days, notes, and deadlines. Pick the week by number, or by a date that falls in it (default: today).",
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
    const items = calendar.items;

    let target = week;
    if (target === undefined) {
      const anchor = date ?? today;
      // The week whose items start on or before the anchor date, i.e. the latest week that has begun.
      const started = items.filter((i) => i.week !== undefined && i.date <= anchor);
      target = started.length ? started[started.length - 1].week : items[0]?.week;
    }

    const weekItems = items.filter((i) => i.week === target);
    if (weekItems.length === 0) {
      return { calendarSource: calendar.source, error: `Week ${target} isn't on the calendar.` };
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
