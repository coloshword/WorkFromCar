import * as z from "zod";

export type gcalDeleteEventParameters = {
  eventId: string | null;
  summary: string | null;
  start: string | null;
};

export const gcalDeleteEventParametersSchema = z.object({
  eventId: z.string().nullable(),
  summary: z.string().nullable(),
  start: z.string().nullable(),
}) satisfies z.ZodType<gcalDeleteEventParameters>;

export const gcalDeleteEventExecutableParametersSchema = z.object({
  eventId: z.string(),
  summary: z.string().nullable(),
  start: z.string().nullable(),
});

export const GCAL_DELETE_EVENT_INSTRUCTIONS = `
  1. "gcal.deleteEvent"
  Use this tool when the user wants to remove or cancel an existing Google Calendar event from their calendar (not merely declining an invite they do not own—use gcal.respondToEvent for RSVP).
  If the event is not already clearly identified, use gcal.getEvents first and use the returned event id. NEVER invent or guess eventId.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string) — a brief spoken confirmation of which event you are about to delete
  - tool: "gcal.deleteEvent"
  - toolParameters:
    - eventId: string | null — the Google Calendar event id from a prior gcal.getEvents result.
    - summary: string | null — the matching event title from gcal.getEvents when available, for confirmation to the user.
    - start: string | null — the matching event start time from gcal.getEvents when available, for confirmation to the user.

  If there are multiple plausible events, ask the user to clarify which one they mean before calling this tool.
  This tool is NOT silent. Before calling it, confirm the event title and time back to the user and that they want it deleted. Only call the tool once the user has confirmed.
  When you see the gcal.deleteEvent result in the conversation:
  - Confirm the event was removed successfully.
  - Mention the event title in natural language.
`;
