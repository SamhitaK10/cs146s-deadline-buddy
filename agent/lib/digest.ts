import { daysBetween, type CalendarItem } from "./calendar.ts";

function when(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/**
 * Plain-text summary of the deadlines in the next `withinDays` days.
 * Used by the weekly schedule, which posts without calling the model.
 */
export function formatDigest(items: CalendarItem[], today: string, source: string, withinDays = 14): string {
  const upcoming = items
    .filter((i) => i.isDeadline)
    .map((i) => ({ ...i, daysLeft: daysBetween(today, i.date) }))
    .filter((i) => i.daysLeft >= 0 && i.daysLeft <= withinDays);

  const lines = [`*CS 146S: due in the next ${withinDays} days* (as of ${today})`];
  if (upcoming.length === 0) {
    lines.push("Nothing due. Enjoy it.");
  } else {
    for (const i of upcoming) {
      lines.push(`• ${i.weekday} ${i.date.slice(5).replace("-", "/")}: ${i.title} (${when(i.daysLeft)})`);
    }
  }
  if (source !== "live") lines.push(`_Calendar source: ${source}_`);
  return lines.join("\n");
}
