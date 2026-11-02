import { defineSchedule } from "eve/schedules";

import { loadCalendar, todayInCourseTz } from "../lib/calendar.ts";
import { formatDigest } from "../lib/digest.ts";

// Sundays and Wednesdays at 17:00 UTC (9 or 10 AM Pacific, depending on DST).
// Posts a two-week deadline digest to a Slack incoming webhook. The digest is
// built straight from the calendar, so this run makes no model call.
export default defineSchedule({
  cron: "0 17 * * 0,3",
  async run({ waitUntil }) {
    waitUntil(
      (async () => {
        const calendar = await loadCalendar();
        const text = formatDigest(calendar.items, todayInCourseTz(), calendar.source);
        const webhook = process.env.SLACK_WEBHOOK_URL;
        if (!webhook) {
          console.log("[weekly-digest] SLACK_WEBHOOK_URL not set; digest follows:\n" + text);
          return;
        }
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) console.error(`[weekly-digest] Slack webhook returned HTTP ${res.status}`);
      })(),
    );
  },
});
