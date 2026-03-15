import * as z from "zod";

export type resolveContactParameters = {
  value: string;
}

export const resolveContactParametersSchema = z.object({
  value: z.string(),
}) satisfies z.ZodType<resolveContactParameters>;

export const RESOLVE_CONTACT_INSTRUCTIONS = `
  1. "gmail.resolveContact"
  This tool resolves a contact name or email to a verified email address. Always call this tool before using gmail.createDraft to confirm the recipient.
  When you decide to use this tool, output JSON with:
  - value: string (the name or email to resolve)

  The tool returns a result with:
  - status: "resolved" | "no_match"
  - resolvedEmail: the verified email address (present when status is "resolved")
  - suggestions: array of top matches with name and email (may contain multiple matches)

  After receiving the result:
  - If status is "resolved": use resolvedEmail as the "to" parameter in gmail.createDraft. If there are multiple entries in suggestions, briefly tell the user which matches were found and which one you are using, then proceed to call gmail.createDraft immediately without waiting for confirmation.
  - If status is "no_match": ask the user to spell out the email address.
`;
