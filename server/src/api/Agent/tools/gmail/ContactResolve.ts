import * as z from "zod";

export type contactResolveParameters = {
  name: string | null;
};

export const contactResolveParametersSchema = z.object({
  name: z.string().nullable(),
}) satisfies z.ZodType<contactResolveParameters>;

export const CONTACT_RESOLVE_INSTRUCTIONS = `
  2. "gmail.resolveContact"
  Use this tool automatically when the user refers to a recipient by name instead of an email address.
  Call this BEFORE "gmail.createDraft" whenever "to" would be null because you only have a name.
  This tool runs silently in the background — the user will not see it. Once the result is returned,
  use the resolved email address to continue filling in "gmail.createDraft".
  When you decide to use this tool, output JSON with:
  - tool: "gmail.resolveContact"
  - toolParameters:
    - name: string | null — the full name (or best guess) as the user said it

  If this tool returns no_match or an error:
  - Do NOT call it again with the same name.
  - Set tool to null and ask the user to spell the recipient's email address.
`;
