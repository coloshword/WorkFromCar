import * as z from "zod";

export type emailCreateDraftParameters = {
  to: string | null,
  subject: string | null,
  body: string | null,
};

export const emailCreateDraftParametersSchema = z.object({
  to: z.string().nullable(),
  subject: z.string().nullable(),
  body: z.string().nullable(),
}) satisfies z.ZodType<emailCreateDraftParameters>;

export const EMAIL_CREATE_DRAFT_INSTRUCTIONS = `
  1. "gmail.createDraft"
  When you decide to use this tool, output JSON with:
  - assistantMessage (string)
  - tool: "gmail.createDraft"
  - toolParameters:
    - to: string | null **MUST BE AN EMAIL ADDRESS, else leave null**
    - subject: string | null
    - body: string | null
` 