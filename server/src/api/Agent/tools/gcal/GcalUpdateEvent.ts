import * as z from "zod";

export type gcalUpdateEventParameters = {
  eventId: string | null;
  summary: string | null;
  start: string | null;
  newSummary: string | null;
  startIso: string | null;
  endIso: string | null;
  timeZone: string | null;
  newLocation: string | null;
  newDescription: string | null;
  attendees: string[] | null;
};

export const gcalUpdateEventParametersSchema = z.object({
  eventId: z.string().nullable(),
  summary: z.string().nullable(),
  start: z.string().nullable(),
  newSummary: z.string().nullable(),
  startIso: z.string().nullable(),
  endIso: z.string().nullable(),
  timeZone: z.string().nullable(),
  newLocation: z.string().nullable(),
  newDescription: z.string().nullable(),
  attendees: z.array(z.string()).nullable(),
}) satisfies z.ZodType<gcalUpdateEventParameters>;

const timeUpdateRefine = (data: gcalUpdateEventParameters) => {
  const anyTime = data.startIso != null || data.endIso != null || data.timeZone != null;
  if (!anyTime) return true;
  return data.startIso != null && data.endIso != null && data.timeZone != null;
};

const hasPatchRefine = (data: gcalUpdateEventParameters) => {
  const timeOk =
    data.startIso != null && data.endIso != null && data.timeZone != null;
  return (
    data.newSummary != null ||
    timeOk ||
    data.newLocation != null ||
    data.newDescription != null ||
    data.attendees != null
  );
};

export const gcalUpdateEventExecutableParametersSchema = z
  .object({
    eventId: z.string(),
    summary: z.string().nullable(),
    start: z.string().nullable(),
    newSummary: z.string().nullable(),
    startIso: z.string().nullable(),
    endIso: z.string().nullable(),
    timeZone: z.string().nullable(),
    newLocation: z.string().nullable(),
    newDescription: z.string().nullable(),
    attendees: z.array(z.string()).nullable(),
  })
  .refine(timeUpdateRefine, {
    message:
      "When updating time, startIso, endIso, and timeZone must all be non-null.",
  })
  .refine(hasPatchRefine, {
    message: "At least one field to update must be non-null.",
  });

export const GCAL_UPDATE_EVENT_INSTRUCTIONS = `
  1. "gcal.updateEvent"
  Use this tool when the user wants to change an existing Google Calendar event: reschedule, rename, change location or description, or change who is invited.
  If the event is not already clearly identified, use gcal.getEvents first and use the returned event id. NEVER invent or guess eventId.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string) — a brief spoken confirmation of the event and the changes you are about to make
  - tool: "gcal.updateEvent"
  - toolParameters:
    - eventId: string | null — the Google Calendar event id from a prior gcal.getEvents result.
    - summary: string | null — the current event title from gcal.getEvents when available, for confirmation to the user.
    - start: string | null — the current event start from gcal.getEvents when available, for confirmation to the user.
    - newSummary: string | null — new title if the user is renaming the event; otherwise null.
    - startIso: string | null — new start datetime in ISO 8601 with UTC offset when changing time; otherwise null. If you set this, you MUST also set endIso and timeZone.
    - endIso: string | null — new end datetime in ISO 8601 with UTC offset when changing time; otherwise null.
    - timeZone: string | null — IANA timezone when changing time (e.g. "America/New_York"); otherwise null.
    - newLocation: string | null — new location or meeting link if the user is changing it; otherwise null.
    - newDescription: string | null — new description or notes if the user is changing them; otherwise null.
    - attendees: string[] | null — full replacement attendee email list if the user is changing guests; otherwise null. Do NOT guess emails; use gmail.resolveContact for unresolved names, same as gcal.createEvent.

  If any of startIso, endIso, or timeZone is non-null, all three MUST be non-null. At least one of newSummary, time fields (all three), newLocation, newDescription, or attendees must be non-null when executing.
  If there are multiple plausible events, ask the user to clarify before calling this tool.
  This tool is NOT silent. Confirm the event and the changes in natural language. Only call the tool once the user has confirmed.
  When you see the gcal.updateEvent result in the conversation:
  - Confirm the calendar was updated successfully.
  - Mention the event title and what changed in natural language.
`;
