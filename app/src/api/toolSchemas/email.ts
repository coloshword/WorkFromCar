import * as z from "zod";

export const emailCreateDraftSchema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

export const resolveContactParametersSchema = z.object({
  value: z.string(),
});

export const emailSummarizeParametersSchema = z.object({
  query: z.string().nullable(),
  maxResults: z.number().nullable(),
});
