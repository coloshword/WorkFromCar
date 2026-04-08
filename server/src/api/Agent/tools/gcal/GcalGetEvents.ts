import * as z from "zod";

export type gcalGetEventsParameters = {
  timeMin: string;
  timeMax: string;
  maxResults: number | null;
};

export const gcalGetEventsParametersSchema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  maxResults: z.number().nullable(),
}) satisfies z.ZodType<gcalGetEventsParameters>;

export const GCAL_GET_EVENTS_INSTRUCTIONS = `
  1. "gcal.getEvents"
  Use this tool when the user asks about their agenda, schedule, upcoming events, what is on their calendar, or when you need to identify an existing calendar event before using gcal.respondToEvent or gcal.updateEvent.
  This is a SILENT tool. Do not ask for confirmation before using it. Call it immediately when the user is asking to check their calendar.
  When calling this tool, set the "assistant" message to a brief status like "Let me check your calendar." or "Looking up your schedule for [time range]."
  When you decide to use this tool, output JSON with:
  - tool: "gcal.getEvents"
  - toolParameters:
    - timeMin: string — the start of the requested range in ISO 8601 format with UTC offset, e.g. "2026-03-31T00:00:00-04:00"
    - timeMax: string — the end of the requested range in ISO 8601 format with UTC offset
    - maxResults: number | null — how many events to fetch. Default to 10 if null.

  Derive timeMin and timeMax from natural language relative to today's date:
  - "today": start of today through end of today
  - "tomorrow": start of tomorrow through end of tomorrow
  - "this week": start of the current week through end of the current week
  - "next week": start of next week through end of next week
  - "this afternoon" or "this evening": use the corresponding time window today
  - If the user gives specific dates or times, convert them into an exact ISO 8601 range.

  Both timeMin and timeMax MUST be non-null strings. Never emit null for either field.
  After receiving the result:
  - Summarize the events in chronological order.
  - Mention the title, time, and location when useful.
  - When the user is trying to RSVP to an event, use the returned event id, title, and start time to continue with gcal.respondToEvent.
  - When the user wants to edit or reschedule an event, use the returned event id, title, and start time to continue with gcal.updateEvent.
  - If more than one returned event could match the user's request, ask a clarifying question instead of guessing.
  - If no events are returned, tell the user their calendar is clear for that time range.
`;
