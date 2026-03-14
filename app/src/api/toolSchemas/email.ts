import * as z from "zod";

export const emailCreateDraftSchema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

export const resolveContactParametersSchema = z.object({
  value: z.string(),
});
