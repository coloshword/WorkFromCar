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
