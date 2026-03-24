import * as z from "zod";

export type gcalCreateEventParameters = {
  summary: string;
  startIso: string;
  endIso: string;
  timeZone: string;
  location: string | null;
  description: string | null;
};

export const gcalCreateEventParametersSchema = z.object({
  summary: z.string(),
  startIso: z.string(),
  endIso: z.string(),
  timeZone: z.string(),
  location: z.string().nullable(),
  description: z.string().nullable(),
}) satisfies z.ZodType<gcalCreateEventParameters>;

export const GCAL_CREATE_EVENT_INSTRUCTIONS = `
  1. "gcal.createEvent"
  Use this tool when the user wants to create, schedule, or add an event to their Google Calendar.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string) — a brief spoken confirmation of what you are about to create, including the title and time
  - tool: "gcal.createEvent"
  - toolParameters:
    - summary: string — the event title as stated by the user. If the user did not provide one, default to "New Event".
    - startIso: string — the start datetime in ISO 8601 format with UTC offset, e.g. "2026-03-24T14:00:00-07:00". Derive from what the user said relative to today's date. If the user did not specify a time, default to the next whole hour from now.
    - endIso: string — the end datetime in ISO 8601 format with UTC offset. If the user gives a duration, calculate from startIso. Default to 1 hour after startIso if not specified.
    - timeZone: string — IANA timezone name, e.g. "America/New_York". Infer from context if possible. Default to "America/New_York" if unknown.
    - location: string | null — the event location or meeting link if mentioned. Leave null otherwise.
    - description: string | null — any additional notes or details the user mentioned. Leave null otherwise.

  ALL of summary, startIso, endIso, and timeZone MUST be non-null strings. Never emit null for these fields — use the defaults above instead.
  This tool is NOT silent. Before calling it, confirm the event title and time back to the user in natural language. Only call the tool once the user has confirmed.
  When you see the gcal.createEvent result in the conversation:
  - Confirm the event was created successfully.
  - Speak back the event title and the scheduled time in natural language (e.g. "I've added Meeting with Sarah to your calendar for tomorrow at 2 PM").
`;
