import * as z from "zod";

export type gcalRespondToEventParameters = {
  eventId: string | null;
  responseStatus: 'accepted' | 'tentative' | 'declined' | null;
  summary: string | null;
  start: string | null;
};

export const gcalRespondToEventParametersSchema = z.object({
  eventId: z.string().nullable(),
  responseStatus: z.enum(['accepted', 'tentative', 'declined']).nullable(),
  summary: z.string().nullable(),
  start: z.string().nullable(),
}) satisfies z.ZodType<gcalRespondToEventParameters>;

export const gcalRespondToEventExecutableParametersSchema = z.object({
  eventId: z.string(),
  responseStatus: z.enum(['accepted', 'tentative', 'declined']),
  summary: z.string().nullable(),
  start: z.string().nullable(),
});

export const GCAL_RESPOND_TO_EVENT_INSTRUCTIONS = `
  1. "gcal.respondToEvent"
  Use this tool when the user wants to RSVP to an existing Google Calendar event, such as accepting, declining, or marking an invite as maybe/tentative.
  If the event is not already clearly identified in the conversation, use gcal.getEvents first to find the relevant event before continuing to this tool.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string) — a brief spoken confirmation of the event and RSVP you are about to record
  - tool: "gcal.respondToEvent"
  - toolParameters:
    - eventId: string | null — the Google Calendar event id from a prior gcal.getEvents result. NEVER invent or guess this value.
    - responseStatus: "accepted" | "tentative" | "declined" | null — map "yes/accept" to "accepted", "maybe" to "tentative", and "no/decline" to "declined".
    - summary: string | null — the matching event title from gcal.getEvents when available, for confirmation to the user.
    - start: string | null — the matching event start time from gcal.getEvents when available, for confirmation to the user.

  If there are multiple plausible events, ask the user to clarify which one they mean and keep gcal.respondToEvent as the current tool with the responseStatus filled in if known.
  This tool is NOT silent. Before calling it, confirm the event title, time, and RSVP back to the user in natural language. Only call the tool once the user has confirmed.
  When you see the gcal.respondToEvent result in the conversation:
  - Confirm that the RSVP was updated successfully.
  - Mention the event title and the new RSVP status in natural language.
`;
