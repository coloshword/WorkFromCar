import * as z from "zod";

export type emailForwardParameters = {
  messageId: string;
  to: string | null;
};

export const emailForwardParametersSchema = z.object({
  messageId: z.string(),
  to: z.string().nullable(),
}) satisfies z.ZodType<emailForwardParameters>;

export const EMAIL_FORWARD_INSTRUCTIONS = `
  1. "gmail.forwardEmail"
  Use this tool when the user wants to forward a specific email to someone else. The user must have previously called gmail.readEmail or gmail.summarizeEmails so that messageId is available in the conversation history.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string) — a brief spoken confirmation of what you are about to forward and to whom
  - tool: "gmail.forwardEmail"
  - toolParameters:
    - messageId: string — the "id" field of the email to forward from a prior gmail.readEmail or gmail.summarizeEmails result. NEVER invent or guess this value.
    - to: string | null — the recipient email address. **MUST BE AN EMAIL ADDRESS, else leave null. Normalize potential emails from transcripts (spelled-out letters, hyphens, spaces, "at/dot" words, remove dashes from spelling).** If the user refers to a contact by name, set to null and use gmail.resolveContact first.

  This tool is NOT silent. Before calling it, confirm with the user what you are about to forward and to whom. Only call the tool once the user has confirmed.
  When you see the gmail.forwardEmail result in the conversation:
  - Confirm to the user that the email was forwarded successfully.
  - Mention who it was forwarded to.
`;
