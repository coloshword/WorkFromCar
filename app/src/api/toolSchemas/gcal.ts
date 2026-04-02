import * as z from "zod";

export const gcalCreateEventSchema = z.object({
  summary: z.string(),
  startIso: z.string(),
  endIso: z.string(),
  timeZone: z.string(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  attendees: z.array(z.string()).nullable(),
});

export const gcalGetEventsSchema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  maxResults: z.number().nullable(),
});

export const gcalRespondToEventSchema = z.object({
  eventId: z.string(),
  responseStatus: z.enum(['accepted', 'tentative', 'declined']),
  summary: z.string().nullable(),
  start: z.string().nullable(),
});
