import { httpAction } from "./_generated/server";
import fetch from "node-fetch";
import * as ical from "node-ical";
import { Calendar, Event } from "ics";

const utsTimetableUrl = "https://example.uts.edu/timetable.ics";

export const getCalendar = httpAction(async (ctx, request) => {
  try {
    const res = await fetch(utsTimetableUrl);
    if (!res.ok) {
      return new Response("Failed to fetch UTS timetable", { status: 500 });
    }
    const utsIcs = await res.text();

    const parsed = ical.sync.parseICS(utsIcs);
    const events: Event[] = [];

    for (const key in parsed) {
      const item = parsed[key];
      if (item.type === "VEVENT") {
        const start = item.start as Date;
        const end = item.end as Date;

        events.push({
          title: item.summary || "Class",
          start: [
            start.getFullYear(),
            start.getMonth() + 1,
            start.getDate(),
            start.getHours(),
            start.getMinutes(),
          ],
          end: [
            end.getFullYear(),
            end.getMonth() + 1,
            end.getDate(),
            end.getHours(),
            end.getMinutes(),
          ],
          location: item.location || "",
          description: item.description || "",
        });
      }
    }

    const { error, value } = Calendar({ events });
    if (error) throw error;

    return new Response(value, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "inline; filename=calendar.ics",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error generating calendar", { status: 500 });
  }
});