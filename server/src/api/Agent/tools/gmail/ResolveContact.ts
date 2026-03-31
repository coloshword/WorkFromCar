import * as z from "zod";

export type resolveContactParameters = {
  value: string;
}

export const resolveContactParametersSchema = z.object({
  value: z.string(),
}) satisfies z.ZodType<resolveContactParameters>;

export const RESOLVE_CONTACT_INSTRUCTIONS = `
  1. "gmail.resolveContact"
  This tool resolves a contact name or email to a verified email address. Use it whenever a downstream tool needs an email address for an email recipient or calendar attendee.
  When you decide to use this tool, output JSON with:
  - value: string (the name or email to resolve)

  The tool returns a result with:
  - status: "resolved" | "no_match"
  - resolvedEmail: the verified email address (present when status is "resolved")
  - suggestions: array of top matches with name and email (may contain multiple matches)

  After receiving the result:
  - If status is "resolved": use resolvedEmail in the downstream tool you are building immediately.
  - If status is "resolved" for gmail.createDraft: immediately continue by emitting gmail.createDraft in the same planning step. Set "to" to resolvedEmail. If "subject" or "body" is still missing, leave that field null and ask the user for the next missing field. Do not return tool: null just because those fields are still missing.
  - If status is "resolved" for gmail.replyToEmail or gmail.forwardEmail: immediately continue with that downstream tool and use resolvedEmail as the "to" parameter.
  - If status is "resolved" for gcal.createEvent: add resolvedEmail to the "attendees" array and preserve any attendees you already resolved earlier in the conversation.
  - If status is "resolved" and other recipients or attendees from the user's request are still unresolved, immediately call gmail.resolveContact again for the next unresolved person instead of asking for confirmation yet.
  - If status is "no_match": ask the user to spell out that person's email address.
`;
