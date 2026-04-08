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

const gcalUpdateTimeRefine = (data: {
  startIso: string | null;
  endIso: string | null;
  timeZone: string | null;
}) => {
  const anyTime = data.startIso != null || data.endIso != null || data.timeZone != null;
  if (!anyTime) return true;
  return data.startIso != null && data.endIso != null && data.timeZone != null;
};

const gcalUpdateHasPatchRefine = (data: {
  newSummary: string | null;
  startIso: string | null;
  endIso: string | null;
  timeZone: string | null;
  newLocation: string | null;
  newDescription: string | null;
  attendees: string[] | null;
}) => {
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

export const gcalUpdateEventSchema = z
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
  .refine(gcalUpdateTimeRefine, {
    message:
      'When updating time, startIso, endIso, and timeZone must all be non-null.',
  })
  .refine(gcalUpdateHasPatchRefine, {
    message: 'At least one field to update must be non-null.',
  });
