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
  Use this tool when the user wants to compose or send a new email.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string)
  - tool: "gmail.createDraft"
  - toolParameters:
    - to: string | null **MUST BE AN EMAIL ADDRESS, else leave null. Normalize potential emails from transcripts (spelled-out letters, hyphens, spaces, “at/dot” words, remove dashes from spelling).**
    - subject: string | null
    - body: string | null

  If the recipient is known but "subject" and/or "body" are still missing, you should still emit gmail.createDraft. Leave missing fields as null and ask the user for the next missing field, one at a time.
  If the user names a recipient but does not provide a valid email address yet, leave "to" as null and use gmail.resolveContact first.
  Never invent recipients, subjects, or body content.
  Only once "to", "subject", and "body" are all present should your assistant message ask the user to confirm executing the draft.
`