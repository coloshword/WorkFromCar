import * as z from "zod";

export type resolveContactParameters = {
  value: string;
}

export const resolveContactParametersSchema = z.object({
  value: z.string(),
}) satisfies z.ZodType<resolveContactParameters>;

export const RESOLVE_CONTACT_INSTRUCTIONS = `
  1. "gmail.resolveContact"
  This tool is used to resolve a contact from a string. The string can be the name of a contact, or an email. Make sure to call this tool to confirm the value of the contact.
  If this tool cannot resolve the contact, ask the user to spell the email.
  When you decide to use this tool, output JSON with:
  - value: string
`;
