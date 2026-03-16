import * as z from "zod";

export type emailGetMessagesParameters = {
  maxResults: number | null;
  query: string | null;
};

export const emailGetMessagesParametersSchema = z.object({
  maxResults: z.number().nullable(),
  query: z.string().nullable(),
}) satisfies z.ZodType<emailGetMessagesParameters>;

export const EMAIL_GET_MESSAGES_INSTRUCTIONS = `
  1. "gmail.getMessages"
  Use this tool when the user asks to read, check, or summarize their emails/inbox.
  This is a silent tool — it fetches emails and returns the results for you to summarize.
  When you decide to use this tool, output JSON with:
  - tool: "gmail.getMessages"
  - toolParameters:
    - maxResults: number | null (how many emails to fetch, default 5 if null, max 10)
    - query: string | null (Gmail search query, e.g. "is:unread", "from:john@example.com", "subject:meeting". null fetches recent emails)

  The tool returns an array of email objects with:
  - from: sender name and email
  - subject: email subject line
  - snippet: short preview of the email body
  - date: when the email was received

  After receiving the result:
  - Summarize the emails concisely in natural spoken language.
  - Mention sender, subject, and a brief gist of each email.
  - If the user asked about specific emails (e.g. unread, from someone), focus on those.
`;
