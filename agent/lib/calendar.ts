// Parses the CS 146S course calendar (a public Google Doc) into dated items.
//
// The doc is plain text shaped like:
//
//   Week 4: Customizing Your Agent and Repository
//   Tue 10/13: Customizing your agentic setup (CLAUDE.md, AGENTS.md, hooks)
//   Thu 10/15: Project Technical Specification due
//   Sun 10/18: OSS Contribution 1 due
//
// Undated lines under a dated one (for example "Ashley from Factory is doing
// onboarding after class") are kept as notes on the item above them.

import { CALENDAR_SNAPSHOT, CALENDAR_SNAPSHOT_DATE } from "./calendar-snapshot.ts";

export const DEFAULT_CALENDAR_DOC_ID = "1W11sWBigWIsi9wVIhhFx3wajIEnP0Qfb-ei8Ecf5VKU";

export type Category =
  | "oss-contribution"
  | "assignment"
  | "project"
  | "form"
  | "guest-lecture"
  | "class"
  | "no-class"
  | "other";

export interface CalendarItem {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** Weekday as printed in the doc, e.g. "Sun". */
  weekday: string;
  title: string;
  /** Time as printed in the doc, e.g. "7 - 10 PM". Most items have none. */
  time?: string;
  category: Category;
  isDeadline: boolean;
  week?: number;
  weekTitle?: string;
  notes: string[];
  /** Set when the printed weekday doesn't match the date, which usually means a typo in the doc. */
  weekdayMismatch?: boolean;
}

export interface Calendar {
  items: CalendarItem[];
  /** "live" when fetched from Google Docs just now, otherwise the snapshot date. */
  source: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_RE = /^Week\s+(\d+):\s*(.+)$/i;
const ITEM_RE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\/(\d{1,2})(?:\s*\(([^)]*)\))?\s*:\s*(.+)$/;

function categorize(title: string): Category {
  const t = title.toLowerCase();
  if (t.includes("oss contribution")) return "oss-contribution";
  if (/\bassignment\b/.test(t)) return "assignment";
  if (/\bproject\b/.test(t)) return "project";
  if (/\bform\b/.test(t)) return "form";
  if (t.startsWith("no class")) return "no-class";
  if (t.startsWith("guest:")) return "guest-lecture";
  if (/\bdue\b/.test(t)) return "other";
  return "class";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The doc gives month/day only. Fall-quarter months (Aug-Dec) belong to
 * `fallYear`; earlier months roll into the next calendar year.
 */
function isoDate(month: number, day: number, fallYear: number): string {
  const year = month >= 8 ? fallYear : fallYear + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function weekdayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function parseCalendar(text: string, fallYear = 2026): CalendarItem[] {
  const items: CalendarItem[] = [];
  let week: number | undefined;
  let weekTitle: string | undefined;
  let last: CalendarItem | undefined;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/ /g, " ").trim();
    if (!line) continue;

    const w = WEEK_RE.exec(line);
    if (w) {
      week = Number(w[1]);
      weekTitle = w[2].trim();
      last = undefined;
      continue;
    }

    const m = ITEM_RE.exec(line);
    if (m) {
      const [, weekday, month, day, time, title] = m;
      const date = isoDate(Number(month), Number(day), fallYear);
      const item: CalendarItem = {
        date,
        weekday,
        title: title.trim(),
        category: categorize(title),
        isDeadline: /\bdue\b/i.test(title),
        notes: [],
      };
      if (time) item.time = time.trim();
      if (week !== undefined) {
        item.week = week;
        item.weekTitle = weekTitle;
      }
      if (weekdayOf(date) !== weekday) item.weekdayMismatch = true;
      items.push(item);
      last = item;
      continue;
    }

    // An undated line inside a week is a note on the item above it.
    if (last) last.notes.push(line);
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Today's date (YYYY-MM-DD) in the course's time zone. */
export function todayInCourseTz(now = new Date(), timeZone = "America/Los_Angeles"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole days from `fromIso` to `toIso` (negative when `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86_400_000);
}

export function exportUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/export?format=txt`;
}

/**
 * Fetches the live calendar. If the doc can't be reached, falls back to the
 * snapshot bundled with the agent so it can still answer, and says so.
 */
export async function loadCalendar(options: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}): Promise<Calendar> {
  const docId = process.env.COURSE_CALENDAR_DOC_ID || DEFAULT_CALENDAR_DOC_ID;
  const fallYear = Number(process.env.COURSE_FALL_YEAR) || 2026;
  const doFetch = options.fetchImpl ?? fetch;

  try {
    const timeout = AbortSignal.timeout(8_000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    const res = await doFetch(exportUrl(docId), { signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const items = parseCalendar(text, fallYear);
    // A login page or an emptied doc parses to nothing; don't trust it.
    if (items.length === 0) throw new Error("no dated items found in the document");
    return { items, source: "live" };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return {
      items: parseCalendar(CALENDAR_SNAPSHOT, fallYear),
      source: `snapshot from ${CALENDAR_SNAPSHOT_DATE} (live fetch failed: ${(error as Error).message})`,
    };
  }
}
