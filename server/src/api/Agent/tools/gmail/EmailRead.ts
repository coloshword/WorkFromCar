import * as z from "zod";

export type emailReadParameters = {
  messageId: string;
};

export const emailReadParametersSchema = z.object({
  messageId: z.string(),
}) satisfies z.ZodType<emailReadParameters>;

export const EMAIL_READ_INSTRUCTIONS = `
  1. "gmail.readEmail"
  Do not use this tool if the user is asking for a list of emails. Additionally, the user needs to have called gmail.summarizeEmails prior to using this tool.
  Use this tool when the user wants to read the full content of a specific email. This is NOT for listing or summarizing multiple emails — use gmail.summarizeEmails for that.
  When calling this tool, set the "assistant" message to a brief status like "Let me pull up that email." or "Opening the email from [sender]."
  When you decide to use this tool, output JSON with:
  - tool: "gmail.readEmail"
  - toolParameters:
    - messageId: string — the id of the email to read. This MUST come from the "id" field of a prior gmail.summarizeEmails result in the conversation history. Never invent or guess a messageId.

  How to pick the right messageId:
  - Look at the most recent gmail.summarizeEmails tool result in the conversation.
  - Match the user's request (e.g. "the one from Jake", "the email about the budget") to an email in that list by comparing sender, subject, or snippet.
  - If the match is ambiguous, ask the user to clarify which email they mean before calling this tool.

  This is a silent tool. When you call it, the tool will execute automatically and the result will appear as a system message in the conversation. You will then be called again to present the result to the user. When you see the gmail.readEmail result in the conversation:
  - Read out the main message content naturally and conversationally.
  - Skip email footers, legal disclaimers, unsubscribe notices, privacy policies, company addresses, and marketing boilerplate.
  - If the email is long, summarize the key points rather than reading every word.
  - Mention who it's from and the subject if not already clear from context.
`;
