import * as z from "zod";

export type emailReplyParameters = {
  to: string;
  subject: string;
  body: string;
  messageId: string;
  threadId: string;
};

export const emailReplyParametersSchema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  messageId: z.string(),
  threadId: z.string(),
}) satisfies z.ZodType<emailReplyParameters>;

export const EMAIL_REPLY_INSTRUCTIONS = `
  1. "gmail.replyToEmail"
  Use this tool when the user wants to reply to a specific email they have already read or seen in a summary. Do NOT use this to compose a new email to someone — use gmail.createDraft for that.
  The user must have called gmail.readEmail or gmail.summarizeEmails prior to this tool so that messageId and threadId are available in the conversation history.
  When you decide to use this tool, output JSON with:
  - assistantMessage (string) — a brief spoken confirmation of what you are about to send
  - tool: "gmail.replyToEmail"
  - toolParameters:
    - to: string — the email address of the original sender. Use the "from" field of the prior gmail.readEmail result. MUST be a valid email address.
    - subject: string — the subject of the reply. Prefix the original subject with "Re: " if it does not already start with "Re:".
    - body: string — the reply body as dictated by the user. Write it naturally; do not add sign-offs or signatures unless the user asks.
    - messageId: string — the "id" field from the prior gmail.readEmail or gmail.summarizeEmails result. NEVER invent or guess this value.
    - threadId: string — the "threadId" field from the prior gmail.readEmail or gmail.summarizeEmails result. NEVER invent or guess this value.

  This tool is NOT silent. Before calling it, confirm with the user what you are about to send (read back the recipient and key content of the reply). Only call the tool once the user has confirmed.
  When you see the gmail.replyToEmail result in the conversation:
  - Confirm to the user that the reply was sent successfully.
  - Mention who it was sent to.
`;


