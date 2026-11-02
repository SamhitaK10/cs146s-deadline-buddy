import assert from "node:assert/strict";
import { test } from "node:test";

import { daysBetween, loadCalendar, parseCalendar, todayInCourseTz } from "../agent/lib/calendar.ts";
import { CALENDAR_SNAPSHOT } from "../agent/lib/calendar-snapshot.ts";
import { formatDigest } from "../agent/lib/digest.ts";

const items = parseCalendar(CALENDAR_SNAPSHOT, 2026);

test("parses every dated line in the snapshot", () => {
  const datedLines = CALENDAR_SNAPSHOT.split("\n").filter((l) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d/.test(l));
  assert.equal(items.length, datedLines.length);
});

test("finds all four OSS contributions with the right dates", () => {
  const oss = items.filter((i) => i.category === "oss-contribution").map((i) => [i.date, i.title]);
  assert.deepEqual(oss, [
    ["2026-10-18", "OSS Contribution 1 due"],
    ["2026-11-08", "OSS Contribution 2 due"],
    ["2026-11-15", "OSS Contribution 3 due"],
    ["2026-12-06", "OSS Contribution 4 due"],
  ]);
});

test("every printed weekday matches its date", () => {
  assert.deepEqual(items.filter((i) => i.weekdayMismatch), []);
});

test("attaches weeks, notes and times", () => {
  const oss2 = items.find((i) => i.title === "OSS Contribution 2 due")!;
  assert.equal(oss2.week, 7);
  assert.equal(oss2.weekTitle, "Security");

  const mcp = items.find((i) => i.title.startsWith("Full introduction to MCP"))!;
  assert.deepEqual(mcp.notes, ["Ashley from Factory is doing onboarding after class"]);

  const expo = items.find((i) => i.title === "Final Project Expo")!;
  assert.equal(expo.time, "7 - 10 PM");
  assert.equal(expo.isDeadline, false);
});

test("classifies deadlines and non-deadlines", () => {
  const byTitle = (t: string) => items.find((i) => i.title.startsWith(t))!;
  assert.equal(byTitle("Assignment 5").category, "assignment");
  assert.equal(byTitle("Project Alpha Release").category, "project");
  assert.equal(byTitle("No Class").category, "no-class");
  assert.equal(byTitle("Guest: Isaac Evans").category, "guest-lecture");
  assert.equal(byTitle("Guest: Isaac Evans").isDeadline, false);
  assert.equal(items.filter((i) => i.isDeadline).length, 14);
});

test("handles Google Docs export quirks (BOM, CRLF, nbsp)", () => {
  const text = "﻿Week 1: Intro\r\nSun 9/27: Assignment 1 due\r\n";
  const [item] = parseCalendar(text, 2026);
  assert.equal(item.date, "2026-09-27");
  assert.equal(item.week, 1);
});

test("rolls winter months into the next year", () => {
  const [item] = parseCalendar("Mon 1/5: Something due", 2026);
  assert.equal(item.date, "2027-01-05");
});

test("date helpers use Pacific time", () => {
  // 2026-11-02 05:00 UTC is still Nov 1 in Los Angeles.
  assert.equal(todayInCourseTz(new Date("2026-11-02T05:00:00Z")), "2026-11-01");
  assert.equal(daysBetween("2026-11-01", "2026-11-08"), 7);
  assert.equal(daysBetween("2026-11-01", "2026-10-18"), -14);
});

test("falls back to the snapshot when the live doc can't be fetched", async () => {
  const failing = (async () => new Response("nope", { status: 403 })) as typeof fetch;
  const cal = await loadCalendar({ fetchImpl: failing });
  assert.match(cal.source, /^snapshot from 2026-11-01/);
  assert.equal(cal.items.length, items.length);
});

test("rejects a live response with no dated items (e.g. a sign-in page)", async () => {
  const loginPage = (async () => new Response("<html>Sign in</html>")) as typeof fetch;
  const cal = await loadCalendar({ fetchImpl: loginPage });
  assert.match(cal.source, /no dated items/);
});

test("uses the live doc when it parses", async () => {
  const live = (async () => new Response("Week 7: Security\nSun 11/8: OSS Contribution 2 due")) as typeof fetch;
  const cal = await loadCalendar({ fetchImpl: live });
  assert.equal(cal.source, "live");
  assert.equal(cal.items.length, 1);
});

test("digest lists the next two weeks of deadlines", () => {
  const text = formatDigest(items, "2026-11-01", "live");
  assert.match(text, /Assignment 5 \(Agent-Readiness Report\) due \(today\)/);
  assert.match(text, /OSS Contribution 2 due \(in 7 days\)/);
  assert.match(text, /OSS Contribution 3 due \(in 14 days\)/);
  assert.doesNotMatch(text, /Assignment 6/);
  assert.doesNotMatch(text, /Calendar source/);
});
